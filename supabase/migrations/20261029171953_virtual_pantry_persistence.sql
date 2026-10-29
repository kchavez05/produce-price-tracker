-- Additive storage. No owner is migrated until the gated API explicitly requests it.
create schema if not exists pantry_private;
revoke all on schema pantry_private from public, anon;
grant usage on schema pantry_private to authenticated;

create table public.pantry_catalog (id text primary key);
create table public.user_pantry_entries (
  user_id uuid not null references public.users(id) on delete cascade,
  id text not null,
  identity_key text not null,
  entry jsonb not null,
  primary key(user_id,id), unique(user_id,identity_key)
);
create table public.user_pantry_migrations (
  user_id uuid primary key references public.users(id) on delete cascade,
  source jsonb not null
);
create table public.user_pantry_mutations (
  user_id uuid not null references public.users(id) on delete cascade,
  mutation_id text not null,
  request jsonb not null,
  result jsonb not null,
  primary key(user_id,mutation_id)
);
alter table public.pantry_catalog enable row level security;
alter table public.user_pantry_entries enable row level security;
alter table public.user_pantry_migrations enable row level security;
alter table public.user_pantry_mutations enable row level security;
revoke all on public.pantry_catalog, public.user_pantry_entries, public.user_pantry_migrations, public.user_pantry_mutations from public, anon, authenticated;
grant select on public.pantry_catalog, public.user_pantry_entries, public.user_pantry_migrations, public.user_pantry_mutations to authenticated;
create policy pantry_catalog_read on public.pantry_catalog for select to authenticated using(true);
create policy pantry_entry_owner on public.user_pantry_entries for select to authenticated using((select auth.uid())=user_id);
create policy pantry_migration_owner on public.user_pantry_migrations for select to authenticated using((select auth.uid())=user_id);
create policy pantry_receipt_owner on public.user_pantry_mutations for select to authenticated using((select auth.uid())=user_id);

-- Catalog IDs are generated from src/data/pantry-ingredients.ts below.
insert into public.pantry_catalog(id) values
('chicken-thighs-boneless'),
('chicken-breast-boneless'),
('pork-shoulder-butt'),
('ground-turkey'),
('ground-beef-80-20'),
('sweet-potatoes'),
('bell-peppers'),
('green-cabbage'),
('celery-stalks'),
('avocados-hass'),
('asparagus-fresh'),
('brussels-sprouts'),
('large-eggs-dozen'),
('butter-salted-unsalted'),
('chicken-broth'),
('beef-broth'),
('vegetable-broth'),
('olive-oil'),
('avocado-oil'),
('garlic-fresh'),
('ginger-fresh'),
('cornstarch'),
('all-purpose-flour'),
('whole-wheat-flour'),
('rice-flour'),
('tomato-paste'),
('crushed-tomatoes-canned'),
('worcestershire-sauce'),
('coconut-aminos'),
('apple-cider-vinegar'),
('dijon-mustard'),
('whole-grain-mustard'),
('coconut-milk-canned'),
('black-beans-canned'),
('black-beans-dried'),
('kidney-beans-canned'),
('cannellini-beans-canned'),
('great-northern-beans-canned'),
('basmati-rice-dry'),
('jasmine-rice-dry'),
('brown-rice-dry'),
('lime-juice'),
('lemon-fresh'),
('orange-juice'),
('salt'),
('black-pepper'),
('ground-cumin'),
('mexican-oregano-dried'),
('oregano-dried'),
('thyme-dried'),
('bay-leaf'),
('garlic-powder'),
('onion-powder'),
('smoked-paprika'),
('chili-powder'),
('caraway-seeds'),
('italian-seasoning'),
('red-pepper-flakes'),
('curry-powder'),
('garam-masala'),
('rosemary-dried'),
('dill-dried'),
('tofu-firm'),
('red-lentils-dried'),
('chickpeas-canned'),
('tahini'),
('masa-harina'),
('soy-sauce');

create function pantry_private.clean_name(value text) returns text
language sql immutable set search_path='' as $$
  select btrim(regexp_replace(normalize(value,NFC), E'[\\s\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+', ' ', 'g'))
$$;
create function pantry_private.identity(value jsonb) returns text
language sql immutable set search_path='' as $$
  select case when value ? 'ingredientId' then 'catalog:'||(value->>'ingredientId')
    else 'custom:'||lower(pantry_private.clean_name(value->>'displayName')) end
