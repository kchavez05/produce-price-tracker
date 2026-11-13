import { SyncedUserPreferences, UserSyncPayload } from '@/types/domain';
import { hasLegacyInventoryFields, validLegacyQueueFields, withoutLegacyOnHand } from '@/lib/pantry/legacy-sync';

function safeUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
export interface SyncMutation {
  preferences?: Partial<SyncedUserPreferences>;
  mergeMode?: boolean;
}

interface QueuedMutation extends SyncMutation {
  [key: string]: unknown;
  userId: string;
  mutationId: string;
}

export function syncQueueKey(userId: string): string {
  return `pantrybot_sync_queue_v14:${userId}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isQueuedMutation(value: unknown, userId: string): value is QueuedMutation {
  return isRecord(value) && value.userId === userId &&
    typeof value.mutationId === 'string' && value.mutationId.length > 0 &&
    (value.preferences === undefined || isRecord(value.preferences)) &&
    validLegacyQueueFields(value) &&
    (value.mergeMode === undefined || typeof value.mergeMode === 'boolean');
}

/** Convert additive guest merges into an absolute snapshot, safe to retry. */
export function prepareSyncMutation(mutation: SyncMutation, current: UserSyncPayload): SyncMutation {
  if (!mutation.mergeMode) return mutation;

  return {
    ...mutation, mergeMode: false,
    preferences: {
      ...mutation.preferences,
      pinnedIngredientIds: [...new Set([...(current.preferences?.pinnedIngredientIds ?? []), ...(mutation.preferences?.pinnedIngredientIds ?? [])])],
    },
  };
}

export type SyncLock = <T>(name: string, action: () => T | Promise<T>) => Promise<T>;

const browserLock: SyncLock = async (name, action) => {
  if (!navigator.locks) throw new Error('Account sync requires Web Locks in a secure browser context');
  return navigator.locks.request(name, action);
};

/** Durable write-before-send queue; each immutable update survives until acknowledged. */
export function createSyncQueue(
  storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>,
  lock: SyncLock = browserLock,
) {
  const inFlight = new Map<string, Promise<UserSyncPayload | null>>();
  function read(userId: string, repair = true): QueuedMutation[] {
    const key = syncQueueKey(userId);
    const raw = storage.getItem(key);
    if (!raw) return [];
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = null;
    }
    const valid = Array.isArray(parsed)
      ? parsed.filter((value): value is QueuedMutation => isQueuedMutation(value, userId))
      : [];
    if (repair && (!Array.isArray(parsed) || valid.length !== parsed.length)) {
      // Preserve the original bytes for recovery before repairing the active queue.
      // Storage failures propagate: never clear the only copy if backup fails.
      storage.setItem(`${key}:recovery:${safeUUID()}`, raw);
      if (valid.length) storage.setItem(key, JSON.stringify(valid));
      else storage.removeItem(key);
    }
    return valid;
  }
  function enqueue(userId: string, mutation: SyncMutation) {
    if (hasLegacyInventoryFields(mutation)) throw new Error('Reload to manage inventory in Virtual Pantry. Older edits remain available for recovery.');
    return lock(`${syncQueueKey(userId)}:storage`, () => {
      const pending = read(userId);
      pending.push({ ...mutation, userId, mutationId: safeUUID() });
      storage.setItem(syncQueueKey(userId), JSON.stringify(pending));
    });
  }
  function flush(userId: string, send: (mutation: QueuedMutation) => Promise<UserSyncPayload | null>) {
    const running = inFlight.get(userId);
    if (running) return running;
    // One replay owner across every tab. Storage operations use a separate,
    // short-lived lock so new edits can be persisted while a request is pending.
    const task = lock(`${syncQueueKey(userId)}:replay`, async () => {
      let latest: UserSyncPayload | null = null;
      const key = syncQueueKey(userId);
      while (true) {
        const queued = await lock(`${key}:storage`, () => read(userId).find((item) => !hasLegacyInventoryFields(item)));
        if (!queued) return latest;
        if (queued.userId !== userId) throw new Error('Sync queue owner mismatch');
        const updated = await send(queued);
        if (!updated || updated.profile?.id !== userId) return null;
        latest = updated;
        await lock(`${key}:storage`, () => {
          const original = read(userId);
          const acknowledgedIndex = original.findIndex((item) => item.mutationId === queued.mutationId);
          // A newer ordinary preference edit can sync while old inventory waits
          // for review. Do not replay its superseded preference values later.
          const remaining = original.flatMap((item, index) => {
            if (item.mutationId === queued.mutationId) return [];
            if (index >= acknowledgedIndex || !hasLegacyInventoryFields(item) || !item.preferences || !queued.preferences) return [item];
            const preferences = { ...item.preferences };
            for (const field of Object.keys(queued.preferences)) delete preferences[field as keyof SyncedUserPreferences];
            return [{ ...item, preferences }];
          });
          if (JSON.stringify(original.filter((item) => item.mutationId !== queued.mutationId)) !== JSON.stringify(remaining)) {
            storage.setItem(`${key}:recovery:${safeUUID()}`, storage.getItem(key)!);
          }
          if (remaining.length) storage.setItem(key, JSON.stringify(remaining));
          else storage.removeItem(key);
        });
      }
    }).finally(() => inFlight.delete(userId));
    inFlight.set(userId, task);
    return task;
  }
  async function overlay(payload: UserSyncPayload): Promise<UserSyncPayload> {
    if (!payload.profile) return payload;
    const userId = payload.profile.id;
    const snapshot = () => read(userId, false).reduce((state, mutation) => ({
      ...state,
      preferences: state.preferences ? { ...state.preferences, ...(mutation.preferences ? withoutLegacyOnHand(mutation.preferences) : {}) } : null,
    }), payload);
    // Reading a storage snapshot needs no replay lock. Never repair storage
    // without that lock, but do not prevent account hydration in HTTP contexts.
    if (lock === browserLock && !navigator.locks) return snapshot();
    return lock(`${syncQueueKey(userId)}:storage`, () => read(userId).reduce((state, mutation) => ({
      ...state,
      preferences: state.preferences ? { ...state.preferences, ...(mutation.preferences ? withoutLegacyOnHand(mutation.preferences) : {}) } : null,
    }), payload));
  }
  return { enqueue, flush, overlay };
}
