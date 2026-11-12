-- Approved seven fresh identities; recipe alternatives never become inventory IDs.
-- Presentation rollback retains these accepted IDs and all existing inventory.
insert into public.pantry_catalog(id) values
 ('broccoli-fresh'),
 ('carrots-fresh'),
 ('cauliflower-fresh'),
 ('kale-fresh'),
 ('mushrooms-white-fresh'),
 ('spinach-fresh'),
 ('tomatoes-fresh')
on conflict do nothing;
