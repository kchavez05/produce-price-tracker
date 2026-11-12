-- Shared source data only. No browser-role access or personal records.
create table public.usda_report_catalog (
  slug text primary key check (slug ~ '^[0-9]+$'),
  title text not null,
  enabled boolean not null default false,
  validated_at timestamptz,
  config jsonb not null,
  updated_at timestamptz not null default now(),
  check (not enabled or validated_at is not null)
);
create table public.usda_catalog_revisions (
  id bigint generated always as identity primary key,
  slug text not null,
  recorded_at timestamptz not null default now(),
  definition jsonb not null
);
create function public.audit_usda_catalog() returns trigger language plpgsql security invoker set search_path='' as $$
begin
  insert into public.usda_catalog_revisions(slug,definition) values(new.slug,to_jsonb(new));
  return new;
end $$;
create trigger usda_catalog_audit after insert or update on public.usda_report_catalog for each row execute function public.audit_usda_catalog();
create table public.market_ingestion_runs (
  id uuid primary key default gen_random_uuid(), cycle date not null,
  trigger text not null check(trigger in ('scheduled','recovery','backfill')),
  reason text not null, status text not null default 'running' check(status in ('running','succeeded','partial','unchanged','failed','abandoned')),
  started_at timestamptz not null default now(), completed_at timestamptz,
  request_count integer not null default 0 check(request_count between 0 and 20), outcomes jsonb not null default '{}'
);
create table public.market_ingestion_claims (
  cycle date primary key, run_id uuid not null references public.market_ingestion_runs(id),
  expires_at timestamptz not null
);
create table public.usda_report_versions (
  id uuid primary key default gen_random_uuid(), slug text not null references public.usda_report_catalog(slug),
  period_start date not null, period_end date not null check(period_end >= period_start),
  published_at timestamp not null, fetched_at timestamptz not null default now(),
  content_hash text not null check(content_hash ~ '^[a-f0-9]{64}$'),
  adapter_version text not null, config_snapshot jsonb not null, payload jsonb not null check(octet_length(payload::text)<=4000000),
  validation text not null check(validation in ('usable','unmapped','quarantined')),
  unique(slug, period_start,period_end,content_hash,adapter_version)
);
create index usda_versions_period on public.usda_report_versions(slug,period_end desc,published_at desc);
create table public.usda_observations (
  version_id uuid not null references public.usda_report_versions(id), row_key text not null,
  ingredient_id text not null, region text not null check(region in ('MOUNTAIN','NATIONAL')),
  metric text not null check(metric='retail_advertised_price'),
  value numeric not null check(value>0 and value<'Infinity'::numeric), unit text not null check(unit in ('lb','doz')),
  feature_pct numeric check(feature_pct between 0 and 100),
  original jsonb not null, mapping_version text not null,
  primary key(version_id,row_key,mapping_version)
);
create index usda_observations_ingredient on public.usda_observations(ingredient_id,region,version_id);
create table public.usda_cycle_publications (
  id bigint generated always as identity primary key,
  cycle date not null, slug text not null references public.usda_report_catalog(slug),
  version_id uuid not null references public.usda_report_versions(id), run_id uuid not null references public.market_ingestion_runs(id),
  published_at timestamptz not null default now(), unique(run_id,slug,version_id)
);
create index usda_publications_latest on public.usda_cycle_publications(slug,published_at desc);
create table public.market_offer_observations (
  id bigint generated always as identity primary key, zip_code text not null check(zip_code ~ '^[0-9]{5}$'),
  source text not null check(source in ('FLIPP_LIVE','KROGER_API')), source_offer_id text not null,
  ingredient_id text not null, store text not null, location_label text not null,
  source_from text not null, source_to text not null, observed_at timestamptz not null,
  cycle date not null, unit text not null check(unit in ('lb','doz')),
  normalized_price numeric not null check(normalized_price>0 and normalized_price<'Infinity'::numeric),
  content_hash text not null check(content_hash ~ '^[a-f0-9]{64}$'), payload jsonb not null,
  provenance text not null default 'verified_live' check(provenance='verified_live'),
  unique(zip_code,source,source_offer_id,content_hash,cycle)
);
create index market_offer_history on public.market_offer_observations(zip_code,cycle,ingredient_id,store);

create table public.market_legacy_imports (
  id uuid primary key default gen_random_uuid(), snapshot_sha256 text not null unique,
  imported_at timestamptz not null default now(), counts jsonb not null
);
create table public.market_legacy_rows (
  import_id uuid not null references public.market_legacy_imports(id), row_key text not null,
  provenance text not null check(provenance in ('synthetic_seed','legacy_unverified')), payload jsonb not null,
  primary key(import_id,row_key)
);

