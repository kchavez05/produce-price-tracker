-- Additive accepted identities for approved catalog 2026-10-30.1.
-- Retain these rows on rollback; never delete accepted inventory identities.
insert into public.pantry_catalog(id) values
 ('lentils-dried'), ('lentils-canned'), ('onions-fresh')
on conflict do nothing;
