-- Additive accepted identities for approved catalog 2026-11-06.1.
-- Retain IDs on rollback; do not change inventory, grants, or policies.
insert into public.pantry_catalog(id) values
 ('basil-fresh'),
 ('beets-fresh'),
 ('cilantro-fresh'),
 ('cucumber-fresh'),
 ('eggplant-fresh'),
 ('leeks-fresh'),
 ('okra-fresh'),
 ('parsley-fresh'),
 ('radishes-fresh'),
 ('spearmint-fresh')
on conflict do nothing;