$$;
create function pantry_private.validate_entry(value jsonb) returns jsonb
language plpgsql set search_path='' as $$
declare name text; date_value date; result jsonb;
begin
  name := pantry_private.clean_name(value->>'displayName');
  if jsonb_typeof(value) is distinct from 'object' or jsonb_typeof(value->'displayName') is distinct from 'string'
    or length(name) not between 1 and 120 or jsonb_typeof(value->'available') is distinct from 'boolean' then
    raise exception 'invalid_entry';
  end if;
  if value ? 'ingredientId' and (jsonb_typeof(value->'ingredientId') is distinct from 'string'
    or not exists(select 1 from public.pantry_catalog where id=value->>'ingredientId')) then raise exception 'invalid_entry'; end if;
  if value ? 'location' and (jsonb_typeof(value->'location') is distinct from 'string' or value->>'location' not in ('PANTRY','FRIDGE','FREEZER')) then raise exception 'invalid_entry'; end if;
  if value ? 'quantity' then
    if jsonb_typeof(value->'quantity') is distinct from 'number' then raise exception 'invalid_entry'; end if;
    if (value->>'quantity')::numeric < 0 or (value->>'quantity')::numeric > 1.7976931348623157e308 then raise exception 'invalid_entry'; end if;
  end if;
  if value ? 'unit' and (jsonb_typeof(value->'unit') is distinct from 'string' or length(btrim(value->>'unit'))>40) then raise exception 'invalid_entry'; end if;
  if value ? 'useByDate' then
    if jsonb_typeof(value->'useByDate') is distinct from 'string' or value->>'useByDate' !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'invalid_entry'; end if;
    begin
      date_value := make_date(substring(value->>'useByDate',1,4)::int, substring(value->>'useByDate',6,2)::int, substring(value->>'useByDate',9,2)::int);
    exception when others then raise exception 'invalid_entry'; end;
  end if;
  result := jsonb_build_object('displayName',name,'available',value->'available');
  select result || coalesce(jsonb_object_agg(key,val),'{}'::jsonb) into result
    from jsonb_each(value) as fields(key,val) where key in ('ingredientId','location','quantity','unit','useByDate');
  return result;
end $$;

-- This function is privileged only to keep direct table writes unavailable. Every
-- branch derives its owner from auth.uid(); no owner parameter or metadata claim.
create function pantry_private.rpc(p_action text, p_payload jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
  uid uuid := auth.uid(); source_value jsonb; archived jsonb; items jsonb; item jsonb;
  clean jsonb; current_entry jsonb; duplicate_entry jsonb; result jsonb; prior public.user_pantry_mutations;
  expected bigint; key text; stamp text;
begin
  if uid is null or not exists(select 1 from public.users where id=uid) then raise exception 'session_required'; end if;
  perform pg_advisory_xact_lock(hashtextextended(uid::text,1600));
  stamp := to_char(clock_timestamp() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  select source into archived from public.user_pantry_migrations where user_id=uid;
  select jsonb_build_object('owner','account:'||uid::text,
    'freezerItems',coalesce((select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'id',f.id,'canonicalIngredientId',f.canonical_ingredient_id,'ingredientName',f.ingredient_name,
      'category',f.category,'quantityLbOrDoz',f.quantity_lb_or_doz,'unit',f.unit,
      'purchasePricePerUnit',f.purchase_price_per_unit,'regularPricePerUnit',f.regular_price_per_unit,
      'totalCostBasis',f.total_cost_basis,'estimatedSavings',f.estimated_savings,'store',f.store,
      'storeBanner',f.store_banner,'purchasedAtIso',f.purchased_at_iso,'notes',f.notes)) order by f.id)
      from public.user_freezer_items f where f.user_id=uid),'[]'::jsonb),
    'onHandIngredientIds',coalesce((select to_jsonb(on_hand_ingredient_ids) from public.user_preferences where user_id=uid),'[]'::jsonb)) into source_value;

  if p_action='migrate' and archived is null then
    if p_payload->'source' is distinct from source_value then raise exception 'legacy_changed'; end if;
    if jsonb_typeof(p_payload->'entries') is distinct from 'array' then raise exception 'invalid_entry'; end if;
    for item in select value from jsonb_array_elements(p_payload->'entries') loop
      clean := pantry_private.validate_entry(item);
      if jsonb_typeof(item->'id') is distinct from 'string' or length(item->>'id') not between 1 and 1024 then raise exception 'invalid_entry'; end if;
      insert into public.user_pantry_entries(user_id,id,identity_key,entry)
        values(uid,item->>'id',pantry_private.identity(clean),clean||jsonb_build_object('id',item->>'id','revision',1,'updatedAtIso',stamp));
    end loop;
    insert into public.user_pantry_migrations(user_id,source) values(uid,source_value);
    archived := source_value;
  elsif p_action='mutate' then
    if archived is null then raise exception 'migration_required'; end if;
    if jsonb_typeof(p_payload) is distinct from 'object' or jsonb_typeof(p_payload->'mutationId') is distinct from 'string'
      or length(btrim(p_payload->>'mutationId')) not between 1 and 128
      or jsonb_typeof(p_payload->'entryId') is distinct from 'string' or length(btrim(p_payload->>'entryId')) not between 1 and 1024
      or jsonb_typeof(p_payload->'expectedRevision') is distinct from 'number'
      or coalesce(p_payload->>'operation','') not in ('put','delete') then raise exception 'invalid_mutation'; end if;
    if (p_payload->>'expectedRevision')::numeric <> trunc((p_payload->>'expectedRevision')::numeric)
      or (p_payload->>'expectedRevision')::numeric not between 0 and 9007199254740990 then raise exception 'invalid_mutation'; end if;
    expected := (p_payload->>'expectedRevision')::bigint;
    if p_payload->>'operation'='put' then clean:=pantry_private.validate_entry(p_payload->'entry'); end if;
    select * into prior from public.user_pantry_mutations where user_id=uid and mutation_id=p_payload->>'mutationId';
    if found then
      if prior.request is distinct from p_payload then raise exception 'mutation_id_reused'; end if;
      return prior.result;
    end if;
    select entry into current_entry from public.user_pantry_entries where user_id=uid and id=p_payload->>'entryId';
    if coalesce((current_entry->>'revision')::bigint,0)<>expected or (current_entry is null and p_payload->>'operation'='delete') then
      return jsonb_build_object('status','conflict','mutationId',p_payload->>'mutationId','reason','revision','current',current_entry);
    end if;
    if p_payload->>'operation'='put' then
      key := pantry_private.identity(clean);
      select entry into duplicate_entry from public.user_pantry_entries where user_id=uid and identity_key=key and id<>p_payload->>'entryId';
      if found then return jsonb_build_object('status','conflict','mutationId',p_payload->>'mutationId','reason','identity','current',duplicate_entry); end if;
      item := clean || jsonb_build_object('id',p_payload->>'entryId','revision',expected+1,'updatedAtIso',stamp);
    else
      key := pantry_private.identity(current_entry);
      item := current_entry || jsonb_build_object('revision',expected+1,'updatedAtIso',stamp,'deletedAtIso',stamp);
    end if;
    insert into public.user_pantry_entries(user_id,id,identity_key,entry) values(uid,p_payload->>'entryId',key,item)
      on conflict(user_id,id) do update set identity_key=excluded.identity_key,entry=excluded.entry;
    result := jsonb_build_object('status','applied','mutationId',p_payload->>'mutationId','entry',item);
    insert into public.user_pantry_mutations(user_id,mutation_id,request,result) values(uid,p_payload->>'mutationId',p_payload,result);
    return result;
  elsif p_action not in ('read','migrate') or p_action is null then raise exception 'invalid_action';
  end if;
  select coalesce(jsonb_agg(entry order by id),'[]'::jsonb) into items from public.user_pantry_entries where user_id=uid;
  return jsonb_strip_nulls(jsonb_build_object('owner','account:'||uid::text,'entries',items,'legacySource',coalesce(archived,source_value),
    'legacyMigrationVersion',case when archived is not null then 1 end,
    'needsCatalogMatch',(select coalesce(jsonb_agg(value->>'id'),'[]'::jsonb) from jsonb_array_elements(items) where not(value ? 'ingredientId') and not(value ? 'deletedAtIso'))));
