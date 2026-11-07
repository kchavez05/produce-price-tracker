import { describe, expect, it, vi } from 'vitest';
const cloud = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn(), select: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createServerSupabaseClient: async () => cloud }));
import { pantryRpc, readPrivatePantry, mutatePrivatePantry, PantryContext } from '@/lib/pantry/server';

describe('pantry cloud acknowledgment failures', () => {
  it('advertises only installed database IDs and fails closed on readiness query errors', async () => {
    const context: PantryContext = { owner: 'account:alice', profile: { id: 'alice', email: 'fixture@example.test', displayName: 'Fixture', provider: 'google', createdAtIso: '', updatedAtIso: '', isCloudBacked: true } };
    cloud.from.mockReturnValue({ select: cloud.select });
    cloud.rpc.mockResolvedValue({ data: { owner: 'account:alice', entries: [] }, error: null });
    cloud.select.mockResolvedValueOnce({ data: [{ id: 'olive-oil' }], error: null });
    expect(await readPrivatePantry(context)).toMatchObject({ acceptedCatalogIds: ['olive-oil'], catalogVersion: '2026-11-07.1' });
    cloud.select.mockResolvedValueOnce({ data: null, error: { message: 'missing migration' } });
    await expect(readPrivatePantry(context)).rejects.toMatchObject({ code: 'storage_unavailable' });
  });
  it('uses the durable SQL registry for queued future IDs after rollback and surfaces rejections', async () => {
    const context: PantryContext = { owner: 'account:alice', profile: { id: 'alice', email: 'fixture@example.test', displayName: 'Fixture', provider: 'google', createdAtIso: '', updatedAtIso: '', isCloudBacked: true } };
    const mutation = { mutationId: 'future', entryId: 'queued-before-rollback', expectedRevision: 0, operation: 'put' as const, entry: { ingredientId: 'future-item', displayName: 'Future item', available: false } };
    cloud.rpc.mockResolvedValueOnce({ data: null, error: { message: 'invalid_entry' } });
    await expect(mutatePrivatePantry(context, mutation)).rejects.toMatchObject({ code: 'invalid_entry' });
    cloud.rpc.mockResolvedValueOnce({ data: { status: 'applied', mutationId: 'future' }, error: null });
    expect(await mutatePrivatePantry(context, mutation)).toMatchObject({ status: 'applied' });
    expect(cloud.rpc).toHaveBeenLastCalledWith('pantry_rpc', { p_action: 'mutate', p_payload: mutation });
  });
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
