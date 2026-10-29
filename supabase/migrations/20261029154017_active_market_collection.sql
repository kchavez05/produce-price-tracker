-- Shared market interest contains ZIPs only, never account identities.
create table public.active_markets (
 zip_code text primary key check (zip_code ~ '^[0-9]{5}$'),
 first_requested_at timestamptz not null default now(),
 last_requested_at timestamptz not null default now(),
 next_refresh_at timestamptz not null default now(),
 last_collected_at timestamptz,
 last_status text,
 lease_id uuid,
 lease_until timestamptz
);
alter table public.active_markets enable row level security;
revoke all on public.active_markets from public, anon, authenticated;
grant all on public.active_markets to service_role;

create function public.request_active_market(p_zip text) returns void
language plpgsql security invoker set search_path = public as $$
begin
 if p_zip !~ '^[0-9]{5}$' then raise exception 'invalid_zip'; end if;
 -- Serialize admission to keep the initial global collection budget bounded.
 perform pg_advisory_xact_lock(541501);
 if exists(select 1 from active_markets where zip_code=p_zip and last_requested_at > now()-interval '30 days')
 or (select count(*) from active_markets where last_requested_at > now()-interval '30 days') < 100 then
   insert into active_markets(zip_code) values(p_zip)
   on conflict(zip_code) do update set last_requested_at=now()
   where active_markets.last_requested_at < now()-interval '1 hour';
 end if;
end $$;

create function public.claim_active_markets(p_zip text, p_limit integer)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare result jsonb;
begin
 with due as (
   select zip_code from active_markets
   where last_requested_at > now()-interval '30 days' and next_refresh_at <= now()
   and (lease_until is null or lease_until < now()) and (p_zip = '' or zip_code=p_zip)
   order by next_refresh_at, zip_code for update skip locked limit least(greatest(p_limit,1),3)
 ), claimed as (
   update active_markets m set lease_id=gen_random_uuid(),lease_until=now()+interval '15 minutes'
   from due where m.zip_code=due.zip_code returning m.zip_code,m.lease_id
 ) select coalesce(jsonb_agg(to_jsonb(claimed)), '[]'::jsonb) into result from claimed;
 return result;
end $$;

create function public.finish_active_market(p_zip text,p_lease uuid,p_success boolean) returns boolean
language plpgsql security invoker set search_path = public as $$
begin
 update active_markets set
 last_collected_at=case when p_success then now() else last_collected_at end,
 last_status=case when p_success then 'collected' else 'failed' end,
 next_refresh_at=now()+case when p_success then interval '3 days' else interval '1 hour' end,
 lease_id=null,lease_until=null
 where zip_code=p_zip and lease_id=p_lease and lease_until > now();
 return found;
end $$;
revoke all on function public.request_active_market(text),public.claim_active_markets(text,integer),public.finish_active_market(text,uuid,boolean) from public,anon,authenticated;
grant execute on function public.request_active_market(text),public.claim_active_markets(text,integer),public.finish_active_market(text,uuid,boolean) to service_role;