end $$;

create function public.pantry_rpc(p_action text, p_payload jsonb default '{}'::jsonb) returns jsonb
language sql security invoker set search_path='' as $$ select pantry_private.rpc(p_action,p_payload) $$;
revoke all on all functions in schema pantry_private from public, anon, authenticated;
grant execute on function pantry_private.rpc(text,jsonb) to authenticated;
revoke all on function public.pantry_rpc(text,jsonb) from public, anon;
grant execute on function public.pantry_rpc(text,jsonb) to authenticated;

-- Fence old clients at the storage boundary, including clients calling REST directly.
create function pantry_private.fence_legacy_inventory() returns trigger
language plpgsql security definer set search_path='' as $$
declare uid uuid; inventory_change boolean;
begin
  uid := case when tg_op='DELETE' then old.user_id else new.user_id end;
  perform pg_advisory_xact_lock(hashtextextended(uid::text,1600));
  if exists(select 1 from public.user_pantry_migrations where user_id=uid) and exists(select 1 from public.users where id=uid) then
    if tg_table_name='user_freezer_items' then inventory_change:=true;
    elsif tg_op='INSERT' then
      -- BEFORE INSERT runs even when ON CONFLICT later becomes an UPDATE.
      inventory_change := new.on_hand_ingredient_ids is distinct from coalesce(
        (select on_hand_ingredient_ids from public.user_preferences where user_id=uid), array[]::text[]);
    else inventory_change:=new.on_hand_ingredient_ids is distinct from old.on_hand_ingredient_ids; end if;
    if inventory_change then raise exception 'pantry_upgrade_required'; end if;
  end if;
  if tg_op='DELETE' then return old; end if;
  return new;
end $$;
revoke all on function pantry_private.fence_legacy_inventory() from public, anon, authenticated;
create trigger pantry_fence_freezer before insert or update or delete on public.user_freezer_items for each row execute function pantry_private.fence_legacy_inventory();
create trigger pantry_fence_preferences before insert or update on public.user_preferences for each row execute function pantry_private.fence_legacy_inventory();
