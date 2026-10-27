import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { lastSuccessfulRefresh, recordRefreshAudit } from '@/lib/refresh-audit';
import { resetSqliteTestInstance } from '@/lib/db/sqlite';

const cloud = vi.hoisted(() => ({ insert: vi.fn(), maybeSingle: vi.fn() }));
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ from: () => ({
    insert: cloud.insert,
    select: () => ({ eq: () => ({ eq: () => ({ order: () => ({ limit: () => ({ maybeSingle: cloud.maybeSingle }) }) }) }) }),
  }) }),
}));

const entry = {
  zip_code: '80542', cycle: 'test', attempted_at: '2026-10-27T18:00:00Z',
  status: 'live' as const, flipp_offer_count: 2, kroger_offer_count: 0, usda_live: false,
};

describe('refresh audit durability and failures', () => {
  beforeEach(() => {
    vi.stubEnv('PANTRYBOT_SQLITE_PATH', ':memory:');
    vi.stubEnv('SUPABASE_SECRET_KEY', '');
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    resetSqliteTestInstance();
  });
  afterEach(() => { resetSqliteTestInstance(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });

  it('retains last successful retrieval through later failures and scopes it by ZIP', async () => {
    expect(await recordRefreshAudit(entry)).toBe('local');
    const successful = await lastSuccessfulRefresh('80542');
    expect(successful).toBeTruthy();
    await recordRefreshAudit({ ...entry, status: 'estimates_only', flipp_offer_count: 0 });
    await recordRefreshAudit({ ...entry, status: 'failed', flipp_offer_count: 0 });
    expect(await lastSuccessfulRefresh('80542')).toBe(successful);
    expect(await lastSuccessfulRefresh('80202')).toBeNull();
  });

  it('reports a cloud write error instead of acknowledging durable storage', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('SUPABASE_SECRET_KEY', 'test-server-key');
    cloud.insert.mockResolvedValue({ error: { message: 'unavailable' } });
    expect(await recordRefreshAudit(entry)).toBe('unavailable');
    cloud.insert.mockResolvedValue({ error: null });
    expect(await recordRefreshAudit(entry)).toBe('cloud');
    expect(cloud.insert.mock.lastCall?.[0]).toMatchObject({ zip_code: '80542', flipp_offer_count: 2 });
  });

  it('reads persisted cloud success after a process restart', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('SUPABASE_SECRET_KEY', 'test-server-key');
    cloud.maybeSingle.mockResolvedValue({ data: { completed_at: '2026-10-27T17:00:00Z' }, error: null });
    expect(await lastSuccessfulRefresh('80542')).toBe('2026-10-27T17:00:00Z');
  });
});
