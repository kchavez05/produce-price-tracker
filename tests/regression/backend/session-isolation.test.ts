import { cookieJar } from 'tests/support/cookies';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as account, POST as signIn, DELETE as deleteAccount } from '@/app/api/account/route';
import { GET as recipes, POST as saveRecipe, DELETE as deleteRecipe } from '@/app/api/saved-recipes/route';
import { POST as addFreezer } from '@/app/api/freezer/route';
import { GET as dashboard } from '@/app/api/dashboard/route';
import { POST as sync } from '@/app/api/sync/route';
import { resolveCurrentUserProfile } from '@/lib/supabase/session';
import { LOCAL_SESSION_COOKIE_NAME, GUEST_SESSION_COOKIE_NAME } from '@/lib/supabase/config';
import { createLocalSession, resetSqliteTestInstance, upsertUserProfileToSqlite, getUserSavedRecipesFromSqlite, replaceUserSavedRecipesInSqlite } from '@/lib/db/sqlite';
import { createMockDish } from 'tests/test-utils';

const req = (path: string, body?: unknown, method = 'POST') => new NextRequest(`http://localhost${path}`, {
  method, headers: { host: 'localhost', origin: 'http://localhost', 'content-type': 'application/json' },
  body: body === undefined ? undefined : JSON.stringify(body),
});
const profile = { id: 'victim', email: 'victim@example.com', displayName: 'Victim', provider: 'google' as const,
  createdAtIso: new Date().toISOString(), updatedAtIso: new Date().toISOString(), isCloudBacked: false };

describe('private session and inventory boundaries', () => {
  beforeEach(() => {
    vi.stubEnv('PANTRYBOT_SQLITE_PATH', ':memory:');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    cookieJar.clear(); resetSqliteTestInstance();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
  });
  afterEach(() => { resetSqliteTestInstance(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

  it('rejects forged JSON identities and unknown tokens without creating an account', async () => {
    upsertUserProfileToSqlite(profile);
    cookieJar.set(LOCAL_SESSION_COOKIE_NAME, JSON.stringify({ userId: profile.id, provider: 'google' }));
    expect((await resolveCurrentUserProfile()).profile).toBeNull();
    expect((await deleteAccount(req('/api/account', undefined, 'DELETE'))).status).toBe(401);
    cookieJar.set(LOCAL_SESSION_COOKIE_NAME, 'a'.repeat(64));
    expect((await resolveCurrentUserProfile()).profile).toBeNull();
  });

  it('revokes tokens on sign out and does not reuse identities based on email', async () => {
    await signIn(req('/api/account', { action: 'SIGN_IN_LOCAL', email: profile.email }));
    const first = (await resolveCurrentUserProfile()).profile!;
    const token = cookieJar.get(LOCAL_SESSION_COOKIE_NAME)!;
    await account(req('/api/account', { action: 'SIGN_OUT' }));
    cookieJar.set(LOCAL_SESSION_COOKIE_NAME, token);
    expect((await resolveCurrentUserProfile()).profile).toBeNull();
    await signIn(req('/api/account', { action: 'SIGN_IN_LOCAL', email: profile.email }));
    expect((await resolveCurrentUserProfile()).profile?.id).not.toBe(first.id);
  });

  it('expires local sessions', async () => {
    upsertUserProfileToSqlite(profile);
    cookieJar.set(LOCAL_SESSION_COOKIE_NAME, createLocalSession(profile.id));
    const clock = vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 31 * 86400_000);
    expect((await resolveCurrentUserProfile()).profile).toBeNull();
    clock.mockRestore();
  });

  it('keeps cached inventory and sessions when refreshing profile metadata', async () => {
    upsertUserProfileToSqlite(profile);
    replaceUserSavedRecipesInSqlite(profile.id, [createMockDish({ id: 'private' })]);
    cookieJar.set(LOCAL_SESSION_COOKIE_NAME, createLocalSession(profile.id));
    upsertUserProfileToSqlite({ ...profile, displayName: 'New name' });
    expect(getUserSavedRecipesFromSqlite(profile.id)).toHaveLength(1);
    expect((await resolveCurrentUserProfile()).profile?.displayName).toBe('New name');
  });

  it('isolates guest recipes and freezer data through dashboard reads and deletes', async () => {
    expect((await saveRecipe(req('/api/saved-recipes', { dish: createMockDish({ id: 'private-recipe' }) }))).status).toBe(200);
    const ownerToken = cookieJar.get(GUEST_SESSION_COOKIE_NAME)!;
    await addFreezer(req('/api/freezer', { item: {
      id: 'private-freezer', canonicalIngredientId: 'ground-beef-80-20', ingredientName: 'Beef', category: 'PROTEIN',
      quantityLbOrDoz: 2, unit: 'lb', purchasePricePerUnit: 2, regularPricePerUnit: 3,
      totalCostBasis: 4, estimatedSavings: 2, store: 'KING_SOOPERS', storeBanner: 'KS', purchasedAtIso: new Date().toISOString(),
    } }));
    cookieJar.clear();
    expect((await (await recipes()).json()).recipes).toEqual([]);
    await deleteRecipe(req('/api/saved-recipes?id=private-recipe', undefined, 'DELETE'));
    const stranger = await (await dashboard(req('/api/dashboard', undefined, 'GET'))).json();
    expect(stranger.freezerInventory).toEqual([]);
    expect(stranger.allRankedDishes.some((d: { id: string }) => d.id === 'private-recipe')).toBe(false);
    cookieJar.set(GUEST_SESSION_COOKIE_NAME, ownerToken);
    expect((await (await recipes()).json()).recipes).toHaveLength(1);
    const owner = await (await dashboard(req('/api/dashboard', undefined, 'GET'))).json();
    expect(owner.freezerInventory[0].id).toBe('private-freezer');
    expect(owner.allRankedDishes.some((d: { id: string }) => d.id === 'private-recipe')).toBe(true);
  });

  it('isolates authenticated accounts with identical recipe IDs and rejects a mismatched queue owner', async () => {
    upsertUserProfileToSqlite(profile);
    cookieJar.set(LOCAL_SESSION_COOKIE_NAME, createLocalSession(profile.id));
    await saveRecipe(req('/api/saved-recipes', { dish: createMockDish({ id: 'same', title: 'Owner recipe' }) }));
    const other = { ...profile, id: 'other' };
    upsertUserProfileToSqlite(other);
    cookieJar.set(LOCAL_SESSION_COOKIE_NAME, createLocalSession(other.id));
    await saveRecipe(req('/api/saved-recipes', { dish: createMockDish({ id: 'same', title: 'Other recipe' }) }));
    await deleteRecipe(req('/api/saved-recipes?id=same', undefined, 'DELETE'));
    expect(getUserSavedRecipesFromSqlite(profile.id)[0].title).toBe('Owner recipe');
    expect((await sync(req('/api/sync', { userId: profile.id, freezerItems: [] }))).status).toBe(409);
  });
});
