-- Isolated hosted acceptance: every fixture/policy/usage change is rolled back.
-- Only the already-reviewed deployed functions are exercised. No provider endpoint.
do $test$
declare
  alice uuid:=gen_random_uuid(); bob uuid:=gen_random_uuid(); charlie uuid:=gen_random_uuid();
  delta uuid:=gen_random_uuid(); echo uuid:=gen_random_uuid(); rid uuid:=gen_random_uuid();
  first_id uuid; second_id uuid; decision jsonb; spent_before bigint; spent_after bigint;
  accepted integer:=0; rejected integer:=0; i integer;
begin
  if (select enabled from ai_private.policy where singleton) or
    (select count(*) from ai_private.adapter_limits) is distinct from 0 or
    (select count(*) from ai_private.reservations) is distinct from 0 or
    (select count(*) from ai_private.monthly_usage) is distinct from 0 or
    (select count(*) from ai_private.daily_usage) is distinct from 0 then
    raise exception 'Unexpected nonempty/enabled baseline; no fixture test performed';
  end if;
  begin
    insert into auth.users(id,email,raw_app_meta_data,raw_user_meta_data)
      select id,'ai664-'||id::text||'@example.invalid','{"provider":"google"}'::jsonb,
        '{"full_name":"AI664 rollback fixture"}'::jsonb
      from unnest(array[alice,bob,charlie,delta,echo]) as fixture(id);
    execute 'set local role service_role';
    decision:=public.ai_usage_reserve(alice,rid,'recipe','hosted-test:recipe',100);
    if decision->>'reason' is distinct from 'DISABLED' then raise exception 'Disabled gate failed'; end if;
    execute 'reset role';
    update ai_private.policy set enabled=true,monthly_budget_micro_usd=20000000,
      account_daily_budget_micro_usd=10000,account_daily_actions=0,account_concurrent_actions=1;
    insert into ai_private.adapter_limits(action,adapter_key,maximum_cost_micro_usd,enabled)
      values('recipe','hosted-test:recipe',100,true),('speech','hosted-test:speech',200,true);
    execute 'set local role service_role';
    decision:=public.ai_usage_reserve(alice,gen_random_uuid(),'recipe','wrong-adapter',100);
    if decision->>'reason' is distinct from 'NOT_CONFIGURED' then raise exception 'Adapter mismatch gate failed'; end if;
    decision:=public.ai_usage_reserve(alice,gen_random_uuid(),'recipe','hosted-test:recipe',1);
    if decision->>'reason' is distinct from 'NOT_CONFIGURED' then raise exception 'Bound mismatch gate failed'; end if;
    decision:=public.ai_usage_reserve(alice,rid,'recipe','hosted-test:recipe',100);
    if decision->>'allowed' is distinct from 'true' or decision->>'remainingDailyMicroUsd' is distinct from '9900' or decision->'remainingActions' is distinct from 'null'::jsonb then
      raise exception 'Valid reservation/dollar-only allowance failed'; end if;
    first_id:=(decision->>'reservationId')::uuid;
    decision:=public.ai_usage_reserve(alice,rid,'recipe','hosted-test:recipe',100);
    if decision->>'reason' is distinct from 'DUPLICATE_REQUEST' then raise exception 'Duplicate gate failed'; end if;
    decision:=public.ai_usage_reserve(alice,gen_random_uuid(),'recipe','hosted-test:recipe',100);
    if decision->>'reason' is distinct from 'CONCURRENT_REQUEST' then raise exception 'Account concurrency gate failed'; end if;
    if public.ai_usage_complete(bob,first_id) then raise exception 'Wrong-account completion allowed'; end if;
    if not public.ai_usage_complete(alice,first_id) or not public.ai_usage_complete(alice,first_id) then
      raise exception 'Completion was not repeat safe'; end if;
    select reserved_micro_usd into spent_after from ai_private.monthly_usage where month=date_trunc('month',now() at time zone 'UTC')::date;
    if spent_after is distinct from 100 then raise exception 'Completion refunded exposure'; end if;
    decision:=public.ai_usage_reserve(alice,gen_random_uuid(),'speech','hosted-test:speech',200);
    if decision->>'allowed' is distinct from 'true' or decision->>'remainingDailyMicroUsd' is distinct from '9700' then raise exception 'Shared recipe/speech accounting failed'; end if;
    perform public.ai_usage_complete(alice,(decision->>'reservationId')::uuid);
    execute 'reset role';
    update ai_private.policy set account_daily_actions=2;
    execute 'set local role service_role';
    decision:=public.ai_usage_reserve(alice,gen_random_uuid(),'recipe','hosted-test:recipe',100);
    if decision->>'reason' is distinct from 'DAILY_QUOTA' then raise exception 'Optional count cap failed'; end if;
    execute 'reset role';
    update ai_private.policy set account_daily_actions=0,account_daily_budget_micro_usd=250,account_concurrent_actions=10;
    execute 'set local role service_role';
    decision:=public.ai_usage_reserve(bob,gen_random_uuid(),'recipe','hosted-test:recipe',100);
    if decision->>'allowed' is distinct from 'true' then raise exception 'Separate account admission failed'; end if;
    decision:=public.ai_usage_reserve(bob,gen_random_uuid(),'speech','hosted-test:speech',200);
    if decision->>'reason' is distinct from 'DAILY_QUOTA' then raise exception 'Shared daily dollar gate failed'; end if;
    decision:=public.ai_usage_reserve(bob,gen_random_uuid(),'recipe','hosted-test:recipe',100);
    if decision->>'allowed' is distinct from 'true' then raise exception 'Second daily dollar admission failed'; end if;
    decision:=public.ai_usage_reserve(bob,gen_random_uuid(),'recipe','hosted-test:recipe',100);
    if decision->>'reason' is distinct from 'DAILY_QUOTA' then raise exception 'Daily exhaustion failed'; end if;
    select reserved_micro_usd into spent_before from ai_private.monthly_usage where month=date_trunc('month',now() at time zone 'UTC')::date;
    execute 'reset role';
    delete from auth.users where id=bob;
    select reserved_micro_usd into spent_after from ai_private.monthly_usage where month=date_trunc('month',now() at time zone 'UTC')::date;
    if spent_after is distinct from spent_before or exists(select 1 from ai_private.reservations where account_id=bob) then raise exception 'Account deletion spend preservation/cascade failed'; end if;
    update ai_private.policy set monthly_budget_micro_usd=spent_after+200,account_daily_budget_micro_usd=10000;
    execute 'set local role service_role';
    for i in 1..10 loop
      decision:=public.ai_usage_reserve(charlie,gen_random_uuid(),'recipe','hosted-test:recipe',100);
      if decision->>'allowed'='true' then accepted:=accepted+1;
      elsif decision->>'reason'='MONTHLY_BUDGET' then rejected:=rejected+1;
      else raise exception 'Unexpected monthly gate response'; end if;
    end loop;
    if accepted is distinct from 2 or rejected is distinct from 8 then raise exception 'Monthly over-admission'; end if;
    execute 'reset role';
    update ai_private.policy set monthly_budget_micro_usd=20000000,account_concurrent_actions=1;
    execute 'set local role service_role';
    decision:=public.ai_usage_reserve(delta,gen_random_uuid(),'recipe','hosted-test:recipe',100);
    if decision->>'allowed' is distinct from 'true' then raise exception 'Lease fixture failed'; end if;
    first_id:=(decision->>'reservationId')::uuid;
    execute 'reset role';
    update ai_private.reservations set created_at=now()-interval '3 minutes' where id=first_id;
    execute 'set local role service_role';
    decision:=public.ai_usage_reserve(delta,gen_random_uuid(),'recipe','hosted-test:recipe',100);
    if decision->>'allowed' is distinct from 'true' then raise exception 'Expired lease did not recover'; end if;
    second_id:=(decision->>'reservationId')::uuid;
    if (select reserved_micro_usd from ai_private.daily_usage where account_id=delta and day=(now() at time zone 'UTC')::date) is distinct from 200 then raise exception 'Expired lease refunded exposure'; end if;
    perform public.ai_usage_complete(delta,second_id);
    execute 'reset role';
    insert into ai_private.daily_usage(account_id,day,actions,reserved_micro_usd) values(echo,(now() at time zone 'UTC')::date-1,99,9999);
    execute 'set local role service_role';
    decision:=public.ai_usage_reserve(echo,gen_random_uuid(),'recipe','hosted-test:recipe',100);
    if decision->>'allowed' is distinct from 'true' or decision->>'remainingDailyMicroUsd' is distinct from '9900' then raise exception 'UTC date isolation failed'; end if;
    begin update ai_private.policy set enabled=false; raise exception 'Runtime policy update allowed'; exception when insufficient_privilege then null; end;
    begin update ai_private.adapter_limits set maximum_cost_micro_usd=1; raise exception 'Runtime registration update allowed'; exception when insufficient_privilege then null; end;
    execute 'reset role';
    update ai_private.policy set enabled=false;
    execute 'set local role service_role';
    decision:=public.ai_usage_reserve(echo,gen_random_uuid(),'recipe','hosted-test:recipe',100);
    if decision->>'reason' is distinct from 'DISABLED' then raise exception 'Kill switch failed'; end if;
    execute 'reset role';
    foreach i in array array[1,2] loop
      if i=1 then execute 'set local role anon'; else execute 'set local role authenticated'; end if;
      begin perform * from ai_private.policy; raise exception 'Private table access allowed'; exception when insufficient_privilege then null; end;
      begin perform public.ai_usage_reserve(alice,gen_random_uuid(),'recipe','hosted-test:recipe',100); raise exception 'Public RPC allowed'; exception when insufficient_privilege then null; end;
      execute 'reset role';
    end loop;
    -- Force rollback of this whole inner subtransaction, including synthetic auth/profile rows.
    raise exception sqlstate 'Z6640' using message='rollback successful hosted assertions';
  exception when sqlstate 'Z6640' then null;
  end;
  if (select enabled from ai_private.policy where singleton) or
    (select monthly_budget_micro_usd from ai_private.policy where singleton) is distinct from 20000000 or
    (select account_daily_budget_micro_usd from ai_private.policy where singleton) is distinct from 5000000 or
    (select count(*) from ai_private.adapter_limits) is distinct from 0 or
    (select count(*) from ai_private.reservations) is distinct from 0 or
    (select count(*) from ai_private.monthly_usage) is distinct from 0 or
    (select count(*) from ai_private.daily_usage) is distinct from 0 or
    exists(select 1 from auth.users where id=any(array[alice,bob,charlie,delta,echo])) or
    exists(select 1 from public.users where id=any(array[alice,bob,charlie,delta,echo])) or
    exists(select 1 from public.user_preferences where user_id=any(array[alice,bob,charlie,delta,echo])) then
    raise exception 'Fixture rollback/final disabled state failed';
  end if;
end $test$;
select 'passed' as rollback_assertions,enabled,monthly_budget_micro_usd,account_daily_budget_micro_usd,
  (select count(*) from ai_private.adapter_limits) as registered_adapters,
  (select count(*) from ai_private.reservations) as reservations,
  (select count(*) from ai_private.monthly_usage) as monthly_rows,
  (select count(*) from ai_private.daily_usage) as daily_rows
from ai_private.policy;
