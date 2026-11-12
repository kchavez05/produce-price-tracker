-- Approved distinct whole/ground spice identities; USDA references are shared metadata.
-- Retain all accepted IDs on presentation rollback; inventory and grants are unchanged.
insert into public.pantry_catalog(id) values
 ('cardamom-ground'),
 ('cardamom-pods'),
 ('coriander-ground'),
 ('coriander-seeds-whole')
on conflict do nothing;
