import { cookieJar } from 'tests/support/cookies';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/pantry/route';
import { POST as sync } from '@/app/api/sync/route';
import { POST as freezer } from '@/app/api/freezer/route';
import { GET as exportAccount, DELETE as deleteAccount } from '@/app/api/account/route';
import { createLocalSession, getDefaultUserPreferences, replaceUserFreezerItemsInSqlite, resetSqliteTestInstance, upsertUserPreferencesToSqlite, upsertUserProfileToSqlite } from '@/lib/db/sqlite';
import { LOCAL_SESSION_COOKIE_NAME } from '@/lib/supabase/config';
import { PantryMigrationSnapshot } from '@/lib/pantry/migration';
import { PantryMutation } from '@/types/pantry';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const req = (body?: unknown, method = 'POST', url = '/api/pantry') => new NextRequest(`http://localhost${url}`, {
  method, headers: { host: 'localhost', origin: 'http://localhost', 'content-type': 'application/json' },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});
async function read() { return (await (await GET(req(undefined, 'GET'))).json()) as PantryMigrationSnapshot; }
async function migrate() { const current = await read(); return POST(req({ owner: current.owner, action: 'migrate' })); }
function signIn(id: string) {
  upsertUserProfileToSqlite({ id, email: '', displayName: id, provider: 'google', createdAtIso: '', updatedAtIso: '', isCloudBacked: false });
  cookieJar.set(LOCAL_SESSION_COOKIE_NAME, createLocalSession(id));
}
describe('private pantry API in keyless mode', () => {
  beforeEach(() => { vi.stubEnv('PANTRYBOT_SQLITE_PATH', ':memory:'); vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', ''); vi.stubEnv('PANTRYBOT_PANTRY_ENABLED', 'true'); cookieJar.clear(); resetSqliteTestInstance(); });
  afterEach(() => { resetSqliteTestInstance(); vi.unstubAllEnvs(); });
  it('keeps rollout disabled by default and rejects malformed/cross-origin requests', async () => {
    vi.stubEnv('PANTRYBOT_PANTRY_ENABLED', 'false');
    expect((await GET(req(undefined, 'GET'))).status).toBe(503);
    vi.stubEnv('PANTRYBOT_PANTRY_ENABLED', 'true');
    expect((await POST(new NextRequest('http://localhost/api/pantry', { method: 'POST', headers: { host: 'localhost', origin: 'https://elsewhere.test' } }))).status).toBe(403);
    expect((await POST(req([]))).status).toBe(400);
  });
  it('persists quantity-free guest entries, retries idempotently, and isolates private sessions', async () => {
    const current = await read();
    expect(current.owner).toMatch(/^guest:/);
    expect((await migrate()).status).toBe(200);
    const mutation: PantryMutation = { mutationId: 'guest-one', entryId: 'one', expectedRevision: 0, operation: 'put', entry: { displayName: 'My spice', available: true } };
    const body = { owner: current.owner, action: 'mutate', mutation };
    const first = await POST(req(body));
    expect(first.headers.get('cache-control')).toBe('private, no-store');
    expect(first.status).toBe(200);
    expect(await (await POST(req(body))).json()).toEqual(await first.json());
    const tokens = [...cookieJar.entries()];
    expect((await read()).entries[0]).toMatchObject({ displayName: 'My spice', available: true, revision: 1 });
    cookieJar.clear();
    expect((await read()).entries).toEqual([]);
    expect((await POST(req(body))).status).toBe(409);
    for (const [key, value] of tokens) cookieJar.set(key, value);
    expect((await read()).entries).toHaveLength(1);
  });
  it('preserves legacy data and fences old writes without blocking unrelated preferences', async () => {
    signIn('alice');
    upsertUserPreferencesToSqlite({ ...getDefaultUserPreferences('alice'), onHandIngredientIds: ['ground-turkey'] });
    replaceUserFreezerItemsInSqlite('alice', [{ id: 'old-lot', canonicalIngredientId: 'chicken-thighs-boneless', ingredientName: 'Chicken thighs', category: 'PROTEIN', quantityLbOrDoz: 2, unit: 'lb', purchasePricePerUnit: 2, regularPricePerUnit: 4, totalCostBasis: 4, estimatedSavings: 4, store: 'KING_SOOPERS', storeBanner: 'KS', purchasedAtIso: '2026-10-01' }]);
    expect((await migrate()).status).toBe(200);
    expect((await read()).entries).toHaveLength(2);
    expect((await sync(req({ freezerItems: [] }, 'POST', '/api/sync'))).status).toBe(426);
    expect((await sync(req({ preferences: { onHandIngredientIds: [] } }, 'POST', '/api/sync'))).status).toBe(426);
    expect((await sync(req({ preferences: { defaultZip: '10001' } }, 'POST', '/api/sync'))).status).toBe(200);
    const archived = await (await exportAccount(req(undefined, 'GET', '/api/account'))).json();
    expect(archived.virtualPantry.legacySource.freezerItems[0].id).toBe('old-lot');
    expect((await freezer(req({ item: archived.virtualPantry.legacySource.freezerItems[0] }))).status).toBe(426);
    expect((await read()).entries).toHaveLength(2);
  });
  it('keeps stale edits pending for explicit resolution and protects account identity', async () => {
    signIn('alice'); await migrate();
    const mutation = { mutationId: 'a1', entryId: 'same-id', expectedRevision: 0, operation: 'put', entry: { displayName: 'Rice', available: true, quantity: 0, useByDate: '2000-01-01' } };
    const body = { owner: 'account:alice', action: 'mutate', mutation };
    expect((await POST(req(body))).status).toBe(200);
    expect((await POST(req({ ...body, mutation: { mutationId: 'd1', entryId: 'same-id', expectedRevision: 1, operation: 'delete' } }))).status).toBe(200);
    const stale = await POST(req({ ...body, mutation: { ...mutation, mutationId: 'a2', expectedRevision: 1 } }));
    expect(stale.status).toBe(409);
    expect(await stale.json()).toMatchObject({ status: 'conflict', current: { revision: 2, deletedAtIso: expect.any(String) } });
    signIn('bob'); await migrate();
    expect((await POST(req(body))).status).toBe(409);
    expect((await read()).entries).toEqual([]);
    expect((await POST(req({ ...body, owner: 'account:bob' }))).status).toBe(200);
  });
  it('does not acknowledge edits before migration, validates values, and deletes all pantry data with the account', async () => {
    signIn('alice');
    const body = { owner: 'account:alice', action: 'mutate', mutation: { mutationId: 'm1', entryId: 'entry', operation: 'put', expectedRevision: 0, entry: { displayName: 'Oil', available: true } } };
    expect((await POST(req(body))).status).toBe(409);
    await migrate();
    expect((await POST(req({ ...body, mutation: { ...body.mutation, entry: { displayName: 'Oil', available: true, useByDate: '2026-02-29' } } }))).status).toBe(400);
    expect((await POST(req(body))).status).toBe(200);
    expect((await deleteAccount(req(undefined, 'DELETE', '/api/account'))).status).toBe(200);
    expect((await read()).entries).toEqual([]);
  });
  it('restores persisted entries in a fresh database connection and fresh authenticated session', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'pantry-reopen-'));
    try {
      resetSqliteTestInstance();
      vi.stubEnv('PANTRYBOT_SQLITE_PATH', join(directory, 'pantry.sqlite'));
      signIn('alice'); await migrate();
      expect((await POST(req({ owner: 'account:alice', action: 'mutate', mutation: { mutationId: 'persist', entryId: 'oil', expectedRevision: 0, operation: 'put', entry: { displayName: 'Olive oil', ingredientId: 'olive-oil', available: true } } }))).status).toBe(200);
      resetSqliteTestInstance(); cookieJar.clear();
      cookieJar.set(LOCAL_SESSION_COOKIE_NAME, createLocalSession('alice'));
      expect((await read()).entries).toMatchObject([{ id: 'oil', available: true, revision: 1 }]);
    } finally { resetSqliteTestInstance(); rmSync(directory, { recursive: true, force: true }); }
  });
});