create table public.market_offer_receipts (
  id bigint generated always as identity primary key, observation_id bigint not null references public.market_offer_observations(id),
  retrieved_at timestamptz not null default now()
);
create index market_offer_receipts_observation on public.market_offer_receipts(observation_id,retrieved_at desc);
create function public.archive_market_offers(p_rows jsonb) returns integer language plpgsql security invoker set search_path='' as $$
declare x jsonb; observation bigint; n integer:=0;
begin
  if jsonb_array_length(p_rows)>1000 then raise exception 'archive_batch_limit'; end if;
  for x in select value from jsonb_array_elements(p_rows) loop
    insert into public.market_offer_observations(zip_code,source,source_offer_id,ingredient_id,store,location_label,source_from,source_to,
      observed_at,cycle,unit,normalized_price,content_hash,payload)
      values(x->>'zip_code',x->>'source',x->>'source_offer_id',x->>'ingredient_id',x->>'store',x->>'location_label',x->>'source_from',x->>'source_to',
        (x->>'observed_at')::timestamptz,(x->>'cycle')::date,x->>'unit',(x->>'normalized_price')::numeric,x->>'content_hash',x->'payload')
      on conflict(zip_code,source,source_offer_id,content_hash,cycle) do nothing returning id into observation;
    if observation is null then
      select id into observation from public.market_offer_observations where zip_code=x->>'zip_code' and source=x->>'source'
        and source_offer_id=x->>'source_offer_id' and content_hash=x->>'content_hash' and cycle=(x->>'cycle')::date;
    end if;
    insert into public.market_offer_receipts(observation_id) values(observation);
    n:=n+1;
  end loop;
  return n;
end $$;
revoke all on function public.archive_market_offers(jsonb) from public,anon,authenticated;
grant execute on function public.archive_market_offers(jsonb) to service_role;

create function public.claim_usda_run(p_cycle date,p_trigger text,p_reason text) returns uuid language plpgsql security invoker set search_path='' as $$
declare c public.market_ingestion_claims; r uuid;
begin
  perform pg_advisory_xact_lock(72819, (p_cycle-date '2000-01-01')::integer);
  select * into c from public.market_ingestion_claims where cycle=p_cycle for update;
  if c.run_id is not null then
    if c.expires_at>clock_timestamp() then return null; end if;
    if p_trigger='scheduled' then return null; end if; -- recovery requires operator action, even after a crash
    update public.market_ingestion_runs set status='abandoned',completed_at=now() where id=c.run_id and status='running';
  end if;
  if p_trigger not in ('scheduled','recovery','backfill') or length(trim(p_reason))<3 then raise exception 'invalid_trigger'; end if;
  insert into public.market_ingestion_runs(cycle,trigger,reason) values(p_cycle,p_trigger,p_reason) returning id into r;
  insert into public.market_ingestion_claims values(p_cycle,r,clock_timestamp()+interval '120 seconds')
    on conflict(cycle) do update set run_id=excluded.run_id,expires_at=excluded.expires_at;
  return r;
end $$;

create function public.publish_usda_report(p_run uuid,p_report jsonb,p_rows jsonb) returns text language plpgsql security invoker set search_path='' as $$
declare r public.market_ingestion_runs; v uuid; old public.usda_report_versions; validation text; c public.usda_report_catalog;
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
  -- Backfill retains history without changing the active selection.
  if r.trigger<>'backfill' then
    insert into public.usda_cycle_publications(cycle,slug,version_id,run_id) values(r.cycle,c.slug,v,p_run) on conflict do nothing;
  end if;
  return case when v=old.id then 'unchanged' else 'published' end;
end $$;

create function public.finish_usda_run(p_run uuid,p_status text,p_requests integer,p_outcomes jsonb) returns void language plpgsql security invoker set search_path='' as $$
begin
  if p_status not in ('succeeded','partial','unchanged','failed') then raise exception 'invalid_status'; end if;
  perform 1 from public.market_ingestion_claims where run_id=p_run and expires_at>clock_timestamp() for update;
  if not found then raise exception 'lease_lost'; end if;
  update public.market_ingestion_runs set status=p_status,request_count=p_requests,outcomes=p_outcomes,completed_at=now() where id=p_run and status='running';
  update public.market_ingestion_claims set expires_at=now() where run_id=p_run;
