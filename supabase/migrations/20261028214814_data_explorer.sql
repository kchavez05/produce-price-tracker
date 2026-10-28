-- Read-only server projections. Existing RLS/browser-role restrictions remain intact.
create function public.read_data_explorer(p_zip text,p_ingredient text,p_start date,p_end date,p_asof timestamptz)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare reports jsonb; observations jsonb; offers jsonb; result jsonb;
begin
  if p_zip !~ '^[0-9]{5}$' or length(p_ingredient)>100 or p_start>p_end or p_end-p_start>83
    or p_asof>statement_timestamp() or p_asof<statement_timestamp()-interval '1 day' then raise exception 'explorer_invalid_window'; end if;
  select coalesce(jsonb_agg(t order by t.period_end,t.slug,t.id),'[]') into reports from (
    select v.id,v.slug,c.title,v.period_start,v.period_end,v.published_at,v.fetched_at,v.adapter_version,v.validation,
      v.config_snapshot as config,
      (v.validation='usable' or exists(select 1 from public.usda_version_acceptances a where a.version_id=v.id and a.accepted_at<=p_asof)) as accepted,
      c.enabled and exists(select 1 from public.usda_cycle_publications pub where pub.version_id=v.id and pub.published_at<=p_asof
        and pub.id=(select max(p2.id) from public.usda_cycle_publications p2 where p2.slug=v.slug and p2.published_at<=p_asof)) as active
    from public.usda_report_versions v join public.usda_report_catalog c on c.slug=v.slug
    where v.period_end between p_start and p_end and v.fetched_at<=p_asof
    order by v.period_end,v.slug,v.id limit 501
  ) t;
  if jsonb_array_length(reports)>500 then raise exception 'explorer_report_limit'; end if;
  select coalesce(jsonb_agg(t order by t.version_id,t.row_key),'[]') into observations from (
    select o.version_id,o.row_key,o.ingredient_id,o.region,o.value,o.unit,o.feature_pct,o.original,o.mapping_version
    from public.usda_observations o join public.usda_report_versions v on v.id=o.version_id
    where v.period_end between p_start and p_end and v.fetched_at<=p_asof and o.ingredient_id=p_ingredient
    order by o.version_id,o.row_key limit 10001
  ) t;
  select coalesce(jsonb_agg(t order by t.id),'[]') into offers from (
    select o.id,o.zip_code,o.source,o.source_offer_id,o.ingredient_id,o.store,o.location_label,o.source_from,o.source_to,
      o.cycle,o.unit,o.normalized_price,o.payload,
      (select r.retrieved_at from public.market_offer_receipts r where r.observation_id=o.id and r.retrieved_at<=p_asof order by r.retrieved_at desc,r.id desc limit 1) as retrieved_at,
      (select r.id from public.market_offer_receipts r where r.observation_id=o.id and r.retrieved_at<=p_asof order by r.retrieved_at desc,r.id desc limit 1) as receipt_id,
      (select count(*) from public.market_offer_receipts r where r.observation_id=o.id and r.retrieved_at<=p_asof) as receipt_count,
      (select coalesce(jsonb_agg(x order by x.retrieved_at,x.id),'[]') from
        (select r.id,r.retrieved_at from public.market_offer_receipts r where r.observation_id=o.id and r.retrieved_at<=p_asof order by r.retrieved_at desc,r.id desc limit 100) x) as receipts
    from public.market_offer_observations o where o.zip_code=p_zip and o.ingredient_id=p_ingredient and o.cycle between p_start and p_end
      and exists(select 1 from public.market_offer_receipts r where r.observation_id=o.id and r.retrieved_at<=p_asof)
    order by o.id limit 10001
  ) t;
  if jsonb_array_length(observations)>10000 or jsonb_array_length(offers)>10000 then raise exception 'explorer_row_limit'; end if;
  result:=jsonb_build_object('reports',reports,'observations',observations,'offers',offers);
  if octet_length(result::text)>3500000 then raise exception 'explorer_size_limit'; end if;
  return result;
end $$;
revoke all on function public.read_data_explorer(text,text,date,date,timestamptz) from public,anon,authenticated;
grant execute on function public.read_data_explorer(text,text,date,date,timestamptz) to service_role;
notify pgrst,'reload schema';
