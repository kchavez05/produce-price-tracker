// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { webcrypto } from 'node:crypto';
import { usePantry } from '@/hooks/usePantry';
import { PantryEntry, PantryMutationResult, PantryOwner } from '@/types/pantry';
import { migrateLegacyPantry, PantryMigrationSnapshot } from '@/lib/pantry/migration';
import { evaluatePantryMutation, mutationFingerprint, validatePantryMutation } from '@/lib/pantry/mutations';
import { guestPantryKey, pantryCacheKey } from '@/lib/pantry/client-cache';
import { pantryQueueKey } from '@/lib/pantry/queue';
import { createTestSyncLock } from 'tests/sync-lock';
import { syncQueueKey } from '@/lib/sync/queue';
import { pantryBrowserExport } from '@/lib/pantry/browser-export';

let client: ReturnType<typeof usePantry>;
let root: Root;
let container: HTMLDivElement;
let owner: PantryOwner;
let renderedAccountId: string | null;
let offline: boolean;
let loseAcknowledgment: boolean;
let server: Map<PantryOwner, PantryMigrationSnapshot>;
let receipts: Map<string, { fingerprint: string; result: PantryMutationResult }>;
const now = '2026-10-29T12:00:00Z';
const empty = (scope: PantryOwner): PantryMigrationSnapshot => ({ owner: scope, entries: [], legacyMigrationVersion: 1, needsCatalogMatch: [], legacySource: { owner: scope, freezerItems: [], onHandIngredientIds: [] } });
const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
async function run(action: () => unknown) { await act(async () => { await action(); for (let i = 0; i < 5; i++) await settle(); }); }
function Harness({ accountId }: { accountId: string | null }) { client = usePantry(true, accountId); return null; }
async function render(accountId: string | null) { renderedAccountId = accountId; await run(() => root.render(createElement(Harness, { accountId }))); }
beforeEach(() => {
  localStorage.clear();
  offline = false; loseAcknowledgment = false; owner = 'account:alice'; server = new Map(); receipts = new Map();
  server.set(owner, empty(owner)); server.set('account:bob', empty('account:bob'));
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('crypto', webcrypto);
  vi.stubGlobal('navigator', { locks: { request: createTestSyncLock() }, onLine: true });
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    if (offline) throw new Error('offline');
    if (!init?.method) return Response.json(renderedAccountId ? server.get(owner) : empty('guest:cookie'));
    const body = JSON.parse(init.body as string);
    if (url === '/api/sync') {
      if (body.userId !== owner.slice('account:'.length)) return Response.json({}, { status: 409 });
      const current = server.get(owner)!;
      server.set(owner, { ...current, legacySource: { ...current.legacySource!,
        freezerItems: body.freezerItems ?? current.legacySource!.freezerItems,
        onHandIngredientIds: body.preferences?.onHandIngredientIds ?? current.legacySource!.onHandIngredientIds } });
      return Response.json({ profile: { id: body.userId } });
    }
    if (body.owner !== owner) return Response.json({ code: 'owner_changed' }, { status: 409 });
    if (body.action === 'migrate') {
      const current = server.get(owner)!;
      const prepared = migrateLegacyPantry(current, current.legacySource!, now);
      const result = { ...prepared, entries: prepared.entries.map((entry) => ({ ...entry, revision: 1 })) };
      server.set(owner, result); return Response.json(result);
    }
    const mutation = validatePantryMutation(body.mutation);
    const key = `${owner}:${mutation.mutationId}`;
    const prior = receipts.get(key);
    if (prior && prior.fingerprint !== mutationFingerprint(mutation)) return Response.json({ error: 'mutation_id_reused' }, { status: 409 });
    const current = server.get(owner)!;
    const result = prior?.result ?? evaluatePantryMutation(current.entries, mutation, now);
    if (result.status === 'applied' && !prior) {
      server.set(owner, { ...current, entries: [...current.entries.filter((entry) => entry.id !== result.entry.id), result.entry] });
      receipts.set(key, { fingerprint: mutationFingerprint(mutation), result });
    }
    if (loseAcknowledgment) { loseAcknowledgment = false; throw new Error('response lost'); }
    return Response.json({ owner, ...result }, { status: result.status === 'conflict' ? 409 : 200 });
  }));
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await run(() => root.unmount()); container.remove(); vi.unstubAllGlobals(); });

