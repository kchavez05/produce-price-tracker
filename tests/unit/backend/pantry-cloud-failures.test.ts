import { describe, expect, it, vi } from 'vitest';
const cloud = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createServerSupabaseClient: async () => cloud }));
import { pantryRpc } from '@/lib/pantry/server';

describe('pantry cloud acknowledgment failures', () => {
  it('does not acknowledge database failures or an empty acknowledgment', async () => {
    cloud.rpc.mockResolvedValueOnce({ data: null, error: { message: 'database unavailable' } });
    await expect(pantryRpc('mutate')).rejects.toMatchObject({ code: 'storage_unavailable', status: 503 });
    cloud.rpc.mockResolvedValueOnce({ data: null, error: null });
    await expect(pantryRpc('mutate')).rejects.toMatchObject({ code: 'storage_unavailable', status: 503 });
  });
  it('surfaces migration conflicts for retry and never falls back to a local success', async () => {
    cloud.rpc.mockResolvedValueOnce({ data: null, error: { message: 'legacy_changed' } });
    await expect(pantryRpc('migrate')).rejects.toMatchObject({ code: 'legacy_changed', status: 409 });
    cloud.rpc.mockRejectedValueOnce(new Error('offline'));
    await expect(pantryRpc('mutate')).rejects.toThrow('offline');
  });
});
