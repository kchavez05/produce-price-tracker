-- Explicit dietary variant: generic Worcestershire availability must not claim
-- the user has its gluten-free variant. Price remains a fixed client estimate.
insert into public.pantry_catalog(id) values ('worcestershire-sauce-gluten-free') on conflict do nothing;
