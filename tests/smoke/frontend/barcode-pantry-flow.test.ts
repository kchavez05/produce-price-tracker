// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { webcrypto } from 'node:crypto';
import VirtualPantry from '@/components/VirtualPantry';
import { usePantry } from '@/hooks/usePantry';
import { guestPantryKey } from '@/lib/pantry/client-cache';
import { pantryQueueKey } from '@/lib/pantry/queue';
import { evaluatePantryMutation, validatePantryMutation } from '@/lib/pantry/mutations';
import { validateBarcode } from '@/lib/barcodes/validation';
import type { captureBarcode } from '@/lib/barcodes/camera';
import type { PantryMigrationSnapshot } from '@/lib/pantry/migration';
import type { PantryEntry, PantryOwner } from '@/types/pantry';
import { createTestSyncLock } from 'tests/sync-lock';

// Only hardware capture and the HTTP boundary are synthetic. Keep the actual
// camera/entry/pantry components, hook, confirmation, storage and queue connected.
const camera = vi.hoisted(() => ({ start: vi.fn<typeof captureBarcode>() }));
vi.mock('@/lib/barcodes/camera', () => ({ captureBarcode: camera.start }));
const digits = '011110118134';
const now = '2026-11-12T12:00:00Z';
const alice: PantryOwner = 'account:alice';
const bob: PantryOwner = 'account:bob';
const empty = (owner: PantryOwner): PantryMigrationSnapshot => ({ owner, entries: [], acceptedCatalogIds: ['olive-oil', 'avocado-oil'], legacyMigrationVersion: 1, needsCatalogMatch: [] });
const oil: PantryEntry = { id: 'oil', ingredientId: 'olive-oil', displayName: 'Olive oil', available: false, quantity: 0, unit: 'tbsp', location: 'FRIDGE', useByDate: '2000-01-01', revision: 7, updatedAtIso: now };
let root: Root;
let container: HTMLDivElement;
let session: PantryOwner;
let rejectWrites: boolean;
let remote: Map<PantryOwner, PantryMigrationSnapshot>;
let pantry: ReturnType<typeof usePantry>;
const hiddenDescriptor = Object.getOwnPropertyDescriptor(document, 'hidden');

function Harness({ accountId }: { accountId: string | null }) {
  pantry = usePantry(true, accountId);
  return createElement(VirtualPantry, { ...pantry, barcodeEnabled: true, cameraEnabled: true,
    onSave: pantry.save, onDelete: pantry.remove, onRetry: pantry.retry, onResolve: pantry.resolve,
    onImportGuest: pantry.importGuest, onReviewLegacy: pantry.reviewLegacy, onImportLegacy: pantry.importLegacy, onClose: () => {} });
}
async function run(action: () => unknown) {
  await act(async () => { await action(); });
}
async function until(assertion: () => void) {
  await vi.waitFor(async () => { await run(() => {}); assertion(); }, { timeout: 3000, interval: 10 });
}
async function render(accountId: string | null = null) {
  await run(() => root.render(createElement(Harness, { accountId })));
  await until(() => {
    expect(pantry.owner).toEqual(accountId ? `account:${accountId}` : expect.stringMatching(/^guest:/));
    expect(pantry.status).not.toBe('Loading');
  });
}
function button(label: string) {
  const item = [...container.querySelectorAll('button')].find((element) => element.textContent === label);
  if (!item) throw new Error(`Missing button: ${label}`);
  return item;
}
async function click(label: string) { await run(() => button(label).click()); }
async function type(label: string, value: string) {
  await run(() => {
    const field = [...container.querySelectorAll('label')].find((element) => element.textContent === label);
    const input = document.getElementById(field!.htmlFor) as HTMLInputElement;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}
async function lookup() {
  await click('Enter barcode'); await type('Printed barcode digits', digits); await click('Look up product');
  await until(() => expect(container.textContent).toContain('Product: EXTRA VIRGIN OLIVE OIL'));
}
async function reload(accountId: string | null) { await run(() => root.unmount()); root = createRoot(container); await render(accountId); }
const writes = () => vi.mocked(fetch).mock.calls.filter(([url, init]) => url === '/api/pantry' && init?.method === 'POST');

beforeEach(() => {
  localStorage.clear(); session = alice; rejectWrites = false;
  remote = new Map([[alice, empty(alice)], [bob, empty(bob)]]);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true); vi.stubGlobal('crypto', webcrypto);
  Object.defineProperty(document, 'hidden', { configurable: true, value: false });
  vi.stubGlobal('navigator', { locks: { request: createTestSyncLock() }, onLine: true });
  camera.start.mockReset().mockResolvedValue(undefined);
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    if (url === '/api/pantry/barcode-lookup') {
      const validation = validateBarcode(digits); if (!validation.ok) throw new Error('Invalid fixture');
      return Response.json({ status: 'FOUND', barcode: validation.barcode, product: {
        source: 'USDA_FDC_BRANDED', fdcId: '2533402', originalBarcode: digits, description: 'EXTRA VIRGIN OLIVE OIL',
        brandName: 'KROGER', brandOwner: null, packageLabel: '16.9 FL OZ/500 mL', marketCountry: 'United States',
        publicationDate: '2023-04-27', modifiedDate: null, availableDate: null, snapshotDate: '2026-10-29',
      }, suggestion: { ingredientId: 'olive-oil', ruleId: 'barcode-map-v1-fdc-2533402' } });
    }
    if (url !== '/api/pantry') throw new Error(`Unexpected endpoint: ${url}`);
    if (!init?.method) return Response.json(remote.get(session));
    if (rejectWrites) return Response.json({ error: 'Synthetic cloud unavailable' }, { status: 503 });
    const body = JSON.parse(init.body as string);
    // The fake server session is independent of the caller's owner field.
    if (body.owner !== session) return Response.json({ error: 'owner_changed' }, { status: 409 });
    if (body.action !== 'mutate') throw new Error('Unexpected migration or action');
    const mutation = validatePantryMutation(body.mutation);
    const snapshot = remote.get(session)!;
    const result = evaluatePantryMutation(snapshot.entries, mutation, now);
    if (result.status === 'applied') remote.set(session, { ...snapshot, entries: [...snapshot.entries.filter((entry) => entry.id !== result.entry.id), result.entry] });
    return Response.json({ owner: session, ...result }, { status: result.status === 'conflict' ? 409 : 200 });
  }));
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
});
afterEach(async () => {
  await run(() => root.unmount()); container.remove(); vi.unstubAllGlobals();
  if (hiddenDescriptor) Object.defineProperty(document, 'hidden', hiddenDescriptor);
  else Reflect.deleteProperty(document, 'hidden');
});

