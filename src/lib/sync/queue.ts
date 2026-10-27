import { FreezerItem, UserPreferences, UserSyncPayload } from '@/types/domain';

export interface SyncMutation {
  preferences?: Partial<UserPreferences>;
  freezerItems?: FreezerItem[];
  mergeMode?: boolean;
}

interface QueuedMutation extends SyncMutation {
  userId: string;
  mutationId: string;
}

export function syncQueueKey(userId: string): string {
  return `pantrybot_sync_queue_v14:${userId}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFreezerItem(value: unknown): value is FreezerItem {
  if (!isRecord(value)) return false;
  const textFields = ['id', 'canonicalIngredientId', 'ingredientName', 'category', 'store', 'storeBanner', 'purchasedAtIso'];
  const numberFields = ['quantityLbOrDoz', 'purchasePricePerUnit', 'regularPricePerUnit', 'totalCostBasis', 'estimatedSavings'];
  return textFields.every((key) => typeof value[key] === 'string') &&
    numberFields.every((key) => typeof value[key] === 'number' && Number.isFinite(value[key])) &&
    (value.unit === 'lb' || value.unit === 'doz') &&
    (value.notes === undefined || typeof value.notes === 'string');
}

export function parseGuestFreezer(raw: string | null): FreezerItem[] {
  try {
    const parsed: unknown = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed.filter(isFreezerItem) : [];
  } catch {
    return [];
  }
}

function isQueuedMutation(value: unknown, userId: string): value is QueuedMutation {
  return isRecord(value) && value.userId === userId &&
    typeof value.mutationId === 'string' && value.mutationId.length > 0 &&
    (value.preferences === undefined || isRecord(value.preferences)) &&
    (value.freezerItems === undefined || (Array.isArray(value.freezerItems) && value.freezerItems.every(isFreezerItem))) &&
    (value.mergeMode === undefined || typeof value.mergeMode === 'boolean');
}

export function mergeFreezerItems(current: FreezerItem[], incomingItems: FreezerItem[]): FreezerItem[] {
  const byIngredient = new Map(current.map((item) => [item.canonicalIngredientId, item]));
  for (const incoming of incomingItems) {
    const existing = byIngredient.get(incoming.canonicalIngredientId);
    if (!existing) {
      if (incoming.quantityLbOrDoz > 0) byIngredient.set(incoming.canonicalIngredientId, incoming);
      continue;
    }
    const quantity = existing.quantityLbOrDoz + incoming.quantityLbOrDoz;
    if (quantity <= 0) {
      byIngredient.delete(incoming.canonicalIngredientId);
      continue;
    }
    const purchase = (existing.quantityLbOrDoz * existing.purchasePricePerUnit + incoming.quantityLbOrDoz * incoming.purchasePricePerUnit) / quantity;
    const regular = (existing.quantityLbOrDoz * existing.regularPricePerUnit + incoming.quantityLbOrDoz * incoming.regularPricePerUnit) / quantity;
    byIngredient.set(incoming.canonicalIngredientId, {
      ...incoming, id: existing.id, quantityLbOrDoz: quantity,
      purchasePricePerUnit: purchase, regularPricePerUnit: regular,
      totalCostBasis: Number((quantity * purchase).toFixed(2)),
      estimatedSavings: Number(Math.max(0, quantity * (regular - purchase)).toFixed(2)),
    });
  }
  return [...byIngredient.values()];
}

/** Convert additive guest merges into an absolute snapshot, safe to retry. */
export function prepareSyncMutation(mutation: SyncMutation, current: UserSyncPayload): SyncMutation {
  if (!mutation.mergeMode) return mutation;

  return {
    ...mutation, mergeMode: false,
    freezerItems: mutation.freezerItems ? mergeFreezerItems(current.freezerItems, mutation.freezerItems) : undefined,
    preferences: {
      ...mutation.preferences,
      pinnedIngredientIds: [...new Set([...(current.preferences?.pinnedIngredientIds ?? []), ...(mutation.preferences?.pinnedIngredientIds ?? [])])],
      onHandIngredientIds: [...new Set([...(current.preferences?.onHandIngredientIds ?? []), ...(mutation.preferences?.onHandIngredientIds ?? [])])],
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
  function read(userId: string): QueuedMutation[] {
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
    if (!Array.isArray(parsed) || valid.length !== parsed.length) {
      // Preserve the original bytes for recovery before repairing the active queue.
      // Storage failures propagate: never clear the only copy if backup fails.
      storage.setItem(`${key}:recovery:${crypto.randomUUID()}`, raw);
      if (valid.length) storage.setItem(key, JSON.stringify(valid));
      else storage.removeItem(key);
    }
    return valid;
  }
  function enqueue(userId: string, mutation: SyncMutation) {
    return lock(`${syncQueueKey(userId)}:storage`, () => {
      const pending = read(userId);
      pending.push({ ...mutation, userId, mutationId: crypto.randomUUID() });
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
        const queued = await lock(`${key}:storage`, () => read(userId)[0]);
        if (!queued) return latest;
        if (queued.userId !== userId) throw new Error('Sync queue owner mismatch');
        const updated = await send(queued);
        if (!updated || updated.profile?.id !== userId) return null;
        latest = updated;
        await lock(`${key}:storage`, () => {
          const remaining = read(userId).filter((item) => item.mutationId !== queued.mutationId);
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
    return lock(`${syncQueueKey(userId)}:storage`, () => read(userId).reduce((state, mutation) => ({
      ...state,
      preferences: state.preferences ? { ...state.preferences, ...mutation.preferences } : null,
      freezerItems: mutation.freezerItems ?? state.freezerItems,
    }), payload));
  }
  return { enqueue, flush, overlay };
}
