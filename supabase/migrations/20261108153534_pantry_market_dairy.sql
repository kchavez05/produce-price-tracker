-- Approved dairy identities only; all prior IDs and private inventory remain intact.
-- Type, flavor, moisture and fat qualifiers never become component ownership or fixed prices.
insert into public.pantry_catalog(id) values
 ('cheddar-cheese'),
 ('cottage-cheese-creamed'),
 ('cottage-cheese-plain'),
 ('cottage-cheese-plain-1-percent'),
 ('cottage-cheese-plain-2-percent'),
 ('greek-yogurt-plain'),
 ('greek-yogurt-plain-lowfat'),
 ('greek-yogurt-plain-nonfat'),
 ('greek-yogurt-plain-whole-milk'),
 ('greek-yogurt-vanilla'),
 ('greek-yogurt-vanilla-lowfat'),
 ('greek-yogurt-vanilla-nonfat'),
 ('melting-cheese-blend'),
 ('mexican-style-cheese-blend'),
 ('monterey-jack-cheese'),
 ('mozzarella-cheese-unspecified'),
 ('mozzarella-fresh'),
 ('mozzarella-low-moisture'),
 ('mozzarella-low-moisture-part-skim'),
 ('mozzarella-low-moisture-whole-milk'),
 ('sour-cream-full-fat'),
 ('sour-cream-plain'),
 ('sour-cream-reduced-fat')
on conflict do nothing;
