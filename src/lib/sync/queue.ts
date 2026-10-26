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

export function mergeFreezerItems(current: FreezerItem[], incomingItems: FreezerItem[]): FreezerItem[] {
  const byIngredient = new Map(current.map((item) => [item.canonicalIngredientId, item]));
  for (const incoming of incomingItems) {
    const existing = byIngredient.get(incoming.canonicalIngredientId);
    if (!existing) {
      byIngredient.set(incoming.canonicalIngredientId, incoming);
      continue;
    }
    const quantity = existing.quantityLbOrDoz + incoming.quantityLbOrDoz;
    if (quantity <= 0) continue;
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

/** Durable write-before-send queue; each immutable update survives until acknowledged. */
export function createSyncQueue(storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>) {
  const inFlight = new Map<string, Promise<UserSyncPayload | null>>();
  function read(userId: string): QueuedMutation[] {
    return JSON.parse(storage.getItem(syncQueueKey(userId)) || '[]') as QueuedMutation[];
  }
  function enqueue(userId: string, mutation: SyncMutation) {
    const pending = read(userId);
    pending.push({ ...mutation, userId, mutationId: crypto.randomUUID() });
    storage.setItem(syncQueueKey(userId), JSON.stringify(pending));
  }
  function flush(userId: string, send: (mutation: QueuedMutation) => Promise<UserSyncPayload | null>) {
    const running = inFlight.get(userId);
    if (running) return running;
    const task = (async () => {
      let latest: UserSyncPayload | null = null;
      const key = syncQueueKey(userId);
      while (true) {
        const queued = read(userId)[0];
        if (!queued) return latest;
        if (queued.userId !== userId) throw new Error('Sync queue owner mismatch');
        const updated = await send(queued);
        if (!updated || updated.profile?.id !== userId) return null;
        latest = updated;
        const remaining = read(userId).filter((item) => item.mutationId !== queued.mutationId);
        if (remaining.length) storage.setItem(key, JSON.stringify(remaining));
        else storage.removeItem(key);
      }
    })().finally(() => inFlight.delete(userId));
    inFlight.set(userId, task);
    return task;
  }
  function overlay(payload: UserSyncPayload): UserSyncPayload {
    if (!payload.profile) return payload;
    return read(payload.profile.id).reduce((state, mutation) => ({
      ...state,
      preferences: state.preferences ? { ...state.preferences, ...mutation.preferences } : null,
      freezerItems: mutation.freezerItems ?? state.freezerItems,
    }), payload);
  }
  return { enqueue, flush, overlay };
}