describe('connected barcode pantry flow (synthetic hardware and HTTP)', () => {
  it('requires deliberate capture, lookup and confirmation, then restores the guest entry after reload', async () => {
    await render(); await click('Enter barcode'); await click('Scan barcode');
    expect(camera.start).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
    await click('Start / resume camera');
    await until(() => expect(camera.start).toHaveBeenCalledOnce());
    const [, signal, capture] = camera.start.mock.calls[0];
    await run(() => capture(digits, 'UPC_A'));
    expect(signal.aborted).toBe(true); expect(fetch).not.toHaveBeenCalled(); expect(pantry.entries).toEqual([]);
    await click('Look up product');
    await until(() => expect(container.textContent).toContain('Product: EXTRA VIRGIN OLIVE OIL'));
    expect(JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string)).toEqual({ barcode: digits, format: 'UPC_A' });
    expect(pantry.entries).toEqual([]);
    await click('Confirm addition');
    await until(() => expect(pantry.entries).toHaveLength(1));
    const entry = pantry.entries[0];
    expect(entry).toMatchObject({ ingredientId: 'olive-oil', available: true, revision: 1 });
    expect(entry.quantity).toBeUndefined(); expect(writes()).toEqual([]);
    await reload(null);
    expect(pantry.entries).toEqual([entry]); expect(container.textContent).toContain('Saved');
  });

  it('cancels without storage changes and preserves explicit No details after correction and confirmation', async () => {
    localStorage.setItem(guestPantryKey, JSON.stringify({ ...empty('guest:test'), entries: [oil] }));
    await render(); const original = localStorage.getItem(guestPantryKey);
    await lookup(); await click('Cancel');
    expect(localStorage.getItem(guestPantryKey)).toBe(original);
    expect(document.activeElement).toBe(button('Enter barcode'));
    await lookup(); await type('Find a cooking ingredient', 'avocado oil'); await click('Choose Avocado oil');
    expect(pantry.entries).toEqual([oil]);
    await type('Find a cooking ingredient', 'olive oil'); await click('Choose Olive oil'); await click('Confirm addition');
    expect(pantry.entries).toEqual([{ ...oil, available: true, revision: 8, updatedAtIso: expect.any(String) }]);
    await reload(null);
    expect(pantry.entries[0]).toMatchObject({ id: oil.id, available: true, quantity: 0, unit: 'tbsp', useByDate: '2000-01-01', revision: 8 });
  });

  it('retains a failed confirmed write through reload and owner switching without replaying it into another account', async () => {
    await render('alice'); await lookup(); rejectWrites = true; await click('Confirm addition');
    await until(() => expect(container.textContent).toContain('Couldn’t sync — Retry'));
    const queued = localStorage.getItem(pantryQueueKey(alice));
    expect(queued).toContain('olive-oil'); expect(remote.get(alice)?.entries).toEqual([]);
    await reload('alice');
    expect(pantry.entries[0]).toMatchObject({ ingredientId: 'olive-oil' });
    session = bob; rejectWrites = false; await render('bob');
    await until(() => expect(pantry.status).toBe('Saved'));
    expect(pantry.entries).toEqual([]); expect(remote.get(bob)?.entries).toEqual([]);
    expect(localStorage.getItem(pantryQueueKey(alice))).toBe(queued);
    expect(writes().every(([, init]) => JSON.parse(init!.body as string).owner === alice)).toBe(true);
    session = alice; await render('alice');
    await until(() => expect(localStorage.getItem(pantryQueueKey(alice))).toBeNull());
    expect(localStorage.getItem(pantryQueueKey(alice))).toBeNull();
    expect(remote.get(alice)?.entries).toHaveLength(1);
    expect(pantry.entries[0]).toMatchObject({ ingredientId: 'olive-oil', revision: 1 });
    expect(pantry.status).toBe('Saved');
  });

  it('discards an unsaved review on account switch and surfaces a second-client revision conflict without overwriting', async () => {
    remote.set(alice, { ...empty(alice), entries: [oil] });
    await render('alice'); await lookup();
    session = bob; await render('bob');
    expect(container.textContent).not.toContain('Product: EXTRA VIRGIN');
    expect(writes()).toEqual([]); expect(pantry.entries).toEqual([]);
    session = alice; await render('alice');
    await type('Printed barcode digits', digits); await click('Look up product');
    await until(() => expect(container.textContent).toContain('Product: EXTRA VIRGIN OLIVE OIL'));
    const otherClient = { ...oil, revision: 8, quantity: 3 };
    remote.set(alice, { ...empty(alice), entries: [otherClient] });
    await run(() => window.dispatchEvent(new Event('focus')));
    await until(() => expect(container.textContent).toContain('Changed since review'));
    await click('Confirm addition');
    await until(() => expect(pantry.conflicts[0]?.conflict).toBeDefined());
    expect(pantry.conflicts[0].conflict).toMatchObject({ reason: 'revision', current: otherClient });
    expect(remote.get(alice)?.entries).toEqual([otherClient]);
    expect(localStorage.getItem(pantryQueueKey(alice))).not.toBeNull();
  });

  it('aborts an old account lookup and leaves the new owner lookup intact when the old response arrives late', async () => {
    await render('alice'); await click('Enter barcode'); await type('Printed barcode digits', digits);
    // Retain a valid response, then hold only the lookup HTTP boundary open.
    const response = await fetch('/api/pantry/barcode-lookup');
    const readOldResponse = vi.spyOn(response, 'text');
    let finish!: (response: Response) => void;
    vi.mocked(fetch).mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
    await click('Look up product');
    const signal = vi.mocked(fetch).mock.calls.at(-1)![1]!.signal!;
    session = bob; await render('bob');
    expect(signal.aborted).toBe(true);
    await type('Printed barcode digits', digits);
    let finishBob!: (response: Response) => void;
    vi.mocked(fetch).mockImplementationOnce(() => new Promise((resolve) => { finishBob = resolve; }));
    await click('Look up product');
    const bobSignal = vi.mocked(fetch).mock.calls.at(-1)![1]!.signal!;
    expect(container.textContent).toContain('Looking up the product');
    await run(() => finish(response));
    await until(() => expect(readOldResponse).toHaveBeenCalledOnce());
    expect(container.textContent).not.toContain('Product: EXTRA VIRGIN');
    expect(container.textContent).toContain('Looking up the product'); expect(bobSignal.aborted).toBe(false);
    const ownResponse = await fetch('/api/pantry/barcode-lookup');
    const ownProduct = await ownResponse.json(); ownProduct.product.description = 'BOB LOOKUP FIXTURE';
    await run(() => finishBob(Response.json(ownProduct)));
    await until(() => expect(container.textContent).toContain('Product: BOB LOOKUP FIXTURE'));
    expect(container.textContent).not.toContain('Product: EXTRA VIRGIN');
    expect(pantry.entries).toEqual([]); expect(writes()).toEqual([]);
    expect(localStorage.getItem(pantryQueueKey(alice))).toBeNull();
    expect(localStorage.getItem(pantryQueueKey(bob))).toBeNull();
  });

  it('fences an account when the server session changes before the UI account, preserving its pending confirmation', async () => {
    await render('alice'); await lookup(); rejectWrites = true; await click('Confirm addition');
    await until(() => expect(pantry.status).toBe('Couldn’t sync — Retry'));
    const queued = localStorage.getItem(pantryQueueKey(alice)); expect(queued).toContain('olive-oil');
    const sent = writes().length; expect(sent).toBeGreaterThan(0);
    // Do not update the Harness accountId: simulate a cookie/session change
    // before the UI's account state catches up.
    session = bob; rejectWrites = false;
    await click('Retry sync');
    await until(() => expect(container.textContent).toContain('signed-in session changed'));
    expect(pantry.owner).toBeNull(); expect(pantry.entries).toEqual([]);
    expect(container.textContent).not.toContain('Ingredient marked Yes');
    expect(container.textContent).not.toContain('Product: EXTRA VIRGIN');
    expect(writes()).toHaveLength(sent);
    expect(localStorage.getItem(pantryQueueKey(alice))).toBe(queued);
    expect(remote.get(alice)?.entries).toEqual([]); expect(remote.get(bob)?.entries).toEqual([]);
  });
});
