-- Operational records contain no account, inventory, recipe, or credential data.
create table public.weekly_refresh_audit (
  id uuid primary key,
  zip_code text not null check (zip_code ~ '^[0-9]{5}$'),
  cycle text not null,
  attempted_at timestamptz not null,
  completed_at timestamptz not null,
  status text not null check (status in ('live', 'estimates_only', 'failed')),
  flipp_offer_count integer not null check (flipp_offer_count >= 0),
  kroger_offer_count integer not null check (kroger_offer_count >= 0),
  usda_live boolean not null
);
create index weekly_refresh_audit_zip_time on public.weekly_refresh_audit (zip_code, completed_at desc);
alter table public.weekly_refresh_audit enable row level security;
revoke all on public.weekly_refresh_audit from public, anon, authenticated;
grant select, insert on public.weekly_refresh_audit to service_role;
