import { describe, it, expect, vi } from 'vitest';
import { createSyncQueue, syncQueueKey, prepareSyncMutation, clearSyncQueue } from '@/lib/sync/queue';
import { parseGuestFreezer } from '@/lib/pantry/legacy-sync';
import { UserSyncPayload } from '@/types/domain';
import { createTestSyncLock } from 'tests/sync-lock';

const payload: UserSyncPayload = {
  authenticated: true, profile: { id: 'alice', email: '', displayName: 'Alice', provider: 'google', isCloudBacked: false, createdAtIso: '', updatedAtIso: '' },
  preferences: null, savedRecipes: [], storageMode: 'SQLITE_LOCAL_FALLBACK', supabaseConfigured: false, syncedAtIso: '',
};
function setup() {
  const data = new Map<string, string>();
  const storage = { get length() { return data.size; }, key: (index: number) => [...data.keys()][index] ?? null, getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value); }, removeItem: (key: string) => { data.delete(key); } };
  const lock = createTestSyncLock();
  return { data, storage, lock, queue: createSyncQueue(storage, lock) };
}

describe('durable account-scoped sync queue', () => {
  it('hydrates without Web Locks while refusing unsafe queue writes and replay', async () => {
    const { storage, queue } = setup();
    await queue.enqueue('alice', { preferences: { defaultZip: '80542' } });
    vi.stubGlobal('navigator', {});
    try {
      const browserQueue = createSyncQueue(storage);
      expect(await browserQueue.overlay(payload)).toEqual(payload);
      const send = vi.fn();
      await expect(browserQueue.flush('alice', send)).rejects.toThrow('Web Locks');
      await expect(browserQueue.enqueue('alice', {})).rejects.toThrow('Web Locks');
      expect(send).not.toHaveBeenCalled();
      expect(storage.getItem(syncQueueKey('alice'))).not.toBeNull();
    } finally { vi.unstubAllGlobals(); }
  });
  it('purges only the deleted account queue and recovery namespace', async () => {
    const { storage, data, lock } = setup();
    for (const key of [syncQueueKey('alice'), `${syncQueueKey('alice')}:recovery:one`, `${syncQueueKey('alice')}:recovery:two`, syncQueueKey('bob'), `${syncQueueKey('bob')}:recovery:one`, syncQueueKey('alice-other')]) storage.setItem(key, 'private data');
    await clearSyncQueue(storage, 'alice', lock);
    expect([...data.keys()]).toEqual([syncQueueKey('bob'), `${syncQueueKey('bob')}:recovery:one`, syncQueueKey('alice-other')]);
  });
  it('waits for in-flight replay before purging every recovery copy it may create', async () => {
    const { storage, data, lock, queue } = setup();
    storage.setItem(syncQueueKey('alice'), JSON.stringify([{ userId: 'alice', mutationId: 'old', freezerItems: [], preferences: { defaultZip: '11111' } }]));
    await queue.enqueue('alice', { preferences: { defaultZip: '22222' } });
    let started!: () => void;
    let acknowledge!: (value: UserSyncPayload) => void;
    const sending = new Promise<void>(resolve => { started = resolve; });
    const replay = queue.flush('alice', () => new Promise<UserSyncPayload>(resolve => { acknowledge = resolve; started(); }));
    await sending;
    const purging = clearSyncQueue(storage, 'alice', lock);
    expect(storage.getItem(syncQueueKey('alice'))).not.toBeNull();
    acknowledge(payload);
    await Promise.all([replay, purging]);
    expect([...data.keys()]).toEqual([]);
  });

  it('retains failed HTTP requests and network failures across reloads, then clears after acknowledgment', async () => {
    const { storage, queue, lock } = setup();
    await queue.enqueue('alice', { preferences: { defaultZip: '80542' } });
    await queue.flush('alice', async () => null);
    expect(storage.getItem(syncQueueKey('alice'))).toContain('80542');
    await expect(queue.flush('alice', async () => { throw new Error('offline'); })).rejects.toThrow('offline');
    const reloaded = createSyncQueue(storage, lock);
    await reloaded.flush('alice', async () => payload);
    expect(storage.getItem(syncQueueKey('alice'))).toBeNull();
  });

  it('does not lose an edit queued while a request is in flight', async () => {
    const { storage, queue } = setup();
    await queue.enqueue('alice', { preferences: { defaultZip: '11111' } });
    let acknowledge!: (value: UserSyncPayload) => void;
    let started!: () => void;
    const sending = new Promise<void>((resolve) => { started = resolve; });
    const send = vi.fn().mockImplementationOnce(() => new Promise((resolve) => { acknowledge = resolve; started(); }))
      .mockResolvedValue(payload);
    const flushing = queue.flush('alice', send);
    await sending;
    await queue.enqueue('alice', { preferences: { defaultZip: '22222' } });
    const concurrent = queue.flush('alice', send);
    acknowledge(payload);
    await Promise.all([flushing, concurrent]);
    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[1][0].preferences.defaultZip).toBe('22222');
    expect(storage.getItem(syncQueueKey('alice'))).toBeNull();
  });

  it('never sends another account’s queue and rejects mismatched acknowledgments', async () => {
    const { storage, queue } = setup();
    await queue.enqueue('alice', { preferences: { defaultZip: '80542' } });
    const send = vi.fn().mockResolvedValue(payload);
    await queue.flush('bob', send);
    expect(send).not.toHaveBeenCalled();
    await queue.flush('alice', async () => ({ ...payload, profile: { ...payload.profile!, id: 'bob' } }));
    expect(storage.getItem(syncQueueKey('alice'))).not.toBeNull();
  });

  it('turns preference merges into retry-safe replacement snapshots', () => {
    const mutation = prepareSyncMutation({ preferences: { pinnedIngredientIds: ['rice'] }, mergeMode: true }, payload);
    expect(mutation.mergeMode).toBe(false);
    expect(mutation.preferences?.pinnedIngredientIds).toEqual(['rice']);
  });

  it('preserves older inventory queues verbatim without sending or acknowledging them', async () => {
    const { storage, queue } = setup();
    const raw = JSON.stringify([{ userId: 'alice', mutationId: 'older', freezerItems: [], preferences: { onHandIngredientIds: ['rice'] } }]);
    storage.setItem(syncQueueKey('alice'), raw);
    const send = vi.fn().mockResolvedValue(payload);
    await queue.overlay(payload);
    expect(await queue.flush('alice', send)).toBeNull();
    expect(send).not.toHaveBeenCalled();
    expect(storage.getItem(syncQueueKey('alice'))).toBe(raw);
    expect(() => queue.enqueue('alice', JSON.parse(raw)[0])).toThrow('Virtual Pantry');
  });

  it('syncs newer ordinary preferences without acknowledging or later replaying superseded legacy preferences', async () => {
    const { storage, data, queue } = setup();
    const raw = JSON.stringify([{ userId: 'alice', mutationId: 'older', freezerItems: [], preferences: { onHandIngredientIds: ['rice'], defaultZip: '11111', macroGoal: 'HIGH_PROTEIN' } }]);
    storage.setItem(syncQueueKey('alice'), raw);
    await queue.enqueue('alice', { preferences: { defaultZip: '22222' } });
    const send = vi.fn().mockResolvedValue(payload);
    await queue.flush('alice', send);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0].preferences).toEqual({ defaultZip: '22222' });
    const pending = JSON.parse(storage.getItem(syncQueueKey('alice'))!);
    expect(pending).toHaveLength(1);
    expect(pending[0]).toMatchObject({ mutationId: 'older', freezerItems: [], preferences: { onHandIngredientIds: ['rice'], macroGoal: 'HIGH_PROTEIN' } });
    expect(pending[0].preferences).not.toHaveProperty('defaultZip');
    expect([...data.entries()].some(([key, value]) => key.includes(':recovery:') && value.includes('11111'))).toBe(true);
    await queue.enqueue('alice', { preferences: { defaultZip: '33333' } });
    await queue.flush('alice', send);
    expect([...data.keys()].filter(key => key.includes(':recovery:'))).toHaveLength(1);
  });

  it.each(['{invalid', 'null', '{}', '[null]'])('recovers malformed storage %s without discarding the original bytes', async (raw) => {
    const { data, storage, queue } = setup();
    storage.setItem(syncQueueKey('alice'), raw);
    expect(await queue.overlay(payload)).toEqual(payload);
    const backup = [...data.entries()].find(([key]) => key.startsWith(`${syncQueueKey('alice')}:recovery:`));
    expect(backup?.[1]).toBe(raw);
    await queue.enqueue('alice', { preferences: { defaultZip: '80542' } });
    const send = vi.fn().mockResolvedValue(payload);
    await queue.flush('alice', send);
    expect(send).toHaveBeenCalledTimes(1);
    expect(storage.getItem(syncQueueKey('alice'))).toBeNull();
  });

  it('retains valid edits from a partially corrupted queue and rejects foreign entries during hydration', async () => {
    const { storage, queue } = setup();
    await queue.enqueue('alice', { preferences: { defaultZip: '80542' } });
    const raw = JSON.parse(storage.getItem(syncQueueKey('alice'))!);
    storage.setItem(syncQueueKey('alice'), JSON.stringify([...raw, null, { ...raw[0], userId: 'bob' }]));
    const send = vi.fn().mockResolvedValue(payload);
    await queue.flush('alice', send);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0].userId).toBe('alice');
  });

  it('keeps the original queue if recovery storage is unavailable', async () => {
    const { storage, queue } = setup();
    storage.setItem(syncQueueKey('alice'), '{invalid');
    vi.spyOn(storage, 'setItem').mockImplementation(() => { throw new Error('Storage full'); });
    await expect(queue.overlay(payload)).rejects.toThrow('Storage full');
    expect(storage.getItem(syncQueueKey('alice'))).toBe('{invalid');
  });

  it('serializes replay across tabs so a delayed old snapshot cannot overwrite a newer edit', async () => {
    const { storage, queue, lock } = setup();
    const otherTab = createSyncQueue(storage, lock);
    await queue.enqueue('alice', { preferences: { defaultZip: '11111' } });
    let release!: () => void;
    let started!: () => void;
    const sending = new Promise<void>((resolve) => { started = resolve; });
    const delay = new Promise<void>((resolve) => { release = resolve; });
    const applied: string[] = [];
    const first = queue.flush('alice', async (mutation) => {
      started();
      await delay;
      applied.push(mutation.preferences!.defaultZip!);
      return payload;
    });
    await sending;
    await otherTab.enqueue('alice', { preferences: { defaultZip: '22222' } });
    const otherSend = vi.fn(async () => {
      applied.push('incorrect concurrent replay');
      return payload;
    });
    const second = otherTab.flush('alice', otherSend);
    // A second tab can persist edits, but cannot send while the first owns replay.
    await Promise.resolve();
    expect(otherSend).not.toHaveBeenCalled();
    release();
    await Promise.all([first, second]);
    expect(applied).toEqual(['11111', '22222']);
    expect(storage.getItem(syncQueueKey('alice'))).toBeNull();
  });

  it('retains concurrent enqueues from two tabs and releases replay after a network failure', async () => {
    const { storage, queue, lock } = setup();
    const otherTab = createSyncQueue(storage, lock);
    await Promise.all([
      queue.enqueue('alice', { preferences: { defaultZip: '11111' } }),
      otherTab.enqueue('alice', { preferences: { targetServings: 8 } }),
    ]);
    await expect(queue.flush('alice', async () => { throw new Error('offline'); })).rejects.toThrow('offline');
    const send = vi.fn().mockResolvedValue(payload);
    await otherTab.flush('alice', send);
    expect(send.mock.calls.map(([mutation]) => mutation.preferences)).toEqual([
      { defaultZip: '11111' }, { targetServings: 8 },
    ]);
    expect(storage.getItem(syncQueueKey('alice'))).toBeNull();
  });

  it('validates archived guest cache values before recovery', () => {
    const item = { id: 'one', canonicalIngredientId: 'beef', ingredientName: 'Beef', category: 'PROTEIN' as const,
      quantityLbOrDoz: 2, unit: 'lb' as const, purchasePricePerUnit: 2, regularPricePerUnit: 4,
      totalCostBasis: 4, estimatedSavings: 4, store: 'KING_SOOPERS' as const, storeBanner: '', purchasedAtIso: '' };
    for (const raw of ['null', '{}', '{invalid', '[null, {}]']) expect(parseGuestFreezer(raw)).toEqual([]);
    expect(parseGuestFreezer(JSON.stringify([item, null]))).toEqual([item]);
  });

});
