import { describe, it, expect, vi } from 'vitest';
import { createSyncQueue, syncQueueKey, prepareSyncMutation } from '@/lib/sync/queue';
import { UserSyncPayload } from '@/types/domain';

const payload: UserSyncPayload = {
  authenticated: true, profile: { id: 'alice', email: '', displayName: 'Alice', provider: 'google', isCloudBacked: false, createdAtIso: '', updatedAtIso: '' },
  preferences: null, freezerItems: [], savedRecipes: [], storageMode: 'SQLITE_LOCAL_FALLBACK', supabaseConfigured: false, syncedAtIso: '',
};
function setup() {
  const data = new Map<string, string>();
  const storage = { getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value); }, removeItem: (key: string) => { data.delete(key); } };
  return { storage, queue: createSyncQueue(storage) };
}

describe('durable account-scoped sync queue', () => {
  it('retains failed HTTP requests and network failures across reloads, then clears after acknowledgment', async () => {
    const { storage, queue } = setup();
    queue.enqueue('alice', { preferences: { defaultZip: '80542' } });
    await queue.flush('alice', async () => null);
    expect(storage.getItem(syncQueueKey('alice'))).toContain('80542');
    await expect(queue.flush('alice', async () => { throw new Error('offline'); })).rejects.toThrow('offline');
    const reloaded = createSyncQueue(storage);
    await reloaded.flush('alice', async () => payload);
    expect(storage.getItem(syncQueueKey('alice'))).toBeNull();
  });

  it('does not lose an edit queued while a request is in flight', async () => {
    const { storage, queue } = setup();
    queue.enqueue('alice', { preferences: { defaultZip: '11111' } });
    let acknowledge!: (value: UserSyncPayload) => void;
    const send = vi.fn().mockImplementationOnce(() => new Promise((resolve) => { acknowledge = resolve; }))
      .mockResolvedValue(payload);
    const flushing = queue.flush('alice', send);
    queue.enqueue('alice', { preferences: { defaultZip: '22222' } });
    const concurrent = queue.flush('alice', send);
    acknowledge(payload);
    await Promise.all([flushing, concurrent]);
    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[1][0].preferences.defaultZip).toBe('22222');
    expect(storage.getItem(syncQueueKey('alice'))).toBeNull();
  });

  it('never sends another account’s queue and rejects mismatched acknowledgments', async () => {
    const { storage, queue } = setup();
    queue.enqueue('alice', { freezerItems: [] });
    const send = vi.fn().mockResolvedValue(payload);
    await queue.flush('bob', send);
    expect(send).not.toHaveBeenCalled();
    await queue.flush('alice', async () => ({ ...payload, profile: { ...payload.profile!, id: 'bob' } }));
    expect(storage.getItem(syncQueueKey('alice'))).not.toBeNull();
  });

  it('turns guest merges into replacement snapshots so retries cannot accumulate stock twice', () => {
    const item = { id: 'one', canonicalIngredientId: 'beef', ingredientName: 'Beef', category: 'PROTEIN' as const,
      quantityLbOrDoz: 2, unit: 'lb' as const, purchasePricePerUnit: 2, regularPricePerUnit: 4,
      totalCostBasis: 4, estimatedSavings: 4, store: 'KING_SOOPERS' as const, storeBanner: '', purchasedAtIso: '' };
    const mutation = prepareSyncMutation({ freezerItems: [{ ...item, quantityLbOrDoz: 3 }], mergeMode: true }, { ...payload, freezerItems: [item] });
    expect(mutation.mergeMode).toBe(false);
    expect(mutation.freezerItems?.[0].quantityLbOrDoz).toBe(5);
    expect(mutation.freezerItems?.[0].totalCostBasis).toBe(10);
  });
});
