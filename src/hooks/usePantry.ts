'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { PantryEntry, PantryEntryInput, PantryMutation, PantryOwner, PantrySaveIntent } from '@/types/pantry';
import { LegacyPantrySource, migrateLegacyPantry, PantryMigrationSnapshot } from '@/lib/pantry/migration';
import { evaluatePantryMutation, validatePantryMutation, mutationFingerprint } from '@/lib/pantry/mutations';
import { pantryIdentity, pantryCatalog, canSavePantryIngredient } from '@/lib/pantry/model';
import { createPantryQueue, PantryAcknowledgment } from '@/lib/pantry/queue';
import { cachePantrySnapshot, guestPantryKey, mergeAcknowledgedEntry, pantryCacheKey, parsePantrySnapshot, readGuestPantry } from '@/lib/pantry/client-cache';
import { createSyncQueue, syncQueueKey } from '@/lib/sync/queue';
import { parseGuestFreezer } from '@/lib/pantry/legacy-sync';
import { legacyQueueNeedsUpgrade, prepareLegacyQueueUpgrade } from '@/lib/pantry/legacy-queue';
import { pantryQueueKey } from '@/lib/pantry/queue';

type Queue = ReturnType<typeof createPantryQueue>;
type Pending = Awaited<ReturnType<Queue['pending']>>;
type Status = 'Loading' | 'Saved' | 'Pending sync' | 'Couldn’t sync — Retry';
const noEntries: readonly PantryEntry[] = [];
const noPending: Pending = [];
const guestLock = async <T,>(action: () => T | Promise<T>): Promise<T> => {
  if (!navigator.locks) return Promise.reject(new Error('Pantry storage needs a secure browser context.'));
  return await navigator.locks.request(guestPantryKey, action);
};

