-- Additive accepted identities for approved catalog 2026-11-06.2.
-- Retain all IDs on rollback; do not change inventory, grants, or policies.
insert into public.pantry_catalog(id) values
 ('almonds-whole-raw'),
 ('canola-oil'),
 ('cinnamon-ground'),
 ('cloves-ground'),
 ('feta-cheese'),
 ('fish-sauce'),
 ('ginger-ground'),
 ('honey'),
 ('milk-whole'),
 ('miso'),
 ('oyster-sauce'),
 ('parmesan-hard'),
 ('red-wine-vinegar'),
 ('sesame-oil'),
 ('sesame-seeds-whole-dried'),
 ('sugar-brown'),
 ('sugar-granulated'),
 ('tempeh'),
 ('tofu-soft'),
 ('tuna-light-canned-water'),
 ('turmeric-ground'),
 ('walnuts-english-raw'),
 ('yogurt-plain-whole-milk')
on conflict do nothing;
