import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { cookieJar } from 'tests/support/cookies';

const cloud = vi.hoisted(() => ({ getUser: vi.fn(), from: vi.fn(), upsert: vi.fn(), rpc: vi.fn(), select: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createServerSupabaseClient: async () => ({
  auth: { getUser: cloud.getUser }, from: cloud.from, rpc: cloud.rpc,
}) }));
import { GET, POST } from '@/app/api/pantry/route';
import { resetSqliteTestInstance } from '@/lib/db/sqlite';

const user = { id: 'verified-account', email: 'fixture@example.test', app_metadata: { provider: 'google' },
  user_metadata: { full_name: 'Fixture' }, created_at: '2026-11-12T00:00:00Z' };
const request = () => new NextRequest('http://localhost/api/pantry');

describe('signed-in Pantry application profile recovery', () => {
  beforeEach(() => {
    vi.stubEnv('PANTRYBOT_SQLITE_PATH', ':memory:');
    vi.stubEnv('PANTRYBOT_PANTRY_ENABLED', 'true');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://fixture.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'fixture-public-key');
    resetSqliteTestInstance(); cookieJar.clear(); vi.resetAllMocks();
    cloud.getUser.mockResolvedValue({ data: { user }, error: null });
    cloud.from.mockImplementation((table: string) => {
      if (table === 'users') return { upsert: cloud.upsert };
      if (table === 'pantry_catalog') return { select: cloud.select };
      throw new Error(`Unexpected table: ${table}`);
    });
    cloud.select.mockResolvedValue({ data: [{ id: 'olive-oil' }], error: null });
  });
  afterEach(() => { resetSqliteTestInstance(); vi.unstubAllEnvs(); });

  it('repairs an orphaned verified identity before the guarded RPC, preserving an existing profile on reload', async () => {
    let applicationProfile: Record<string, unknown> | null = null;
    cloud.upsert.mockImplementation(async (row: Record<string, unknown>, options: { ignoreDuplicates: boolean }) => {
      if (!applicationProfile || !options.ignoreDuplicates) applicationProfile = { ...row };
      return { error: null };
    });
    cloud.rpc.mockImplementation(async () => applicationProfile
      ? { data: { owner: 'account:verified-account', entries: [], needsCatalogMatch: [] }, error: null }
      : { data: null, error: { message: 'session_required' } });

    const first = await GET(request());
    expect(first.status).toBe(200);
    expect(await first.json()).toMatchObject({ owner: 'account:verified-account', entries: [], acceptedCatalogIds: ['olive-oil'] });
    expect(cloud.upsert).toHaveBeenCalledWith({ id: user.id, email: user.email, display_name: 'Fixture',
      avatar_url: null, provider: 'google' }, { onConflict: 'id', ignoreDuplicates: true });
    expect(cloud.upsert.mock.invocationCallOrder[0]).toBeLessThan(cloud.rpc.mock.invocationCallOrder[0]);

    applicationProfile = { id: user.id, display_name: 'Existing account name' };
    expect((await GET(request())).status).toBe(200);
    expect(applicationProfile).toEqual({ id: user.id, display_name: 'Existing account name' });
    expect(cloud.from.mock.calls.every(([table]) => table === 'users' || table === 'pantry_catalog')).toBe(true);
  });

  it.each(['database error', 'network error'])('keeps a failed profile repair retryable without running the inventory mutation: %s', async (failure) => {
    if (failure === 'network error') cloud.upsert.mockRejectedValue(new Error('offline'));
    else cloud.upsert.mockResolvedValue({ error: { message: 'RLS rejected the write' } });
    const response = await POST(new NextRequest('http://localhost/api/pantry', { method: 'POST',
      headers: { origin: 'http://localhost', host: 'localhost', 'content-type': 'application/json' },
      body: JSON.stringify({ owner: 'account:verified-account', action: 'migrate' }),
    }));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ code: 'storage_unavailable' });
    expect(cloud.rpc).not.toHaveBeenCalled();
    expect(cookieJar.size).toBe(0);
  });

  it('keeps private keyless guests local without creating a cloud profile', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect((await response.json()).owner).toMatch(/^guest:/);
    expect(cloud.getUser).not.toHaveBeenCalled();
    expect(cloud.upsert).not.toHaveBeenCalled();
    expect(cloud.rpc).not.toHaveBeenCalled();
  });
});
