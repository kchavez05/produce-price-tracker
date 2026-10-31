import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cookingIngredients } from '@/lib/pantry/model';
import { migrateLegacyPantry, PantryMigrationSnapshot } from '@/lib/pantry/migration';
import { PantryMutation, PantryMutationResult } from '@/types/pantry';

let db: PGlite;
const alice = '00000000-0000-4000-8000-000000000001';
const bob = '00000000-0000-4000-8000-000000000002';
async function asUser(id: string) {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
  await db.exec('set role authenticated');
}
const rpc = async <T>(action: string, payload: object = {}) => (await db.query<{ result: T }>('select public.pantry_rpc($1,$2) as result', [action, JSON.stringify(payload)])).rows[0].result;
const put = (overrides: Partial<PantryMutation> = {}): PantryMutation => ({
  mutationId: 'first', entryId: 'one', expectedRevision: 0, operation: 'put',
  entry: { displayName: 'Chicken broth', ingredientId: 'chicken-broth', available: true, quantity: 0 }, ...overrides,
} as PantryMutation);
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create table auth.users(id uuid primary key,email text,raw_app_meta_data jsonb default '{}',raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth to authenticated;`);
  await db.exec(readFileSync('supabase/migrations/20261019000000_v1_3_multi_tenant_rls_schema.sql', 'utf8'));
  await db.exec(readFileSync('supabase/migrations/20261029171953_virtual_pantry_persistence.sql', 'utf8'));
  await db.exec(readFileSync('supabase/migrations/20261029211728_pantry_staple_catalog.sql', 'utf8'));
  await db.exec(readFileSync('supabase/migrations/20261030173404_reviewed_cooking_catalog.sql', 'utf8'));
  await db.exec('grant select,insert,update,delete on public.users, public.user_preferences, public.user_freezer_items, public.user_saved_recipes to authenticated');
  await db.query('insert into auth.users(id,email) values($1,$3),($2,$3)', [alice, bob, 'fixture@example.test']);
}, 20000);
afterAll(async () => { await db?.close(); });

describe('pantry database storage boundaries', () => {
  it('accepts expanded IDs only after the additive migration and preserves them across replay', async () => {
    const charlie = '00000000-0000-4000-8000-000000000003';
    await db.query('insert into auth.users(id,email) values($1,$2)', [charlie, 'catalog@example.test']);
    await asUser(charlie);
    const original = await rpc<PantryMigrationSnapshot>('read');
    await rpc('migrate', { source: original.legacySource, entries: [] });
    const expandedEntry = { displayName: 'Dried pinto beans', ingredientId: 'pinto-beans-dried', available: true };
    const mutation = put({ mutationId: 'expanded', entryId: 'pinto', entry: expandedEntry });
    await expect(rpc('mutate', mutation)).rejects.toThrow('invalid_entry');
    await db.exec('reset role');
    expect((await db.query('select id from public.pantry_catalog')).rows).toHaveLength(72);
    const migration = readFileSync('supabase/migrations/20261031143749_pantry_legumes_grains_flours.sql', 'utf8');
    await db.exec(migration);
    await asUser(charlie);
    const applied = await rpc('mutate', mutation);
    expect(applied).toMatchObject({ status: 'applied', entry: { revision: 1, ingredientId: 'pinto-beans-dried' } });
    expect(await rpc('mutate', mutation)).toEqual(applied);
    await db.exec('reset role');
    await db.exec(migration);
    await asUser(charlie);
    expect(await rpc('mutate', put({ mutationId: 'expanded-edit', entryId: 'pinto', expectedRevision: 1, entry: { ...expandedEntry, available: false } }))).toMatchObject({ status: 'applied', entry: { revision: 2 } });
    await expect(db.exec("insert into public.pantry_catalog(id) values('unapproved')")).rejects.toThrow('permission denied');
    expect((await rpc<PantryMigrationSnapshot>('read')).entries).toHaveLength(1);
    await db.query('delete from public.users where id=$1', [charlie]);
    await db.exec('reset role');
  });
  it('keeps catalog IDs synchronized and denies anonymous execution', async () => {
    const ids = (await db.query<{ id: string }>('select id from public.pantry_catalog order by id')).rows.map((r) => r.id);
    expect(ids).toEqual(cookingIngredients.map((r) => r.id).sort());
    await db.exec('set role anon');
    await expect(rpc('read')).rejects.toThrow('permission denied');
    await db.exec('reset role');
  });
  it('migrates atomically and refuses an outdated source snapshot', async () => {
    await asUser(alice);
    const before = await rpc<PantryMigrationSnapshot>('read');
    await db.query("insert into public.user_freezer_items(id,user_id,canonical_ingredient_id,ingredient_name,category,quantity_lb_or_doz,purchase_price_per_unit,regular_price_per_unit,total_cost_basis,store,store_banner,notes) values('original-purchase',$1,'chicken-thighs-boneless','Chicken thighs','PROTEIN',2,1,2,2,'KING_SOOPERS','KS','Preserve original purchase')", [alice]);
    await db.query('update public.user_preferences set on_hand_ingredient_ids=$1 where user_id=$2', [['ground-turkey'], alice]);
    await expect(rpc('migrate', { source: before.legacySource, entries: [] })).rejects.toThrow('legacy_changed');
    const latest = await rpc<PantryMigrationSnapshot>('read');
    const prepared = migrateLegacyPantry(latest, latest.legacySource!, '2026-10-29T00:00:00Z');
    // An invalid entry rolls back valid earlier inserts and the completion marker.
    await expect(rpc('migrate', { source: latest.legacySource, entries: [...prepared.entries, { id: 'invalid', displayName: ' ', available: true }] })).rejects.toThrow('invalid_entry');
    expect((await rpc<PantryMigrationSnapshot>('read')).entries).toEqual([]);
    const migrated = await rpc<PantryMigrationSnapshot>('migrate', { source: latest.legacySource, entries: prepared.entries });
    expect(migrated.legacyMigrationVersion).toBe(1);
    expect(migrated.entries.find((entry) => entry.ingredientId === 'ground-turkey')).toMatchObject({ available: true, revision: 1 });
    expect(migrated.legacySource?.freezerItems[0].notes).toBe('Preserve original purchase');
    expect(await rpc('migrate', { source: {}, entries: [] })).toEqual(migrated);
  });
  it('acknowledges lost-response retries once and rejects reused IDs with different edits', async () => {
    const first = await rpc('mutate', put());
    expect(await rpc('mutate', put())).toEqual(first);
    await expect(rpc('mutate', put({ entry: { displayName: 'Rice', available: false } }))).rejects.toThrow('mutation_id_reused');
    expect((await rpc<PantryMigrationSnapshot>('read')).entries.find((entry) => entry.id === 'one')?.revision).toBe(1);
  });
  it('detects stale concurrent edits, identity collisions, and deletion resurrection', async () => {
    expect(await rpc('mutate', put({ mutationId: 'stale' }))).toMatchObject({ status: 'conflict', reason: 'revision', current: { revision: 1 } });
    expect(await rpc('mutate', put({ mutationId: 'duplicate', entryId: 'two' }))).toMatchObject({ status: 'conflict', reason: 'identity', current: { id: 'one' } });
    const deleted = await rpc<PantryMutationResult>('mutate', { mutationId: 'delete', entryId: 'one', expectedRevision: 1, operation: 'delete' });
    expect(deleted).toMatchObject({ status: 'applied', entry: { revision: 2, deletedAtIso: expect.any(String) } });
    expect(await rpc('mutate', put({ mutationId: 'resurrect', expectedRevision: 1 }))).toMatchObject({ status: 'conflict', current: { revision: 2, deletedAtIso: expect.any(String) } });
    expect(await rpc('mutate', put({ mutationId: 'explicit-readd', expectedRevision: 2 }))).toMatchObject({ status: 'applied', entry: { revision: 3 } });
  });
  it('enforces normalized custom identity and validates dates and types inside the database', async () => {
    const mutation = put({ mutationId: 'custom', entryId: 'custom', entry: { displayName: '  CAFÉ   Rice ', available: false } });
    expect(await rpc('mutate', mutation)).toMatchObject({ status: 'applied', entry: { displayName: 'CAFÉ Rice' } });
    expect(await rpc('mutate', { ...mutation, mutationId: 'custom-duplicate', entryId: 'custom-2', entry: { displayName: 'cafe\u0301\u00a0rice', available: true } })).toMatchObject({ status: 'conflict', reason: 'identity' });
    for (const patch of [{ useByDate: '2026-02-29' }, { quantity: -1 }, { available: 'yes' }, { ingredientId: 'unknown' }, { unit: 'x'.repeat(41) }]) {
      await expect(rpc('mutate', put({ mutationId: 'invalid', entryId: 'invalid', entry: { displayName: 'Item', available: true, ...patch } } as Partial<PantryMutation>))).rejects.toThrow('invalid_entry');
    }
    await expect(rpc('mutate', { ...put(), operation: null })).rejects.toThrow('invalid_mutation');
  });
  it('accepts new IDs additively, preserves them on presentation rollback, and retains existing inventory', async () => {
    const before = await rpc<PantryMigrationSnapshot>('read');
    expect(await rpc('mutate', put({ mutationId: 'new-lentils', entryId: 'lentils', entry: { displayName: 'Dried lentils', ingredientId: 'lentils-dried', available: true } }))).toMatchObject({ status: 'applied' });
    // A presentation rollback never deletes accepted database IDs. Reapply is idempotent.
    await db.exec('reset role');
    await db.exec(readFileSync('supabase/migrations/20261030173404_reviewed_cooking_catalog.sql', 'utf8'));
    await asUser(alice);
    expect(await rpc('mutate', put({ mutationId: 'edit-after-rollback', entryId: 'lentils', expectedRevision: 1, entry: { displayName: 'Dried lentils', ingredientId: 'lentils-dried', available: false, quantity: 0 } }))).toMatchObject({ status: 'applied', entry: { revision: 2, ingredientId: 'lentils-dried' } });
    const after = await rpc<PantryMigrationSnapshot>('read');
    expect(after.entries.filter((entry) => entry.id !== 'lentils')).toEqual(before.entries);
  });
  it('fences legacy on-hand changes while allowing unrelated preferences', async () => {
    await expect(db.query('update public.user_preferences set on_hand_ingredient_ids=$1 where user_id=$2', [[], alice])).rejects.toThrow('pantry_upgrade_required');
    await db.query('update public.user_preferences set default_zip=$1 where user_id=$2', ['10001', alice]);
    await db.query(`insert into public.user_preferences(user_id,default_zip,on_hand_ingredient_ids) values($1,$2,$3)
      on conflict(user_id) do update set default_zip=excluded.default_zip,on_hand_ingredient_ids=excluded.on_hand_ingredient_ids`, [alice, '10002', ['ground-turkey']]);
    await expect(db.query(`insert into public.user_preferences(user_id,on_hand_ingredient_ids) values($1,$2)
      on conflict(user_id) do update set on_hand_ingredient_ids=excluded.on_hand_ingredient_ids`, [alice, []])).rejects.toThrow('pantry_upgrade_required');
    await db.query("insert into public.user_saved_recipes(id,user_id,title,style,dish_json) values('kept-recipe',$1,'Saved recipe','CHILI_SOUP','{}')", [alice]);
    await expect(db.query("insert into public.user_freezer_items(id,user_id,canonical_ingredient_id,ingredient_name,category,quantity_lb_or_doz,purchase_price_per_unit,regular_price_per_unit,total_cost_basis,store,store_banner) values('legacy',$1,'x','X','PROTEIN',1,1,2,1,'KING_SOOPERS','KS')", [alice])).rejects.toThrow('pantry_upgrade_required');
  });
  it('denies direct writes and isolates accounts even with identical entry and mutation IDs', async () => {
    await expect(db.exec("update public.user_pantry_entries set entry='{}'")).rejects.toThrow('permission denied');
    await asUser(bob);
    expect((await db.query('select * from public.user_pantry_entries')).rows).toEqual([]);
    expect((await rpc<PantryMigrationSnapshot>('read')).entries).toEqual([]);
    const current = await rpc<PantryMigrationSnapshot>('read');
    await rpc('migrate', { source: current.legacySource, entries: [] });
    expect(await rpc('mutate', put())).toMatchObject({ status: 'applied', entry: { revision: 1 } });
    await asUser(alice);
    expect((await rpc<PantryMigrationSnapshot>('read')).entries.find((entry) => entry.id === 'one')?.revision).toBe(3);
  });
  it('cascades account deletion through entries, acknowledgments, and archived source', async () => {
    await db.query('delete from public.users where id=$1', [alice]);
    await expect(rpc('read')).rejects.toThrow('session_required');
    await db.exec('reset role');
    for (const table of ['user_pantry_entries', 'user_pantry_mutations', 'user_pantry_migrations']) {
      expect((await db.query(`select * from public.${table} where user_id=$1`, [alice])).rows).toEqual([]);
    }
  });
});
