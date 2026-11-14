-- App-funded AI policy and conservative usage reservations. Never stores prompts/audio/output.
create schema if not exists ai_private;
revoke all on schema ai_private from public, anon, authenticated;
grant usage on schema ai_private to service_role;

create table if not exists ai_private.policy (
  singleton boolean primary key default true check (singleton),
  enabled boolean not null default false,
  monthly_budget_micro_usd bigint not null default 0 check (monthly_budget_micro_usd between 0 and 9007199254740991),
  account_daily_actions integer not null default 0 check (account_daily_actions between 0 and 1000),
  account_concurrent_actions integer not null default 1 check (account_concurrent_actions between 1 and 10)
);
insert into ai_private.policy(singleton) values(true) on conflict do nothing;
create table if not exists ai_private.adapter_limits (
  action text primary key check (action in ('recipe', 'speech')),
  adapter_key text not null check (length(adapter_key) between 1 and 160),
  maximum_cost_micro_usd bigint not null check (maximum_cost_micro_usd between 1 and 9007199254740991),
  enabled boolean not null default false
);
create table if not exists ai_private.monthly_usage (
  month date primary key,
  reserved_micro_usd bigint not null default 0 check (reserved_micro_usd between 0 and 9007199254740991)
);
create table if not exists ai_private.daily_usage (
  account_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  actions integer not null default 0 check (actions >= 0),
  primary key(account_id, day)
);
create table if not exists ai_private.reservations (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null,
  action text not null check (action in ('recipe', 'speech')),
  adapter_key text not null,
  reserved_micro_usd bigint not null check (reserved_micro_usd between 1 and 9007199254740991),
  created_at timestamptz not null default now(),
  status text not null default 'reserved' check (status in ('reserved', 'completed')),
  unique(account_id, request_id)
);
create index if not exists ai_active_account_requests on ai_private.reservations(account_id, created_at) where status='reserved';
alter table ai_private.policy enable row level security;
alter table ai_private.adapter_limits enable row level security;
alter table ai_private.monthly_usage enable row level security;
alter table ai_private.daily_usage enable row level security;
alter table ai_private.reservations enable row level security;
revoke all on all tables in schema ai_private from public, anon, authenticated;
grant select on ai_private.policy, ai_private.adapter_limits to service_role;
grant select, insert, update on ai_private.monthly_usage, ai_private.daily_usage, ai_private.reservations to service_role;

-- Invoker privileges only: the API's trusted service role is the sole caller.
-- No DB lock survives this RPC; model work happens after its transaction commits.
create or replace function public.ai_usage_reserve(
  p_account_id uuid, p_request_id uuid, p_action text, p_adapter_key text, p_maximum_cost_micro_usd bigint
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare
  v_policy ai_private.policy%rowtype;
  v_limit ai_private.adapter_limits%rowtype;
  v_month date := date_trunc('month', now() at time zone 'UTC')::date;
  v_day date := (now() at time zone 'UTC')::date;
  v_spent bigint; v_actions integer; v_active integer; v_id uuid;
  v_day_retry integer := greatest(1, ceil(extract(epoch from (((now() at time zone 'UTC')::date + 1)::timestamp at time zone 'UTC') - now()))::integer);
  v_month_retry integer := greatest(1, ceil(extract(epoch from ((date_trunc('month', now() at time zone 'UTC') + interval '1 month') at time zone 'UTC') - now()))::integer);
begin
  if p_account_id is null or p_request_id is null or p_action not in ('recipe','speech') or p_action is null
    or p_adapter_key is null or p_maximum_cost_micro_usd is null or p_maximum_cost_micro_usd <= 0 then
    return jsonb_build_object('allowed',false,'reason','NOT_CONFIGURED');
  end if;
  -- One short shared lock serializes all admissions, across instances/accounts.
  perform pg_catalog.pg_advisory_xact_lock(18635407, 17);
  select * into v_policy from ai_private.policy where singleton;
  if not found or not v_policy.enabled then return jsonb_build_object('allowed',false,'reason','DISABLED'); end if;
  select * into v_limit from ai_private.adapter_limits where action=p_action;
  if not found or not v_limit.enabled or v_limit.adapter_key <> p_adapter_key or
    v_limit.maximum_cost_micro_usd <> p_maximum_cost_micro_usd or v_policy.monthly_budget_micro_usd <= 0 or v_policy.account_daily_actions <= 0 then
    return jsonb_build_object('allowed',false,'reason','NOT_CONFIGURED');
  end if;
  if exists(select 1 from ai_private.reservations where account_id=p_account_id and request_id=p_request_id) then
    return jsonb_build_object('allowed',false,'reason','DUPLICATE_REQUEST');
  end if;
  select count(*) into v_active from ai_private.reservations where account_id=p_account_id and status='reserved'
    and created_at > now() - interval '120 seconds';
  if v_active >= v_policy.account_concurrent_actions then
    return jsonb_build_object('allowed',false,'reason','CONCURRENT_REQUEST','retryAfterSeconds',120);
  end if;
  insert into ai_private.monthly_usage(month) values(v_month) on conflict do nothing;
  insert into ai_private.daily_usage(account_id,day) values(p_account_id,v_day) on conflict do nothing;
  select reserved_micro_usd into v_spent from ai_private.monthly_usage where month=v_month;
  select actions into v_actions from ai_private.daily_usage where account_id=p_account_id and day=v_day;
  if v_actions >= v_policy.account_daily_actions then
    return jsonb_build_object('allowed',false,'reason','DAILY_QUOTA','retryAfterSeconds',v_day_retry);
  end if;
  if v_limit.maximum_cost_micro_usd > v_policy.monthly_budget_micro_usd - v_spent then
    return jsonb_build_object('allowed',false,'reason','MONTHLY_BUDGET','retryAfterSeconds',v_month_retry);
  end if;
  insert into ai_private.reservations(account_id,request_id,action,adapter_key,reserved_micro_usd)
    values(p_account_id,p_request_id,p_action,p_adapter_key,v_limit.maximum_cost_micro_usd) returning id into v_id;
  update ai_private.monthly_usage set reserved_micro_usd=reserved_micro_usd+v_limit.maximum_cost_micro_usd where month=v_month;
  update ai_private.daily_usage set actions=actions+1 where account_id=p_account_id and day=v_day;
  return jsonb_build_object('allowed',true,'reservationId',v_id,'remainingActions',v_policy.account_daily_actions-v_actions-1);
end;
$$;

-- Completion releases only the concurrency slot. Money/actions are never refunded.
-- Unknown charges, timeout, lost acknowledgments and failed requests retain their full bound.
create or replace function public.ai_usage_complete(p_account_id uuid, p_reservation_id uuid)
returns boolean language plpgsql security invoker set search_path='' as $$
begin
  update ai_private.reservations set status='completed' where id=p_reservation_id and account_id=p_account_id;
  return found;
end;
$$;
revoke all on function public.ai_usage_reserve(uuid,uuid,text,text,bigint) from public, anon, authenticated;
revoke all on function public.ai_usage_complete(uuid,uuid) from public, anon, authenticated;
grant execute on function public.ai_usage_reserve(uuid,uuid,text,text,bigint) to service_role;
grant execute on function public.ai_usage_complete(uuid,uuid) to service_role;
comment on table ai_private.policy is 'Disabled by default. Operator must record accepted launch policy before enabling; do not use spike comparison budgets.';
comment on table ai_private.adapter_limits is 'Only accepted adapters with verified input/output/audio/rate maximums may be registered. No selected adapter is installed by this migration.';
