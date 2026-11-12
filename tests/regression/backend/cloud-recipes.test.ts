import { cookieJar } from 'tests/support/cookies';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
const cloud = vi.hoisted(() => ({
  recipes: [] as { id: string; user_id: string; dish_json: unknown }[],
  failTable: '', calls: [] as string[],
}));
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: 'cloud-user', email: 'test@example.com' } } }) },
    from(table: string) {
      let action = 'select'; let rows: Record<string, unknown>[] = []; let ids: string[] = [];
      const query = {
        select: () => query, eq: () => query, order: () => query, maybeSingle: () => query,
        in: (_key: string, values: string[]) => { ids = values; return query; },
        upsert: (values: Record<string, unknown> | Record<string, unknown>[], options?: { onConflict: string }) => {
          action = 'upsert'; rows = Array.isArray(values) ? values : [values];
          if (table === 'user_saved_recipes') expect(options?.onConflict).toBe('user_id,id');
          return query;
        },
        delete: () => { action = 'delete'; return query; },
        then(resolve: (result: { data: unknown; error: { message: string } | null }) => unknown) {
          cloud.calls.push(`${table}:${action}`);
          if (cloud.failTable === table) return Promise.resolve(resolve({ data: null, error: { message: 'database unavailable' } }));
          if (table === 'user_saved_recipes') {
            if (action === 'upsert') for (const row of rows) {
              cloud.recipes = cloud.recipes.filter((r) => r.id !== row.id);
              cloud.recipes.push(row as unknown as typeof cloud.recipes[number]);
            }
            if (action === 'delete') cloud.recipes = cloud.recipes.filter((r) => !ids.includes(r.id));
            return Promise.resolve(resolve({ data: cloud.recipes, error: null }));
          }
          return Promise.resolve(resolve({ data: table === 'user_preferences' ? null : [], error: null }));
        },
      };
      return query;
    },
  }),
}));
import { persistUserSyncState, loadUserSyncPayload } from '@/lib/supabase/session';
import { upsertUserProfileToSqlite, resetSqliteTestInstance } from '@/lib/db/sqlite';
import { createMockDish } from 'tests/test-utils';
import { NextRequest } from 'next/server';
import { POST as saveRecipe } from '@/app/api/saved-recipes/route';
const profile = { id: 'cloud-user', email: '', displayName: 'Tester', provider: 'google' as const,
  createdAtIso: '', updatedAtIso: '', isCloudBacked: true };
describe('cloud saved-recipe persistence', () => {
  beforeEach(() => {
    vi.stubEnv('PANTRYBOT_SQLITE_PATH', ':memory:');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test');
    cookieJar.clear(); resetSqliteTestInstance(); cloud.recipes = []; cloud.failTable = ''; cloud.calls = [];
    upsertUserProfileToSqlite(profile);
  });
  afterEach(() => { resetSqliteTestInstance(); vi.unstubAllEnvs(); });
  it('round-trips saved recipes through cloud hydration, replacements, and deletions', async () => {
    await persistUserSyncState({ profile, savedRecipes: [createMockDish({ id: 'first' }), createMockDish({ id: 'second' })] });
    expect((await loadUserSyncPayload()).savedRecipes.map((r) => r.id)).toEqual(['first', 'second']);
    await persistUserSyncState({ profile, savedRecipes: [createMockDish({ id: 'second', title: 'Updated' })] });
    expect((await loadUserSyncPayload()).savedRecipes.map((r) => r.title)).toEqual(['Updated']);
    await persistUserSyncState({ profile, savedRecipes: [] });
    expect((await loadUserSyncPayload()).savedRecipes).toEqual([]);
  });
  it('does not acknowledge failed cloud writes or proceed to destructive cleanup', async () => {
    cloud.failTable = 'user_saved_recipes';
    await expect(persistUserSyncState({ profile, savedRecipes: [createMockDish()] })).rejects.toThrow('Cloud sync failed');
    expect(cloud.calls).not.toContain('user_saved_recipes:delete');
  });
  const pricedDish = () => createMockDish({ id: 'priced', pantryPricing: {
    rows: [{ ingredientId: 'olive-oil', quantity: 1, unit: 'tbsp', requirementKey: 'synthetic',
      allocatedCents: 1, estimatedCost: .01, priceBasis: 'OBSERVED', observation: {
        source: 'KROGER_PRODUCTION', quoteId: 'untrusted-stale-quote', productId: 'synthetic-product', itemId: 'synthetic-item',
        locationId: 'synthetic-store', observedAtIso: '2000-01-01T00:00:00Z', packagePrice: 4,
        packageAmount: '16', packageUnit: 'fl oz', sourceSizeLabel: '16 fl oz', ruleVersion: 'synthetic', stockUnconfirmed: true,
      } }], total: .01, includesStaticEstimates: false, incompleteEstimate: false,
    evaluatedAtIso: '2000-01-01T00:00:00Z', marketId: 'synthetic', selectedLocationIds: ['synthetic-store'],
  } });
  it.each([false, true])('strips client-derived pricing before the cloud upsert in mergeMode=%s', async (mergeMode) => {
    const dish = pricedDish(); const original = JSON.stringify(dish);
    const result = await persistUserSyncState({ profile, savedRecipes: [dish], mergeMode });
    expect(cloud.calls).toContain('user_saved_recipes:upsert');
    expect(cloud.recipes).toMatchObject([{ id: dish.id, user_id: profile.id, dish_json: { title: dish.title, savedInLibrary: true } }]);
    expect(cloud.recipes[0].dish_json).not.toHaveProperty('pantryPricing');
    expect(result.savedRecipes[0]).not.toHaveProperty('pantryPricing');
    expect((await loadUserSyncPayload()).savedRecipes[0]).not.toHaveProperty('pantryPricing');
    expect(JSON.stringify(dish)).toBe(original);
  });
  it('strips derived pricing from a direct saved-recipes POST before cloud storage and response', async () => {
    const dish = pricedDish();
    const response = await saveRecipe(new NextRequest('http://localhost/api/saved-recipes', {
      method: 'POST', headers: { host: 'localhost', origin: 'http://localhost', 'content-type': 'application/json' },
      body: JSON.stringify({ dish }),
    }));
    expect(response.status).toBe(200);
    expect(cloud.calls).toContain('user_saved_recipes:upsert');
    expect(cloud.recipes[0].dish_json).not.toHaveProperty('pantryPricing');
    expect((await response.json()).recipes[0]).not.toHaveProperty('pantryPricing');
    expect(dish.pantryPricing?.rows[0].observation?.quoteId).toBe('untrusted-stale-quote');
  });
});
