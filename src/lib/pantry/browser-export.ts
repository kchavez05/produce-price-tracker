import { syncQueueKey } from '@/lib/sync/queue';
import { PantryOwner } from '@/types/pantry';
import { pantryQueueKey } from './queue';
import { pantryCacheKey } from './client-cache';

/** Recovery copies may include corrupted/foreign records. Export only values
 * with an explicit matching owner, and leave every original byte on disk. */
export function pantryBrowserExport(storage: Storage, owner: PantryOwner): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const queue = pantryQueueKey(owner);
  const cache = pantryCacheKey(owner);
  const userId = owner.startsWith('account:') ? owner.slice('account:'.length) : null;
  const sync = userId ? syncQueueKey(userId) : null;
  for (let index = 0; index < storage.length; index++) {
    const key = storage.key(index);
    if (!key || !(key === queue || key.startsWith(`${queue}:recovery:`) || key.startsWith(`${cache}:recovery:`) || (sync && (key === sync || key.startsWith(`${sync}:recovery:`))))) continue;
    try {
      const value: unknown = JSON.parse(storage.getItem(key) ?? 'null');
      if (Array.isArray(value)) {
        const owned = value.filter((item) => item && typeof item === 'object' &&
          (item.owner === owner || (item.owner === undefined && userId && item.userId === userId)) &&
          (item.userId === undefined || Boolean(userId && item.userId === userId)));
        if (owned.length) result[key] = owned;
      } else if (value && typeof value === 'object' && 'owner' in value && value.owner === owner) result[key] = value;
    } catch { /* Unattributed recovery bytes stay private on the device. */ }
  }
  return result;
}
