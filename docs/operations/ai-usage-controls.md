# App-funded AI usage controls

Implementation: #664/#751, release parent #748. This runbook describes a release gate; it does not authorize activation or a paid request.

## Before activation

1. Owner policy, clarified November 14: **$20 shared per UTC month** and **$5 per verified account per UTC day**, combining recipes and speech. The daily/monthly periods follow the original policy question. These cap reserved exposure, not user billing or a guaranteed allocation. No additional daily action-count limit was selected; zero disables that optional count cap. Do not substitute the spike's test cap or comparison scenario.
2. Accept the provider in #731/#752. For each action, verify a fixed worst-case cost that includes bounded input, output, audio duration, extraction, billable failure, rounding and every internal retry. Use integer micro-USD (one dollar = 1,000,000). The application's `usageBound` and database adapter key/cost must exactly match. There is no registered adapter or accepted bound in this migration.
3. Apply both reviewed AI usage migrations to the intended staging database through the normal migration workflow. Keep `ai_private.policy.enabled = false`. Verify the hosted schema, private-table RLS, anon/authenticated denials and service-role-only RPC privileges. Neither RPC uses SECURITY DEFINER. Configure the existing server-only Supabase secret; never expose it to the browser.
4. Verify concurrent admissions from separate sessions/instances cannot overspend a shared budget or account allowance. Exercise uncertain acknowledgments, provider failures, completion failures, account changes, UTC reset windows and the kill switch. PGlite unit tests cover the transaction logic and privileges; they do not replace hosted multi-session verification.
5. Run Supabase security advisors after applying the migration and inspect the delta. The read-only November 14 baseline found existing no-policy RLS informational findings, existing anon/authenticated EXECUTE warnings on `handle_new_auth_user` and `rls_auto_enable`, and disabled leaked-password protection. These were not introduced or changed by this work; do not describe the baseline as clean.
6. Verify the exact accepted adapter and policy on staging, finish browser/device and production acceptance under #750, then enable only the approved environment. Keep evidence of the policy, adapter bounds and intended deployment on the issue; do not include credentials or personal prompts.

## Operator configuration

Only an operator with database administration access changes policy/adapter registrations. The runtime service role has SELECT on policy/adapter rows, not UPDATE. Use a transaction and the same advisory lock as admission so a policy change is ordered against concurrent reservations:

```sql
begin;
select pg_catalog.pg_advisory_xact_lock(18635407, 17);
-- Substitute reviewed, accepted values; these placeholders intentionally do not execute.
insert into ai_private.adapter_limits(action, adapter_key, maximum_cost_micro_usd, enabled)
values ('recipe', '<accepted-adapter-key>', <verified-maximum-micro-usd>, true)
on conflict(action) do update set adapter_key=excluded.adapter_key,
  maximum_cost_micro_usd=excluded.maximum_cost_micro_usd, enabled=excluded.enabled;
-- Register speech separately, including both transcription and extraction exposure.
update ai_private.policy set monthly_budget_micro_usd=20000000,
  account_daily_budget_micro_usd=5000000, account_daily_actions=0, account_concurrent_actions=1,
  enabled=true where singleton;
commit;
```

Do not reset usage counters when changing adapters, deploying or increasing a quota. Budgets cover UTC calendar months; daily allowances cover UTC calendar days. A lower budget than current reserved exposure correctly blocks further work.

## Disable and recover

```sql
begin;
select pg_catalog.pg_advisory_xact_lock(18635407, 17);
update ai_private.policy set enabled=false where singleton;
commit;
```

The switch blocks subsequent admissions; already admitted provider work may finish and remains charged. Keep deterministic suggestions and manual pantry entry available. Deploying older code that bypasses this ledger is not a safe rollback while server-funded AI is configured; disable policy and remove the server provider credential before such a rollback.

Completion releases an account concurrency slot but never refunds money or actions. A crash releases the slot after the 120-second lease; its reservation stays charged. Reusing an account/request UUID receives a duplicate response and never replays a provider call. A client retry uses a fresh UUID and consumes another action/reservation. A lost RPC acknowledgment may consume allowance even when no model call follows: this is deliberate conservative accounting. There is no automatic refund or cross-provider retry.

The ledger stores account/request IDs, action, adapter identifier, timestamps, status and cost bounds. It stores no raw audio, transcript, prompt or generated recipe. Account deletion cascades personal rows while retaining the monthly aggregate, preventing deletion from refunding spend. Historical ledger retention and operational monitoring should be reviewed before activation; no scheduled cleanup is installed here.
