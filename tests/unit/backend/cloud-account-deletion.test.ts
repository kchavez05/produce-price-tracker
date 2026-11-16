import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserProfile } from '@/types/domain';

const mocks = vi.hoisted(() => ({
  createAdmin: vi.fn(), createServer: vi.fn(), getUser: vi.fn(), signOut: vi.fn(), deleteUser: vi.fn(),
  deleteLocal: vi.fn(), revokeLocal: vi.fn(), cookieGet: vi.fn(), cookieDelete: vi.fn(),
}));
vi.mock('@supabase/supabase-js', () => ({ createClient: mocks.createAdmin }));
vi.mock('@/lib/supabase/server', () => ({ createServerSupabaseClient: mocks.createServer }));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: mocks.cookieGet, delete: mocks.cookieDelete }) }));
vi.mock('@/lib/db/sqlite', async importOriginal => ({
  ...await importOriginal<typeof import('@/lib/db/sqlite')>(),
  deleteUserAccountFromSqlite: mocks.deleteLocal, revokeLocalSession: mocks.revokeLocal,
}));
import { purgeUserAccountAndData } from '@/lib/supabase/session';

const owner = '11111111-1111-4111-8111-111111111111';
const profile: UserProfile = { id: owner, email: 'fixture@example.invalid', displayName: 'Fixture',
  provider: 'google', isCloudBacked: true, createdAtIso: '', updatedAtIso: '' };
let events: string[];
beforeEach(() => {
  vi.resetAllMocks(); events = [];
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://unit.supabase.co');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'public-test');
  vi.stubEnv('SUPABASE_SECRET_KEY', 'server-test-only');
  mocks.createServer.mockResolvedValue({ auth: { getUser: mocks.getUser, signOut: mocks.signOut } });
  mocks.createAdmin.mockReturnValue({ auth: { admin: { deleteUser: mocks.deleteUser } } });
  mocks.getUser.mockImplementation(async () => { events.push('verify'); return { data: { user: { id: owner } }, error: null }; });
  mocks.signOut.mockImplementation(async () => { events.push('revoke'); return { error: null }; });
  mocks.deleteUser.mockImplementation(async () => { events.push('delete-auth'); return { error: null }; });
  mocks.deleteLocal.mockImplementation(() => { events.push('delete-local'); });
  mocks.cookieGet.mockReturnValue({ value: 'opaque-test-session' });
});
afterEach(() => vi.unstubAllEnvs());

describe('verified cloud account deletion', () => {
  it('revokes globally, hard-deletes only the fresh Auth subject, then clears local data', async () => {
    await purgeUserAccountAndData(profile);
    expect(events).toEqual(['verify', 'revoke', 'delete-auth', 'delete-local']);
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: 'global' });
    expect(mocks.deleteUser).toHaveBeenCalledExactlyOnceWith(owner, false);
    expect(mocks.deleteLocal).toHaveBeenCalledWith(owner);
    expect(mocks.revokeLocal).toHaveBeenCalledWith('opaque-test-session');
    expect(mocks.cookieDelete).toHaveBeenCalledWith('pantrybot_session_v14');
    expect(mocks.createAdmin).toHaveBeenCalledWith('https://unit.supabase.co', 'server-test-only', expect.objectContaining({
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    }));
  });
  it.each(['different-owner', null])('does not delete when the verified subject is %s', async id => {
    mocks.getUser.mockResolvedValue({ data: { user: id ? { id } : null }, error: null });
    await expect(purgeUserAccountAndData(profile)).rejects.toThrow('ownership');
    expect(mocks.signOut).not.toHaveBeenCalled(); expect(mocks.deleteUser).not.toHaveBeenCalled();
    expect(mocks.deleteLocal).not.toHaveBeenCalled();
  });
  it('fails closed on verification errors', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: owner } }, error: new Error('Auth unavailable') });
    await expect(purgeUserAccountAndData(profile)).rejects.toThrow('ownership');
    expect(mocks.deleteUser).not.toHaveBeenCalled(); expect(mocks.deleteLocal).not.toHaveBeenCalled();
  });
  it.each(['SUPABASE_SECRET_KEY', 'NEXT_PUBLIC_SUPABASE_URL'])('requires cloud deletion configuration: %s', async key => {
    vi.stubEnv(key, '');
    await expect(purgeUserAccountAndData(profile)).rejects.toThrow('unavailable');
    expect(mocks.createAdmin).not.toHaveBeenCalled(); expect(mocks.signOut).not.toHaveBeenCalled();
    expect(mocks.deleteUser).not.toHaveBeenCalled(); expect(mocks.deleteLocal).not.toHaveBeenCalled();
  });
  it('does not delete Auth or local data if session revocation fails', async () => {
    mocks.signOut.mockResolvedValue({ error: new Error('Revocation failed') });
    await expect(purgeUserAccountAndData(profile)).rejects.toThrow('revoke');
    expect(mocks.deleteUser).not.toHaveBeenCalled(); expect(mocks.deleteLocal).not.toHaveBeenCalled();
  });
  it('does not acknowledge local cleanup when Auth deletion fails', async () => {
    mocks.deleteUser.mockResolvedValue({ error: new Error('Deletion failed') });
    await expect(purgeUserAccountAndData(profile)).rejects.toThrow('deletion failed');
    expect(mocks.deleteLocal).not.toHaveBeenCalled(); expect(mocks.revokeLocal).not.toHaveBeenCalled();
    expect(mocks.cookieDelete).not.toHaveBeenCalled();
  });
  it('retains keyless local-account deletion', async () => {
    vi.stubEnv('SUPABASE_SECRET_KEY', ''); vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    await purgeUserAccountAndData({ ...profile, isCloudBacked: false });
    expect(mocks.createServer).not.toHaveBeenCalled(); expect(mocks.createAdmin).not.toHaveBeenCalled();
    expect(mocks.deleteLocal).toHaveBeenCalledWith(owner);
    expect(mocks.cookieDelete).toHaveBeenCalledWith('pantrybot_session_v14');
  });
});