describe('pantry client persistence and ownership', () => {
  it('stores quantity-free guest entries locally, restores after remount, and preserves No details', async () => {
    await render(null);
    const scope = client.owner;
    await run(() => client.save({ ingredientId: 'olive-oil', displayName: 'Olive oil', available: true }));
    const saved = client.entries[0];
    expect(saved.quantity).toBeUndefined();
    await run(() => client.save({ ...saved, available: false, quantity: 0, useByDate: '2000-01-01' }, saved.id));
    expect(fetch).not.toHaveBeenCalled();
    await run(() => root.unmount()); root = createRoot(container); await render(null);
    expect(client.owner).toBe(scope);
    expect(client.entries[0]).toMatchObject({ available: false, quantity: 0, useByDate: '2000-01-01' });
    expect(client.status).toBe('Saved');
  });
  it('persists offline account edits through reload and safely retries a lost acknowledgment', async () => {
    await render('alice'); offline = true;
    await run(() => client.save({ ingredientId: 'chicken-broth', displayName: 'Chicken broth', available: true }));
    expect(localStorage.getItem(pantryQueueKey(owner))).not.toBeNull();
    await run(() => root.unmount()); root = createRoot(container); await render('alice');
    expect(client.entries).toMatchObject([{ displayName: 'Chicken broth', available: true }]);
    offline = false; loseAcknowledgment = true;
    await run(() => client.retry());
    expect(server.get(owner)?.entries).toHaveLength(1);
    expect(localStorage.getItem(pantryQueueKey(owner))).not.toBeNull();
    await run(() => client.retry());
    expect(localStorage.getItem(pantryQueueKey(owner))).toBeNull();
    expect(client.entries[0].revision).toBe(1);
  });
  it('never displays or replays account A’s pending edits in account B', async () => {
    await render('alice'); offline = true;
    await run(() => client.save({ displayName: 'Alice private item', available: true }));
    owner = 'account:bob'; offline = false; await render('bob');
    expect(client.entries).toEqual([]);
    expect(server.get(owner)?.entries).toEqual([]);
    expect(localStorage.getItem(pantryQueueKey('account:alice'))).toContain('Alice private item');
    owner = 'account:alice'; await render('alice');
    expect(client.entries).toMatchObject([{ displayName: 'Alice private item' }]);
    expect(localStorage.getItem(pantryQueueKey(owner))).toBeNull();
  });
  it('hides the old pantry when the server session changes before the UI profile refreshes', async () => {
    await render('alice');
    await run(() => client.save({ displayName: 'Alice saved item', available: true }));
    offline = true;
    await run(() => client.save({ displayName: 'Alice pending item', available: true }));
    owner = 'account:bob'; offline = false;
    await run(() => client.retry());
    expect(client.entries).toEqual([]);
    expect(client.error).toContain('session changed');
    expect(localStorage.getItem(pantryQueueKey('account:alice'))).toContain('Alice pending item');
    expect(server.get('account:bob')?.entries).toEqual([]);
  });
  it('imports only after confirmation, preserving account duplicates and No metadata', async () => {
    await render(null);
    await run(() => client.save({ ingredientId: 'salt', displayName: 'Salt', available: true }));
    await run(() => client.save({ displayName: 'My spice blend', available: true }));
    const stocked: PantryEntry = { ingredientId: 'salt', displayName: 'Salt', available: false, quantity: 7, unit: 'bags', id: 'account-salt', revision: 1, updatedAtIso: now };
    server.set(owner, { ...empty(owner), entries: [stocked] });
    await render('alice');
    expect(client.entries).toEqual([stocked]);
    expect(client.guestEntries).toHaveLength(2);
    await run(() => client.importGuest());
    expect(server.get(owner)?.entries).toHaveLength(2);
    expect(server.get(owner)?.entries.find((entry) => entry.id === stocked.id)).toEqual(stocked);
    expect(client.importDuplicates).toEqual(['Salt']);
    await run(() => client.importGuest());
    expect(server.get(owner)?.entries).toHaveLength(2);
    expect(JSON.parse(localStorage.getItem(guestPantryKey)!).entries).toHaveLength(2);
  });
  it('keeps a conflicting edit after a remote deletion until an explicit choice', async () => {
    await render('alice');
    await run(() => client.save({ displayName: 'Rice', available: true }));
    const original = client.entries[0];
    server.set(owner, { ...server.get(owner)!, entries: [{ ...original, revision: 2, deletedAtIso: now }] });
    await run(() => client.save({ ...original, available: false }, original.id));
    expect(client.conflicts[0].conflict).toMatchObject({ reason: 'revision', current: { deletedAtIso: now } });
    expect(server.get(owner)?.entries[0].revision).toBe(2);
    await run(() => client.resolve(client.conflicts[0].mutation.mutationId, 'mine'));
    expect(server.get(owner)?.entries[0]).toMatchObject({ available: false, revision: 3 });
    expect(server.get(owner)?.entries[0].deletedAtIso).toBeUndefined();
  });
  it('requires review for older browser records and preserves their original purchase metadata', async () => {
    const old = { id: 'lot', canonicalIngredientId: 'ground-turkey', ingredientName: 'Turkey', category: 'PROTEIN', quantityLbOrDoz: 2, unit: 'lb', purchasePricePerUnit: 2, regularPricePerUnit: 4, totalCostBasis: 4, estimatedSavings: 4, store: 'KING_SOOPERS', storeBanner: 'KS', purchasedAtIso: now, notes: 'Original purchase' };
    localStorage.setItem('pantrybot_virtual_freezer_v12', JSON.stringify([old]));
    await render(null);
    expect(client.entries).toEqual([]);
    let preview: readonly PantryEntry[] = [];
    await run(async () => { preview = await client.reviewLegacy(); });
    expect(preview).toMatchObject([{ available: true, quantity: 2 }]);
    expect(client.entries).toEqual([]);
    await run(() => client.importLegacy());
    expect(JSON.parse(localStorage.getItem(guestPantryKey)!).legacySource.freezerItems).toEqual([old]);
    expect(localStorage.getItem('pantrybot_virtual_freezer_v12')).toBe(JSON.stringify([old]));
    const migrated = client.entries[0];
    await run(() => client.save({ ...migrated, available: false }, migrated.id));
    await run(() => client.importLegacy());
    expect(client.entries).toHaveLength(1);
    expect(client.entries[0].available).toBe(false);
  });
  it('refuses a foreign cache and preserves its bytes before a successful retry', async () => {
    const foreign = JSON.stringify({ ...empty('account:alice'), entries: [{ displayName: 'Private', available: true, id: 'private', revision: 1, updatedAtIso: now }] });
    localStorage.setItem(pantryCacheKey('account:bob'), foreign);
    owner = 'account:bob'; await render('bob');
    expect(client.entries).toEqual([]);
    expect(client.error).toContain('owner');
    await run(() => client.retry());
    expect(client.entries).toEqual([]);
    expect(Object.keys(localStorage).some((key) => key.startsWith(`${pantryCacheKey(owner)}:recovery:`) && localStorage.getItem(key) === foreign)).toBe(true);
    expect(JSON.stringify(pantryBrowserExport(localStorage, owner))).not.toContain('Private');
  });
  it('finishes this account’s legacy queue before migration', async () => {
    server.set(owner, { ...empty(owner), legacyMigrationVersion: undefined });
    localStorage.setItem(syncQueueKey('alice'), JSON.stringify([{ userId: 'alice', mutationId: 'older', preferences: { onHandIngredientIds: ['ground-turkey'] } }]));
    await render('alice');
    expect(localStorage.getItem(syncQueueKey('alice'))).toBeNull();
    expect(client.entries).toMatchObject([{ ingredientId: 'ground-turkey', available: true }]);
  });
  it('preserves an older offline snapshot after another device migrated, requiring conflict choices', async () => {
    const old = { id: 'lot', canonicalIngredientId: 'ground-turkey', ingredientName: 'Turkey', category: 'PROTEIN' as const, quantityLbOrDoz: 2, unit: 'lb' as const, purchasePricePerUnit: 2, regularPricePerUnit: 4, totalCostBasis: 4, estimatedSavings: 4, store: 'KING_SOOPERS' as const, storeBanner: 'KS', purchasedAtIso: now, notes: 'Original purchase' };
    const source = { owner, freezerItems: [old], onHandIngredientIds: [] };
    const migrated = migrateLegacyPantry({ owner, entries: [], needsCatalogMatch: [] }, source, now);
    server.set(owner, { ...migrated, entries: migrated.entries.map((entry) => ({ ...entry, revision: 3, quantity: 9 })) });
    const raw = JSON.stringify([{ userId: 'alice', mutationId: 'older', freezerItems: [{ ...old, quantityLbOrDoz: 3 }], preferences: { macroGoal: 'HIGH_PROTEIN' } }]);
    localStorage.setItem(syncQueueKey('alice'), raw);
    await render('alice');
    expect(client.hasLegacyEdits).toBe(true);
    await run(() => client.importLegacy());
    expect(server.get(owner)?.entries[0]).toMatchObject({ quantity: 9, revision: 3 });
    expect(client.conflicts[0].conflict).toMatchObject({ reason: 'revision' });
    expect(JSON.parse(localStorage.getItem(syncQueueKey('alice'))!)[0]).toMatchObject({ preferences: { macroGoal: 'HIGH_PROTEIN' } });
    expect(JSON.parse(localStorage.getItem(syncQueueKey('alice'))!)[0].freezerItems).toBeUndefined();
    expect(JSON.stringify(pantryBrowserExport(localStorage, owner))).toContain('Original purchase');
    await run(() => client.resolve(client.conflicts[0].mutation.mutationId, 'mine'));
    expect(server.get(owner)?.entries[0]).toMatchObject({ quantity: 3, revision: 4 });
  });
});
