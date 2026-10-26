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
});
