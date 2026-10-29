import { describe, expect, it, vi } from 'vitest';
import { clearPantryQueue, createPantryQueue, pantryQueueKey, PantryAcknowledgment } from '@/lib/pantry/queue';
import { PantryMutation, PantryOwner } from '@/types/pantry';
import { createTestSyncLock } from 'tests/sync-lock';

const mutation = (patch: Partial<PantryMutation> = {}): PantryMutation => ({
  mutationId: 'edit-1', entryId: 'rice', expectedRevision: 0, operation: 'put', entry: { displayName: 'Rice', available: true }, ...patch,
} as PantryMutation);
const applied = (owner: PantryOwner, m: PantryMutation): Extract<PantryAcknowledgment, { status: 'applied' }> => ({
  owner, status: 'applied', mutationId: m.mutationId,
  entry: { displayName: 'Rice', available: true, id: m.entryId, revision: m.expectedRevision + 1, updatedAtIso: '' },
});
function setup() {
  const data = new Map<string, string>();
  const storage = { getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value); }, removeItem: (key: string) => { data.delete(key); } };
  let owner: PantryOwner | null = 'account:alice';
  const lock = createTestSyncLock();
  const active = () => owner;
  return { storage, data, lock, active, switchTo: (next: PantryOwner | null) => { owner = next; }, queue: createPantryQueue(storage, active, lock) };
}
const alice = 'account:alice';
describe('durable pantry mutation queue', () => {
  it('removes only the deleted account’s pending and recovery data', () => {
    const { storage, data } = setup();
    storage.setItem(pantryQueueKey(alice), 'pending');
    storage.setItem(`${pantryQueueKey(alice)}:recovery:backup`, 'private backup');
    storage.setItem(pantryQueueKey('account:bob'), 'other account');
    clearPantryQueue({ get length() { return data.size; }, key: (index) => [...data.keys()][index], removeItem: storage.removeItem }, alice);
    expect([...data.values()]).toEqual(['other account']);
  });
  it('persists before send, survives network/HTTP failure and reload, and removes only acknowledged edits', async () => {
    const { queue, storage, active, lock } = setup();
    await queue.enqueue(alice, mutation());
    await expect(queue.flush(alice, async () => { throw new Error('offline'); })).rejects.toThrow('offline');
    await queue.flush(alice, async () => null);
    const reloaded = createPantryQueue(storage, active, lock);
    expect(await reloaded.pending(alice)).toHaveLength(1);
    await reloaded.flush(alice, async (owner, m) => applied(owner, m));
    expect(storage.getItem(pantryQueueKey(alice))).toBeNull();
  });
  it('never replays a previous account and retains an in-flight acknowledgment across account switching', async () => {
    const { queue, switchTo, storage } = setup();
    await queue.enqueue(alice, mutation());
    switchTo('account:bob');
    const send = vi.fn();
    await queue.flush(alice, send);
    expect(send).not.toHaveBeenCalled();
    await expect(queue.enqueue(alice, mutation())).rejects.toThrow('account changed');
    switchTo(alice);
    await queue.flush(alice, async (owner, m) => { switchTo('account:bob'); return applied(owner, m); });
    expect(storage.getItem(pantryQueueKey(alice))).not.toBeNull();
    switchTo(alice);
    await queue.flush(alice, async (owner, m) => applied(owner, m));
    expect(storage.getItem(pantryQueueKey(alice))).toBeNull();
  });
  it('rejects mismatched acknowledgment owners, mutation IDs, entry IDs, and revisions', async () => {
    const { queue } = setup();
    await queue.enqueue(alice, mutation());
    for (const patch of [{ owner: 'account:bob' }, { mutationId: 'wrong' }, { entry: { ...applied(alice, mutation()).entry, id: 'wrong' } }, { entry: { ...applied(alice, mutation()).entry, revision: 99 } }]) {
      await queue.flush(alice, async () => ({ ...applied(alice, mutation()), ...patch } as PantryAcknowledgment));
      expect(await queue.pending(alice)).toHaveLength(1);
    }
  });
  it('retains conflicts across reload and requires explicit resolution with a new mutation ID', async () => {
    const { queue, storage, lock, active } = setup();
    await queue.enqueue(alice, mutation());
    await queue.flush(alice, async () => ({ owner: alice, status: 'conflict', mutationId: 'edit-1', reason: 'revision', current: { ...applied(alice, mutation()).entry, revision: 7, deletedAtIso: '2026-10-29T00:00:00Z' } }));
    const reloaded = createPantryQueue(storage, active, lock);
    const send = vi.fn();
    await reloaded.flush(alice, send);
    expect(send).not.toHaveBeenCalled();
    await reloaded.resolve(alice, 'edit-1', 'mine');
    const pending = await reloaded.pending(alice);
    expect(pending[0].mutation.expectedRevision).toBe(7);
    expect(pending[0].mutation.mutationId).not.toBe('edit-1');
    await reloaded.flush(alice, async (owner, m) => applied(owner, m));
    expect(await reloaded.pending(alice)).toEqual([]);
  });
  it('never overwrites another ingredient to resolve an identity collision', async () => {
    const { queue } = setup();
    await queue.enqueue(alice, mutation());
    await queue.flush(alice, async () => ({ owner: alice, status: 'conflict', mutationId: 'edit-1', reason: 'identity', current: { ...applied(alice, mutation()).entry, id: 'other' } }));
    await expect(queue.resolve(alice, 'edit-1', 'mine')).rejects.toThrow('existing ingredient');
    await queue.resolve(alice, 'edit-1', 'remote');
    expect(await queue.pending(alice)).toEqual([]);
  });
  it('serializes replay across tabs while retaining edits enqueued during a request', async () => {
    const { queue, storage, active, lock } = setup();
    const otherTab = createPantryQueue(storage, active, lock);
    await queue.enqueue(alice, mutation());
    let release!: () => void;
    let started!: () => void;
    const inFlight = new Promise<void>((resolve) => { started = resolve; });
    const delay = new Promise<void>((resolve) => { release = resolve; });
    const sent: string[] = [];
    const first = queue.flush(alice, async (owner, m) => {
      sent.push(m.mutationId); started(); await delay; return applied(owner, m);
    });
    await inFlight;
    await otherTab.enqueue(alice, mutation({ mutationId: 'edit-2', expectedRevision: 1 }));
    const otherSend = vi.fn();
    const second = otherTab.flush(alice, otherSend);
    release(); await Promise.all([first, second]);
    expect(sent).toEqual(['edit-1', 'edit-2']);
    expect(otherSend).not.toHaveBeenCalled();
    expect(await queue.pending(alice)).toEqual([]);
  });
  it.each(['null', '{invalid', '[null]'])('backs up malformed storage %s before repairing', async (raw) => {
    const { queue, storage, data } = setup();
    storage.setItem(pantryQueueKey(alice), raw);
    expect(await queue.pending(alice)).toEqual([]);
    expect([...data.values()]).toContain(raw);
    storage.setItem(pantryQueueKey(alice), raw);
    vi.spyOn(storage, 'setItem').mockImplementation(() => { throw new Error('full'); });
    await expect(queue.pending(alice)).rejects.toThrow('full');
    expect(storage.getItem(pantryQueueKey(alice))).toBe(raw);
  });
});