end $$;

create function public.read_usda_benchmarks() returns jsonb language sql stable security invoker set search_path='' as $$
  with latest as (select distinct on (slug) slug,version_id,published_at from public.usda_cycle_publications order by slug,id desc)
  select coalesce(jsonb_agg(jsonb_build_object('slug',v.slug,'version_id',v.id,'period_end',v.period_end,'published_at',v.published_at,
    'fetched_at',v.fetched_at,'checked_at',p.published_at,'config',v.config_snapshot,'ingredient_id',o.ingredient_id,'region',o.region,'value',o.value,
    'unit',o.unit,'feature_pct',o.feature_pct,'row_key',o.row_key,'original',o.original)), '[]')
  from latest p join public.usda_report_versions v on v.id=p.version_id join public.usda_observations o on o.version_id=v.id
  join public.usda_report_catalog c on c.slug=p.slug where c.enabled and v.validation='usable';
$$;
create function public.read_market_history(p_zip text,p_start date,p_end date) returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare result jsonb;
begin
  if p_end-p_start>42 or p_start>p_end then raise exception 'history_window_limit'; end if;
  select coalesce(jsonb_agg(t),'[]') into result from (
    select ingredient_id,cycle,store,min(normalized_price) as price from (
      select distinct on (o.source,o.source_offer_id,o.store,o.location_label,o.cycle) o.* from public.market_offer_observations o
      join public.market_offer_receipts receipt on receipt.observation_id=o.id
      where o.zip_code=p_zip and o.cycle between p_start and p_end
      order by o.source,o.source_offer_id,o.store,o.location_label,o.cycle,receipt.retrieved_at desc,receipt.id desc
    ) current_versions group by ingredient_id,cycle,store
  ) t;
  return result;
end $$;

create function public.read_usda_history(p_start date,p_end date) returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare result jsonb;
begin
  if p_end-p_start>42 or p_start>p_end then raise exception 'history_window_limit'; end if;
  with latest as (select distinct on (slug,period_start,period_end) * from public.usda_report_versions
    where validation='usable' and period_end between p_start and p_end order by slug,period_start,period_end,published_at desc,fetched_at desc)
  select coalesce(jsonb_agg(jsonb_build_object('slug',v.slug,'version_id',v.id,'period_end',v.period_end,'fetched_at',v.fetched_at,'checked_at',v.fetched_at,
    'config',v.config_snapshot,'ingredient_id',o.ingredient_id,'region',o.region,'value',o.value,'unit',o.unit,'feature_pct',o.feature_pct,'original',o.original)), '[]') into result
  from latest v join public.usda_observations o on o.version_id=v.id join public.usda_report_catalog c on c.slug=v.slug;
  return result;
end $$;
revoke all on function public.read_usda_history(date,date) from public,anon,authenticated;
grant execute on function public.read_usda_history(date,date) to service_role;

-- Server-only grants; invoker functions cannot escalate browser roles.
do $$ declare t text; begin
  foreach t in array array['usda_report_catalog','usda_catalog_revisions','market_ingestion_runs','market_ingestion_claims',
    'usda_report_versions','usda_observations','usda_cycle_publications','market_offer_observations','market_legacy_imports','market_legacy_rows','market_offer_receipts'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from public,anon,authenticated',t);
    execute format('grant select,insert,update on public.%I to service_role',t);
  end loop;
end $$;
grant usage,select on sequence public.usda_catalog_revisions_id_seq,public.usda_cycle_publications_id_seq,public.market_offer_observations_id_seq,public.market_offer_receipts_id_seq to service_role;
revoke update on public.usda_report_versions,public.usda_observations,public.usda_cycle_publications,public.usda_catalog_revisions,public.market_offer_observations,public.market_legacy_imports,public.market_legacy_rows,public.market_offer_receipts from service_role;
revoke all on function public.audit_usda_catalog(),public.claim_usda_run(date,text,text),public.publish_usda_report(uuid,jsonb,jsonb),
 public.finish_usda_run(uuid,text,integer,jsonb),public.read_usda_benchmarks(),public.read_market_history(text,date,date) from public,anon,authenticated;
grant execute on function public.audit_usda_catalog(),public.claim_usda_run(date,text,text),public.publish_usda_report(uuid,jsonb,jsonb),
 public.finish_usda_run(uuid,text,integer,jsonb),public.read_usda_benchmarks(),public.read_market_history(text,date,date) to service_role;

notify pgrst, 'reload schema';