export function usePantry(enabled: boolean, accountId: string | null) {
  const [snapshot, setSnapshot] = useState<PantryMigrationSnapshot | null>(null);
  const [guestEntries, setGuestEntries] = useState<readonly PantryEntry[]>([]);
  const [status, setStatus] = useState<Status>('Loading');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending>([]);
  const [hasLegacyEdits, setHasLegacyEdits] = useState(false);
  const [importReport, setImportReport] = useState<{ owner: PantryOwner; duplicates: string[] } | null>(null);
  const activeOwner = useRef<PantryOwner | null>(null);
  const guestOwner = useRef<PantryOwner | null>(null);
  const queue = useRef<Queue | null>(null);
  const syncing = useRef(new Map<PantryOwner, Promise<void>>());
  const resync = useRef(new Set<PantryOwner>());
  const runSync = useRef<(owner: PantryOwner) => Promise<void>>(async () => {});
  const base = useRef<PantryMigrationSnapshot | null>(null);
  const expectedAccount: PantryOwner | null = accountId ? `account:${accountId}` : null;
  // Render-time fencing hides the old account before effects or in-flight results.
  activeOwner.current = enabled ? expectedAccount ?? guestOwner.current : null;
  const getQueue = useCallback(() => {
    if (!queue.current) queue.current = createPantryQueue(localStorage, () => activeOwner.current);
    return queue.current;
  }, []);

  const publish = useCallback(async (owner: PantryOwner, acknowledged: PantryMigrationSnapshot) => {
    if (activeOwner.current !== owner) return;
    const edits = owner.startsWith('account:') ? await getQueue().pending(owner) : [];
    if (activeOwner.current !== owner) return;
    let view = acknowledged;
    for (const { mutation } of edits) {
      const current = view.entries.find((entry) => entry.id === mutation.entryId);
      const entry: PantryEntry | undefined = mutation.operation === 'put'
        ? { ...mutation.entry, id: mutation.entryId, revision: mutation.expectedRevision + 1, updatedAtIso: current?.updatedAtIso ?? new Date().toISOString() }
        : current ? { ...current, deletedAtIso: current.deletedAtIso ?? new Date().toISOString(), revision: mutation.expectedRevision + 1 } : undefined;
      if (entry) view = { ...view, entries: [...view.entries.filter((item) => item.id !== entry.id), entry] };
    }
    base.current = acknowledged;
    setSnapshot(view); setPending(edits);
    setStatus(edits.length ? 'Pending sync' : 'Saved');
  }, [getQueue]);

  const performSync = useCallback(async (owner: PantryOwner) => {
    if (activeOwner.current !== owner || owner.startsWith('guest:')) return;
    setError(null);
    const readRemote = async () => {
      const response = await fetch('/api/pantry', { cache: 'no-store' });
      if (!response.ok) throw new Error('Couldn’t load this account’s pantry. Retry when connected.');
      const received: unknown = await response.json();
      if (received && typeof received === 'object' && 'owner' in received && received.owner !== owner) {
        if (activeOwner.current === owner) {
          base.current = null; setSnapshot(null); setPending([]);
        }
        throw new Error('The signed-in session changed. Reload to open its private pantry; the previous account’s pending edits are preserved.');
      }
      let remote = parsePantrySnapshot(received, owner);
      if (!remote.legacyMigrationVersion) {
        // Ordinary preferences may finish syncing before migration. Retired
        // inventory stays queued for explicit recovery below.
        const olderQueue = localStorage.getItem(syncQueueKey(owner.slice('account:'.length)));
        // Retired inventory writes cannot be sent to /api/sync. Archive the
        // server baseline unchanged, retain the original queue, and require
        // explicit review through the existing revision-aware recovery bridge.
        if (olderQueue && !legacyQueueNeedsUpgrade(olderQueue)) {
          await createSyncQueue(localStorage).flush(owner.slice('account:'.length), async (mutation) => {
            if (activeOwner.current !== owner) return null;
            const acknowledged = await fetch('/api/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(mutation) });
            return acknowledged.ok ? await acknowledged.json() : null;
          });
          if (localStorage.getItem(syncQueueKey(owner.slice('account:'.length)))) throw new Error('Older edits are still pending. Retry their sync before migrating; the original queue is preserved.');
          const refreshed = await fetch('/api/pantry', { cache: 'no-store' });
          if (!refreshed.ok) throw new Error('Could not reload legacy inventory after sync.');
          remote = parsePantrySnapshot(await refreshed.json(), owner);
        }
        const migration = await fetch('/api/pantry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ owner, action: 'migrate' }) });
        if (!migration.ok) throw new Error('Couldn’t migrate the existing inventory. Original records are preserved; retry.');
        remote = parsePantrySnapshot(await migration.json(), owner);
      }
      if (activeOwner.current !== owner) return null;
      cachePantrySnapshot(localStorage, remote);
      setHasLegacyEdits(legacyQueueNeedsUpgrade(localStorage.getItem(syncQueueKey(owner.slice('account:'.length)))));
      await publish(owner, remote);
      return remote;
    };
    try {
      if (!await readRemote()) return;
      while (activeOwner.current === owner) {
        await getQueue().flush(owner, async (origin, mutation) => {
          const response = await fetch('/api/pantry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ owner: origin, action: 'mutate', mutation }) });
          const result = await response.json();
          if (!response.ok && result.status !== 'conflict') throw new Error(result.error ?? 'Couldn’t save. Retry when connected.');
          const acknowledgment = result as PantryAcknowledgment;
          if (acknowledgment.status === 'applied' && acknowledgment.owner === origin && activeOwner.current === owner && base.current?.owner === owner) {
            const updated = mergeAcknowledgedEntry(base.current, acknowledgment.entry);
            cachePantrySnapshot(localStorage, updated);
            base.current = updated;
          }
          return acknowledgment;
        });
        const remaining = await getQueue().pending(owner);
        const next = remaining[0];
        // Confirmed imports always preserve an existing account entry, even if a
        // second device created it after the import preview was displayed.
        if (next?.conflict && next.mutation.mutationId.startsWith('import:') && next.conflict.current) {
          if (activeOwner.current !== owner) return;
          const name = next.conflict.current.displayName;
          setImportReport((previous) => ({ owner, duplicates: [...new Set([...(previous?.owner === owner ? previous.duplicates : []), name])] }));
          await getQueue().resolve(owner, next.mutation.mutationId, 'remote');
          continue;
        }
        break;
      }
      await readRemote();
    } catch (cause) {
      if (activeOwner.current !== owner) return;
      if (base.current?.owner === owner) await publish(owner, base.current);
      setError(cause instanceof Error ? cause.message : 'Couldn’t sync — Retry');
      setStatus('Couldn’t sync — Retry');
    }
  }, [getQueue, publish]);

  const synchronize = useCallback((owner: PantryOwner): Promise<void> => {
    const running = syncing.current.get(owner);
    if (running) { resync.current.add(owner); return running; }
    const task = (async () => { await navigator.locks.request(`${pantryCacheKey(owner)}:hydrate`, () => performSync(owner)); })()
      .finally(() => {
        syncing.current.delete(owner);
        if (resync.current.delete(owner) && activeOwner.current === owner) void runSync.current(owner);
      });
    syncing.current.set(owner, task);
    return task;
  }, [performSync]);
  runSync.current = synchronize;

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const initialize = async () => {
      setError(null); setPending([]); setStatus('Loading');
      try {
        let guest: PantryMigrationSnapshot | null = null;
        try { guest = await guestLock(() => readGuestPantry(localStorage)); }
        catch (cause) { if (!accountId) throw cause; }
        if (cancelled) return;
        guestOwner.current = guest?.owner ?? null;
        setGuestEntries(guest?.entries ?? noEntries);
        if (!accountId && guest) {
          activeOwner.current = guest.owner;
          await publish(guest.owner, guest);
        } else if (accountId) {
          const owner: PantryOwner = `account:${accountId}`;
          const cached = localStorage.getItem(pantryCacheKey(owner));
          if (cached) await publish(owner, parsePantrySnapshot(JSON.parse(cached), owner));
          await synchronize(owner);
        }
      } catch (cause) { if (!cancelled) { setError(cause instanceof Error ? cause.message : 'Could not read pantry storage.'); setStatus('Couldn’t sync — Retry'); } }
    };
    void initialize();
    const reconnect = () => { if (activeOwner.current?.startsWith('account:')) void synchronize(activeOwner.current); };
    const storageChanged = (event: StorageEvent) => {
      if (!accountId && event.key === guestPantryKey) void guestLock(async () => {
        const guest = readGuestPantry(localStorage);
        setGuestEntries(guest.entries);
        await publish(guest.owner, guest);
      });
      else if (accountId && event.key === pantryCacheKey(`account:${accountId}`)) reconnect();
    };
    window.addEventListener('online', reconnect);
    window.addEventListener('focus', reconnect);
    window.addEventListener('storage', storageChanged);
    return () => { cancelled = true; window.removeEventListener('online', reconnect); window.removeEventListener('focus', reconnect); window.removeEventListener('storage', storageChanged); };
  }, [enabled, accountId, publish, synchronize]);

  const visibleOwner = snapshot?.owner === activeOwner.current ? snapshot.owner : null;
  const write = useCallback(async (input: PantryEntryInput | null, id?: string, intent?: PantrySaveIntent) => {
    const owner = visibleOwner;
    if (!owner || activeOwner.current !== owner || snapshot?.owner !== owner) throw new Error('Wait for the current pantry to load.');
    const existing = id ? snapshot.entries.find((entry) => entry.id === id) : undefined;
    const accepted = owner.startsWith('guest:') ? [...pantryCatalog.keys()] : snapshot.acceptedCatalogIds ?? [];
    if (input && !canSavePantryIngredient(input, existing, accepted)) throw new Error('This ingredient is not ready for this account yet. Reconnect and retry after the catalog update.');
    if (intent && !id) throw new Error('A reviewed entry ID is required.');
    const mutation = validatePantryMutation({ mutationId: intent?.mutationId ?? crypto.randomUUID(), entryId: id ?? crypto.randomUUID(), expectedRevision: intent?.expectedRevision ?? existing?.revision ?? 0,
      ...(input ? { operation: 'put', entry: input } : { operation: 'delete' }) }, Boolean(existing && input?.ingredientId === existing.ingredientId));
    if (owner.startsWith('guest:')) {
      await guestLock(async () => {
        if (activeOwner.current !== owner) throw new Error('Pantry account changed.');
        const current = readGuestPantry(localStorage);
        const result = evaluatePantryMutation(current.entries, mutation, new Date().toISOString());
        if (result.status === 'conflict') throw new Error(result.reason === 'identity' ? 'That ingredient already has an entry. Edit or re-add it from search.' : 'This ingredient changed in another tab. Reopen it before editing.');
        const updated = mergeAcknowledgedEntry(current, result.entry);
        localStorage.setItem(guestPantryKey, JSON.stringify(updated));
        setGuestEntries(updated.entries); await publish(owner, updated);
      });
    } else {
      const prior = intent ? (await getQueue().pending(owner)).find((item) => item.mutation.mutationId === intent.mutationId) : undefined;
      if (prior && mutationFingerprint(prior.mutation) !== mutationFingerprint(mutation)) throw new Error('The confirmed operation changed. Reopen the review.');
      if (!prior) await getQueue().enqueue(owner, mutation);
      await publish(owner, base.current ?? snapshot);
      void synchronize(owner);
    }
  }, [visibleOwner, snapshot, getQueue, publish, synchronize]);

  const importGuest = useCallback(async () => {
    const owner = visibleOwner;
    if (!owner?.startsWith('account:') || activeOwner.current !== owner || snapshot?.owner !== owner) throw new Error('Sign in before importing.');
    const guest = await guestLock(() => readGuestPantry(localStorage));
    const duplicates = guest.entries.filter((entry) => !entry.deletedAtIso && snapshot.entries.some((current) => pantryIdentity(current) === pantryIdentity(entry))).map((entry) => entry.displayName);
    if (guest.entries.some((entry) => !entry.deletedAtIso && !snapshot.entries.some((current) => pantryIdentity(current) === pantryIdentity(entry)) && !canSavePantryIngredient(entry, undefined, snapshot.acceptedCatalogIds ?? []))) throw new Error('Some guest ingredients need an account catalog update before import. Your guest pantry is preserved.');
    setImportReport({ owner, duplicates });
    const digest = async (value: string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))).map((byte) => byte.toString(16).padStart(2, '0')).join('');
    for (const entry of guest.entries) {
      if (entry.deletedAtIso || snapshot.entries.some((current) => pantryIdentity(current) === pantryIdentity(entry))) continue;
      const mutationId = `import:${await digest(`${guest.owner}:${entry.id}:${entry.revision}`)}`;
      if ((await getQueue().pending(owner)).some((item) => item.mutation.mutationId === mutationId)) continue;
      const mutation: PantryMutation = { mutationId, entryId: `import:${await digest(`${guest.owner}:${entry.id}`)}`, expectedRevision: 0, operation: 'put', entry };
      await getQueue().enqueue(owner, mutation);
    }
    await publish(owner, base.current ?? snapshot);
    void synchronize(owner);
  }, [visibleOwner, snapshot, getQueue, publish, synchronize]);

  const resolve = useCallback(async (mutationId: string, choice: 'mine' | 'remote') => {
    if (!visibleOwner || activeOwner.current !== visibleOwner) throw new Error('Pantry account changed.');
    await getQueue().resolve(visibleOwner, mutationId, choice);
    await synchronize(visibleOwner);
  }, [visibleOwner, getQueue, synchronize]);

  const legacyGuest = useCallback(async (commit: boolean) => {
    const owner = visibleOwner;
    if (!owner || activeOwner.current !== owner) throw new Error('Wait for the current pantry to load.');
    if (owner.startsWith('account:')) {
      return navigator.locks.request(`${syncQueueKey(owner.slice('account:'.length))}:storage`, async () => {
        if (activeOwner.current !== owner || base.current?.owner !== owner || !base.current.legacySource) throw new Error('Pantry account changed.');
        const key = syncQueueKey(owner.slice('account:'.length));
        const raw = localStorage.getItem(key);
        if (!raw) return [];
        const prepared = await prepareLegacyQueueUpgrade(owner, base.current.legacySource, raw);
        if (commit) {
          // Backup first, persist all converted edits second, then strip only the
          // legacy inventory fields. Interrupted retries use stable mutation IDs.
          localStorage.setItem(`${pantryQueueKey(owner)}:recovery:legacy-${crypto.randomUUID()}`, raw);
          for (const mutation of prepared.mutations) {
            if (!(await getQueue().pending(owner)).some((item) => item.mutation.mutationId === mutation.mutationId)) await getQueue().enqueue(owner, mutation);
          }
          if (prepared.remaining.length) localStorage.setItem(key, JSON.stringify(prepared.remaining));
          else localStorage.removeItem(key);
          setHasLegacyEdits(false);
          await publish(owner, base.current);
          void synchronize(owner);
        }
        return prepared.preview;
      });
    }
    return guestLock(async () => {
      if (activeOwner.current !== owner) throw new Error('Pantry account changed.');
      const current = readGuestPantry(localStorage);
      const rawIds: unknown = JSON.parse(localStorage.getItem('mead_on_hand_ids_v04') ?? '[]');
      if (!Array.isArray(rawIds) || !rawIds.every((id) => typeof id === 'string')) throw new Error('Older local selections need recovery. Their original bytes are preserved.');
      let serverSource: LegacyPantrySource | undefined;
      try {
        const response = await fetch('/api/pantry', { cache: 'no-store' });
        if (response.ok) {
          const stored = parsePantrySnapshot(await response.json());
          if (!stored.owner.startsWith('guest:')) throw new Error('The session changed. Open the signed-in pantry before reviewing inventory.');
          serverSource = stored.legacySource;
        }
      } catch (cause) {
        if (cause instanceof Error && cause.message.startsWith('The session changed')) throw cause;
        // Offline review still covers the private browser's preserved caches.
      }
      const source: LegacyPantrySource = { owner,
        freezerItems: [...new Map([...(current.legacySource?.freezerItems ?? []), ...(serverSource?.freezerItems ?? []),
          ...parseGuestFreezer(localStorage.getItem('pantrybot_virtual_freezer_v12'))].map((record) => [JSON.stringify(record), record])).values()],
        onHandIngredientIds: [...new Set([...(current.legacySource?.onHandIngredientIds ?? []), ...(serverSource?.onHandIngredientIds ?? []), ...rawIds])],
      };
      const prepared = migrateLegacyPantry({ ...current, legacyMigrationVersion: undefined }, source, new Date().toISOString());
      const migrated = { ...prepared, entries: prepared.entries.map((entry) => ({ ...entry, revision: Math.max(1, entry.revision) })) };
      const checked = parsePantrySnapshot(migrated, owner);
      if (commit) {
        localStorage.setItem(guestPantryKey, JSON.stringify(checked));
        setGuestEntries(checked.entries); await publish(owner, checked);
      }
      return checked.entries;
    });
  }, [visibleOwner, publish, getQueue, synchronize]);

  return { acceptedCatalogIds: visibleOwner ? accountId ? snapshot?.acceptedCatalogIds ?? [] : [...pantryCatalog.keys()] : [], owner: visibleOwner, entries: visibleOwner ? snapshot!.entries : noEntries, guestEntries, guest: !accountId, hasLegacyEdits: Boolean(visibleOwner && hasLegacyEdits),
    importDuplicates: importReport?.owner === visibleOwner ? importReport.duplicates : [],
    status: visibleOwner ? status : error ? 'Couldn’t sync — Retry' as Status : 'Loading' as Status, error, conflicts: visibleOwner ? pending : noPending,
    save: (input: PantryEntryInput, id?: string, intent?: PantrySaveIntent) => write(input, id, intent), remove: (entry: PantryEntry) => write(null, entry.id),
    retry: async () => {
      const owner = activeOwner.current;
      if (owner?.startsWith('guest:')) await guestLock(async () => { const guest = readGuestPantry(localStorage); setError(null); await publish(guest.owner, guest); });
      else if (owner) await synchronize(owner);
    },
    reviewLegacy: () => legacyGuest(false), importLegacy: async () => { await legacyGuest(true); }, resolve, importGuest };
}
