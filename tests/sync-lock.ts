import type { SyncLock } from '@/lib/sync/queue';

/** Shared FIFO lock manager, like Web Locks across tabs on one origin. */
export function createTestSyncLock(): SyncLock {
  const pending = new Map<string, Promise<unknown>>();
  return (name, action) => {
    const previous = pending.get(name) ?? Promise.resolve();
    const current = previous.then(action);
    pending.set(name, current.catch(() => undefined));
    return current;
  };
}
