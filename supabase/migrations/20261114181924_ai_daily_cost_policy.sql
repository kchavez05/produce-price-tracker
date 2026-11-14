-- Owner November 14: $5 per account/day, $20 shared/month (UTC windows).
-- Dollar ceilings are accepted; paid activation/provider bounds remain separate gates.
alter table ai_private.policy add column if not exists account_daily_budget_micro_usd bigint not null default 0
  check (account_daily_budget_micro_usd between 0 and 9007199254740991);
alter table ai_private.daily_usage add column if not exists reserved_micro_usd bigint not null default 0
  check (reserved_micro_usd between 0 and 9007199254740991);
-- Preserve existing daily exposure if this migration follows any test/operator activity.
update ai_private.daily_usage d set reserved_micro_usd=greatest(d.reserved_micro_usd,coalesce((
  select sum(r.reserved_micro_usd) from ai_private.reservations r
  where r.account_id=d.account_id and (r.created_at at time zone 'UTC')::date=d.day
),0));
-- Seed the newly accepted policy only for the untouched disabled placeholder.
-- Zero action-count allowance means no separate count cap; dollars/concurrency still bound work.
update ai_private.policy set monthly_budget_micro_usd=20000000,account_daily_budget_micro_usd=5000000
where singleton and not enabled and monthly_budget_micro_usd=0 and account_daily_budget_micro_usd=0;

create or replace function public.ai_usage_reserve(
  p_account_id uuid, p_request_id uuid, p_action text, p_adapter_key text, p_maximum_cost_micro_usd bigint
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare
  v_policy ai_private.policy%rowtype;
  v_limit ai_private.adapter_limits%rowtype;
  v_month date := date_trunc('month', now() at time zone 'UTC')::date;
  v_day date := (now() at time zone 'UTC')::date;
  v_spent bigint; v_daily_spent bigint; v_actions integer; v_active integer; v_id uuid;
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
    v_limit.maximum_cost_micro_usd <> p_maximum_cost_micro_usd or v_policy.monthly_budget_micro_usd <= 0 or v_policy.account_daily_budget_micro_usd <= 0 then
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
  select reserved_micro_usd into v_daily_spent from ai_private.daily_usage where account_id=p_account_id and day=v_day;
  select actions into v_actions from ai_private.daily_usage where account_id=p_account_id and day=v_day;
  if (v_policy.account_daily_actions > 0 and v_actions >= v_policy.account_daily_actions) or
    v_limit.maximum_cost_micro_usd > v_policy.account_daily_budget_micro_usd - v_daily_spent then
    return jsonb_build_object('allowed',false,'reason','DAILY_QUOTA','retryAfterSeconds',v_day_retry);
  end if;
  if v_limit.maximum_cost_micro_usd > v_policy.monthly_budget_micro_usd - v_spent then
    return jsonb_build_object('allowed',false,'reason','MONTHLY_BUDGET','retryAfterSeconds',v_month_retry);
  end if;
  insert into ai_private.reservations(account_id,request_id,action,adapter_key,reserved_micro_usd)
    values(p_account_id,p_request_id,p_action,p_adapter_key,v_limit.maximum_cost_micro_usd) returning id into v_id;
  update ai_private.monthly_usage set reserved_micro_usd=reserved_micro_usd+v_limit.maximum_cost_micro_usd where month=v_month;
  update ai_private.daily_usage set actions=actions+1, reserved_micro_usd=reserved_micro_usd+v_limit.maximum_cost_micro_usd where account_id=p_account_id and day=v_day;
  return jsonb_build_object('allowed',true,'reservationId',v_id,'remainingActions',case when v_policy.account_daily_actions>0 then v_policy.account_daily_actions-v_actions-1 else null end,
    'remainingDailyMicroUsd',v_policy.account_daily_budget_micro_usd-v_daily_spent-v_limit.maximum_cost_micro_usd);
end;
$$;

comment on table ai_private.policy is 'Owner policy: $5/account/day and $20 total/month, UTC. Disabled pending accepted provider bounds and hosted verification; zero daily action count means no additional count cap.';
