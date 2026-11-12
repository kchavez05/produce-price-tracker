-- Append-only admission lets backfills accept old quarantined content without rewriting raw evidence.
create table public.usda_version_acceptances (
  version_id uuid primary key references public.usda_report_versions(id),
  run_id uuid not null references public.market_ingestion_runs(id),
  purpose text not null check(purpose in ('published','backfill')),
  accepted_at timestamptz not null default now()
);
create index usda_acceptances_run on public.usda_version_acceptances(run_id);
alter table public.usda_version_acceptances enable row level security;
revoke all on public.usda_version_acceptances from public,anon,authenticated;
grant select,insert on public.usda_version_acceptances to service_role;

create or replace function public.publish_usda_report(p_run uuid,p_report jsonb,p_rows jsonb) returns text language plpgsql security invoker set search_path='' as $$
declare r public.market_ingestion_runs; v uuid; old public.usda_report_versions; validation text; c public.usda_report_catalog; previous public.usda_report_versions;
begin
  select * into r from public.market_ingestion_runs where id=p_run;
  perform 1 from public.market_ingestion_claims where cycle=r.cycle and run_id=p_run and expires_at>clock_timestamp() for update;
  if not found or r.status<>'running' then raise exception 'lease_lost'; end if;
  select * into c from public.usda_report_catalog where slug=p_report->>'slug' and enabled and validated_at is not null for update;
  if not found then raise exception 'report_not_validated'; end if;
  if p_report->>'adapter_version' is distinct from c.config->>'adapterVersion' then raise exception 'adapter_version_mismatch'; end if;
  if (p_report->>'period_end')::date > current_date or (p_report->>'published_at')::timestamp::date>current_date then raise exception 'future_report'; end if;
  select x.* into old from public.usda_cycle_publications pub join public.usda_report_versions x on x.id=pub.version_id
    where pub.slug=c.slug order by pub.id desc limit 1;
  select * into previous from public.usda_report_versions where slug=c.slug
    and period_start=(p_report->>'period_start')::date and period_end=(p_report->>'period_end')::date
    and content_hash=p_report->>'content_hash' and adapter_version=p_report->>'adapter_version';
  -- Replaying a previously accepted revision is not a new ordering conflict.
  if previous.id is not null and (previous.validation='usable' or exists(
    select 1 from public.usda_version_acceptances a where a.version_id=previous.id)) then
    if r.trigger='backfill' then return 'unchanged'; end if;
    if old.id is not null and (previous.period_end<old.period_end or
      (previous.period_end=old.period_end and previous.published_at<=old.published_at)) then
      if previous.id=old.id then
        insert into public.usda_cycle_publications(cycle,slug,version_id,run_id)
          values(r.cycle,c.slug,previous.id,p_run) on conflict do nothing;
      end if;
      return 'unchanged';
    end if;
  end if;
  validation := case when jsonb_array_length(p_rows)>0 then 'usable' else 'unmapped' end;
  if r.trigger<>'backfill' and old.id is not null and ((p_report->>'period_end')::date < old.period_end or
    ((p_report->>'period_end')::date=old.period_end and (p_report->>'published_at')::timestamp<=old.published_at and p_report->>'content_hash'<>old.content_hash)) then
    validation := 'quarantined';
  end if;
  insert into public.usda_report_versions(slug,period_start,period_end,published_at,content_hash,adapter_version,config_snapshot,payload,validation)
    values(c.slug,(p_report->>'period_start')::date,(p_report->>'period_end')::date,(p_report->>'published_at')::timestamp,
      p_report->>'content_hash',p_report->>'adapter_version',c.config,p_report->'payload',validation)
    on conflict(slug,period_start,period_end,content_hash,adapter_version) do nothing returning id into v;
  if v is null then select id into v from public.usda_report_versions where slug=c.slug and period_start=(p_report->>'period_start')::date
    and period_end=(p_report->>'period_end')::date and content_hash=p_report->>'content_hash' and adapter_version=p_report->>'adapter_version'; end if;
  if validation<>'usable' then return validation; end if;
  insert into public.usda_observations(version_id,row_key,ingredient_id,region,metric,value,unit,feature_pct,original,mapping_version)
    select v,x.row_key,x.ingredient_id,x.region,'retail_advertised_price',x.value,x.unit,x.feature_pct,x.original,p_report->>'adapter_version'
    from jsonb_to_recordset(p_rows) x(row_key text,ingredient_id text,region text,value numeric,unit text,feature_pct numeric,original jsonb)
    on conflict do nothing;
  -- Admission is append-only and separate from the immutable initial classification.
  -- Explicit backfill can make an older quarantined version queryable without promoting it.
  insert into public.usda_version_acceptances(version_id,run_id,purpose)
    values(v,p_run,case when r.trigger='backfill' then 'backfill' else 'published' end) on conflict do nothing;
  -- Backfill retains history without changing the active selection.
  if r.trigger<>'backfill' then
    insert into public.usda_cycle_publications(cycle,slug,version_id,run_id) values(r.cycle,c.slug,v,p_run) on conflict do nothing;
  end if;
  return case when v=old.id then 'unchanged' else 'published' end;
end $$;

create or replace function public.read_usda_benchmarks() returns jsonb language sql stable security invoker set search_path='' as $$
  with latest as (select distinct on (slug) slug,version_id,published_at from public.usda_cycle_publications order by slug,id desc)
  select coalesce(jsonb_agg(jsonb_build_object('slug',v.slug,'version_id',v.id,'period_end',v.period_end,'published_at',v.published_at,
    'fetched_at',v.fetched_at,'checked_at',p.published_at,'config',v.config_snapshot,'ingredient_id',o.ingredient_id,'region',o.region,'value',o.value,
    'unit',o.unit,'feature_pct',o.feature_pct,'row_key',o.row_key,'original',o.original)), '[]')
  from latest p join public.usda_report_versions v on v.id=p.version_id join public.usda_observations o on o.version_id=v.id
  join public.usda_report_catalog c on c.slug=p.slug where c.enabled and (v.validation='usable' or exists(select 1 from public.usda_version_acceptances a where a.version_id=v.id));
$$;
create or replace function public.read_usda_history(p_start date,p_end date) returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare result jsonb;
begin
  if p_end-p_start>42 or p_start>p_end then raise exception 'history_window_limit'; end if;
  with latest as (select distinct on (slug,period_start,period_end) * from public.usda_report_versions v
    where (validation='usable' or exists(select 1 from public.usda_version_acceptances a where a.version_id=v.id)) and period_end between p_start and p_end order by slug,period_start,period_end,published_at desc,fetched_at desc)
  select coalesce(jsonb_agg(jsonb_build_object('slug',v.slug,'version_id',v.id,'period_end',v.period_end,'fetched_at',v.fetched_at,'checked_at',v.fetched_at,
    'config',v.config_snapshot,'ingredient_id',o.ingredient_id,'region',o.region,'value',o.value,'unit',o.unit,'feature_pct',o.feature_pct,'original',o.original)), '[]') into result
  from latest v join public.usda_observations o on o.version_id=v.id join public.usda_report_catalog c on c.slug=v.slug;
  return result;
end $$;
revoke all on function public.publish_usda_report(uuid,jsonb,jsonb),public.read_usda_benchmarks(),public.read_usda_history(date,date) from public,anon,authenticated;
grant execute on function public.publish_usda_report(uuid,jsonb,jsonb),public.read_usda_benchmarks(),public.read_usda_history(date,date) to service_role;
notify pgrst,'reload schema';
