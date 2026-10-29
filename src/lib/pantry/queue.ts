import { PantryMutation, PantryMutationResult, PantryOwner } from '@/types/pantry';
import { SyncLock } from '@/lib/sync/queue';
import { validatePantryMutation } from './mutations';
import { pantryCacheKey } from './client-cache';

type Conflict = Extract<PantryMutationResult, { status: 'conflict' }>;
interface Pending { owner: PantryOwner; mutation: PantryMutation; conflict?: Conflict }
export type PantryAcknowledgment = PantryMutationResult & { owner: PantryOwner };
export const pantryQueueKey = (owner: PantryOwner) => `pantrybot_pantry_queue_v16:${owner}`;

export function clearPantryQueue(storage: Pick<Storage, 'key' | 'length' | 'removeItem'>, owner: PantryOwner): void {
  const prefix = pantryQueueKey(owner);
  const cache = pantryCacheKey(owner);
  for (let index = storage.length - 1; index >= 0; index--) {
    const key = storage.key(index);
    if (key === prefix || key?.startsWith(`${prefix}:recovery:`) || key === cache || key?.startsWith(`${cache}:recovery:`)) storage.removeItem(key);
  }
}

const webLock: SyncLock = async (name, action) => {
  if (typeof navigator === 'undefined' || !navigator.locks) throw new Error('Pantry sync requires Web Locks in a secure browser context');
  return navigator.locks.request(name, action);
};

/** Persist before sending. Account changes never transfer or acknowledge a queue. */
export function createPantryQueue(
  storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>,
  activeOwner: () => PantryOwner | null,
  lock: SyncLock = webLock,
) {
  function read(owner: PantryOwner): Pending[] {
    const key = pantryQueueKey(owner);
    const raw = storage.getItem(key);
    if (!raw) return [];
    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch { parsed = null; }
    const valid: Pending[] = [];
    if (Array.isArray(parsed)) for (const value of parsed) {
      try {
        if (!value || value.owner !== owner) continue;
        const mutation = validatePantryMutation(value.mutation);
        // An invalid conflict must never be repaired into an automatic retry.
        if (value.conflict && (value.conflict.status !== 'conflict' || value.conflict.mutationId !== mutation.mutationId || !['revision', 'identity'].includes(value.conflict.reason))) continue;
        valid.push({ owner, mutation, ...(value.conflict ? { conflict: value.conflict as Conflict } : {}) });
      } catch { /* Preserve rejected bytes below before repairing. */ }
    }
    if (!Array.isArray(parsed) || valid.length !== parsed.length) {
      storage.setItem(`${key}:recovery:${crypto.randomUUID()}`, raw);
      save(owner, valid);
    }
    return valid;
  }
  function save(owner: PantryOwner, pending: Pending[]) {
    if (pending.length) storage.setItem(pantryQueueKey(owner), JSON.stringify(pending));
    else storage.removeItem(pantryQueueKey(owner));
  }
  const storageLock = <T>(owner: PantryOwner, action: () => T | Promise<T>) => lock(`${pantryQueueKey(owner)}:storage`, action);

  return {
    pending: (owner: PantryOwner) => storageLock(owner, () => read(owner)),
    enqueue: (owner: PantryOwner, input: PantryMutation) => storageLock(owner, () => {
      if (activeOwner() !== owner) throw new Error('Pantry account changed');
      const mutation = validatePantryMutation(input);
      const pending = read(owner);
      if (pending.some((item) => item.mutation.mutationId === mutation.mutationId)) throw new Error('Mutation ID is already queued');
      pending.push({ owner, mutation });
      save(owner, pending);
    }),
    flush: (owner: PantryOwner, send: (owner: PantryOwner, mutation: PantryMutation) => Promise<PantryAcknowledgment | null>) =>
      lock(`${pantryQueueKey(owner)}:replay`, async () => {
        while (activeOwner() === owner) {
          const next = await storageLock(owner, () => read(owner)[0]);
          if (!next || next.conflict) return;
          // Recheck after acquiring the storage lock and immediately before send.
          if (activeOwner() !== owner) return;
          const acknowledged = await send(owner, next.mutation);
          if (!acknowledged || activeOwner() !== owner || acknowledged.owner !== owner || acknowledged.mutationId !== next.mutation.mutationId) return;
          if (acknowledged.status !== 'applied' && acknowledged.status !== 'conflict') return;
          if (acknowledged.status === 'applied' && (acknowledged.entry.id !== next.mutation.entryId || acknowledged.entry.revision !== next.mutation.expectedRevision + 1)) return;
          await storageLock(owner, () => {
            const pending = read(owner);
            const index = pending.findIndex((item) => item.mutation.mutationId === next.mutation.mutationId);
            if (index < 0) return;
            if (acknowledged.status === 'conflict') pending[index].conflict = acknowledged;
            else pending.splice(index, 1);
            save(owner, pending);
          });
          if (acknowledged.status === 'conflict') return;
        }
      }),
    resolve: (owner: PantryOwner, mutationId: string, choice: 'remote' | 'mine') => storageLock(owner, () => {
      if (activeOwner() !== owner) throw new Error('Pantry account changed');
      const pending = read(owner);
      const index = pending.findIndex((item) => item.mutation.mutationId === mutationId);
      const item = pending[index];
      if (!item?.conflict) throw new Error('No pending conflict to resolve');
      if (choice === 'remote') pending.splice(index, 1);
      else {
        if (item.conflict.reason === 'identity') throw new Error('Edit or re-add the existing ingredient to resolve this duplicate.');
        const current = item.conflict.current;
        if (!current && item.mutation.operation === 'delete') throw new Error('The entry no longer exists. Choose the remote value.');
        pending[index] = { owner, mutation: { ...item.mutation, expectedRevision: current?.revision ?? 0, mutationId: crypto.randomUUID() } };
      }
      // Later queued edits remain intact; if their base is now stale they require
      // their own explicit resolution rather than silently rebasing user intent.
      save(owner, pending);
    }),
  };
}
