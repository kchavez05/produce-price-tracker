// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { webcrypto } from 'node:crypto';
import AppUnderTest from 'tests/helpers/app-under-test';
import { DashboardPayload, UserSyncPayload } from '@/types/domain';
import { PantryEntry, PantryMutation } from '@/types/pantry';
import { PantryMigrationSnapshot } from '@/lib/pantry/migration';
import { evaluatePantryMutation } from '@/lib/pantry/mutations';
import { cookingIngredients } from '@/lib/pantry/model';
import { guestPantryKey } from '@/lib/pantry/client-cache';
import { pantryQueueKey } from '@/lib/pantry/queue';
import { createMockCommodity, createMockDish, createMockIngredient } from 'tests/test-utils';
import { createTestSyncLock } from 'tests/sync-lock';
import { syncQueueKey } from '@/lib/sync/queue';

vi.mock('@/lib/supabase/client', () => ({ createBrowserSupabaseClient: () => null }));
const stock: PantryEntry = { id: 'stock', ingredientId: 'chicken-thighs-boneless', displayName: 'Chicken thighs',
  available: true, revision: 1, updatedAtIso: '', quantity: 0 };
const initialSync: UserSyncPayload = {
  authenticated: true,
  profile: { id: 'alice', email: '', displayName: 'Alice', provider: 'google', isCloudBacked: false, createdAtIso: '', updatedAtIso: '' },
  preferences: { userId: 'alice', defaultZip: '80542', favoriteStoreIds: ['KING_SOOPERS'], macroGoal: 'ANY',
    dietaryConstraints: [], vesselArchetype: 'ANY', targetServings: 6, pinnedIngredientIds: [],
    updatedAtIso: '' },
  savedRecipes: [], storageMode: 'SQLITE_LOCAL_FALLBACK', supabaseConfigured: false, syncedAtIso: '',
};
const dish = createMockDish({ id: 'meal' });
const initialData: DashboardPayload = {
  zipCode: '80542', cityLabel: 'Mead, CO', adCycleLabel: 'This week', lastUpdatedIso: '',
  dataSourcesActive: { flippLive: false, usdaLive: false, krogerLive: false, geminiConfigured: false, sqlitePersisted: true },
  sqliteStats: { dbPath: ':memory:', totalHistoricalOfferRows: 0, totalUsdaSnapshotRows: 0, trackedWeeksCount: 0 },
  nearbyKingSoopersLocations: [], selectedKingSoopersLocationId: '', activeStores: ['KING_SOOPERS'],
  commodities: [createMockCommodity({ ingredient: createMockIngredient({ id: stock.ingredientId!, name: stock.displayName, category: 'PROTEIN' }) })], splurgeAlerts: [],
  recommendedTrio: [dish], allRankedDishes: [dish], marketRadar: { buyBeforeSpike: [], holdOffDropping: [] },
};
let container: HTMLDivElement;
let root: Root;
let server: UserSyncPayload;
let pantryServer: PantryMigrationSnapshot;
let dashboardRequests: URL[];
let acknowledge: (() => void) | undefined;
let holdSync: boolean;
let failSync: boolean;
let mutationRequests: string[];
const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
function button(text: string) {
  const found = [...container.querySelectorAll<HTMLElement>('button, a[href]')].find((element) => element.textContent?.includes(text));
  if (!found) throw new Error(`Missing button: ${text}`);
  return found;
}
async function waitUntil(check: () => boolean) {
  const deadline = Date.now() + 5000;
  while (!check()) {
    if (Date.now() > deadline) throw new Error('Dashboard did not reach the expected state');
    await act(async () => { await settle(); });
  }
}
async function click(element: HTMLElement) { await act(async () => { element.click(); await settle(); }); }
async function openPantry() {
  await click(button('Pantry'));
  await waitUntil(() => Boolean(container.querySelector('#virtual-pantry-title')));
  await waitUntil(() => container.querySelector('section[aria-labelledby="virtual-pantry-title"] [role="status"]')?.textContent?.includes('Saved') === true);
}
async function mount() {
  root = createRoot(container);
  await act(async () => { root.render(createElement(AppUnderTest, { initialData, initialAccountId: 'alice' })); await settle(); });
}
beforeEach(async () => {
  localStorage.clear(); sessionStorage.clear(); server = structuredClone(initialSync);
  pantryServer = { owner: 'account:alice', entries: [stock], legacyMigrationVersion: 1, needsCatalogMatch: [],
    acceptedCatalogIds: cookingIngredients.map((entry) => entry.id) };
  dashboardRequests = []; mutationRequests = []; acknowledge = undefined; holdSync = false; failSync = false;
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('crypto', webcrypto);
  vi.stubGlobal('navigator', { onLine: true, locks: { request: createTestSyncLock() } });
  vi.stubGlobal('fetch', vi.fn(async (input: string, init?: RequestInit) => {
    if (input === '/api/pantry') {
      if (failSync) throw new Error('offline');
      if (init?.method === 'POST') {
        const body = JSON.parse(init.body as string) as { mutation: PantryMutation };
        mutationRequests.push(body.mutation.mutationId);
        const result = evaluatePantryMutation(pantryServer.entries, body.mutation, '2026-11-12T00:00:00Z');
        if (result.status === 'applied') pantryServer = { ...pantryServer, entries: [...pantryServer.entries.filter((entry) => entry.id !== result.entry.id), result.entry] };
        return Response.json({ ...result, owner: pantryServer.owner });
      }
      return Response.json(pantryServer);
    }
    if (input === '/api/sync') {
      if (init?.method === 'POST') {
        if (failSync) throw new Error('offline');
        if (holdSync) await new Promise<void>((resolve) => { acknowledge = resolve; });
        const mutation = JSON.parse(init.body as string);
        server = { ...server, preferences: { ...server.preferences!, ...mutation.preferences }, syncedAtIso: new Date().toISOString() };
      }
      return Response.json(server);
    }
    if (input.startsWith('/api/dashboard?')) {
      dashboardRequests.push(new URL(input, 'http://localhost'));
      return Response.json(initialData);
    }
    throw new Error(`Unexpected request: ${input}`);
  }));
  container = document.createElement('div'); document.body.append(container); await mount();
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
const liveEntries = () => pantryServer.entries.filter((entry) => !entry.deletedAtIso);
async function reconnect() { await act(async () => { window.dispatchEvent(new Event('online')); await settle(); }); }
async function prepareGuest() {
  await act(async () => root.unmount());
  pantryServer = { ...pantryServer, entries: [] };
  localStorage.setItem(guestPantryKey, JSON.stringify({ owner: 'guest:private', entries: [{ ...stock, id: 'guest-salt', ingredientId: 'salt', displayName: 'Salt' }], legacyMigrationVersion: 1, needsCatalogMatch: [] }));
  await mount(); await openPantry();
    await click(button('Review guest pantry import'));
}

describe('signed-in dashboard sync through Pantry', () => {
  it('recomputes meal costs after an offline pantry deletion and retains the edit until reconnect', async () => {
    // The cost per serving is shown on the Plan page (the tab no longer carries it, M4-1a), so read it there.
    const cost = () => {
      const label = [...container.querySelectorAll('div')].find((element) => element.textContent === 'Additional / Serving');
      return Number(label?.nextElementSibling?.textContent?.replace('$', ''));
    };
    await click(button('Plan'));
    const before = cost();
    expect(Number.isFinite(before)).toBe(true);
    await openPantry();
    failSync = true;
    await click(button('Delete Chicken thighs'));
    expect(liveEntries()).toHaveLength(1);
    expect(localStorage.getItem(pantryQueueKey('account:alice'))).not.toBeNull();
    await click(button('Plan'));
    expect(cost()).toBeGreaterThan(before);
    const after = cost();
    failSync = false;
    await reconnect();
    expect(liveEntries()).toEqual([]);
    expect(localStorage.getItem(pantryQueueKey('account:alice'))).toBeNull();
    expect(cost()).toBe(after);
    await openPantry();
    expect(container.textContent).toContain('Saved');
    await click(button('Plan'));
    await click(button('All Macros'));
    expect(dashboardRequests.at(-1)?.searchParams.get('onHand')).toBe('');
  });
  it('preserves pins and servings selected before and during a preference acknowledgment', async () => {
    await click(button('Pin to Prep'));
    await click(button('Plan'));
    holdSync = true;
    await click(button('High-Protein'));
    expect(acknowledge).toBeTypeOf('function');
    await click(button('8 Srv / Dish'));
    await act(async () => { acknowledge!(); await settle(); });
    expect(localStorage.getItem(syncQueueKey('alice'))).toBeNull();
    expect(button('8 Srv / Dish').className).toContain('bg-emerald-400');
    await click(button('All Macros'));
    expect(dashboardRequests.at(-1)?.searchParams.get('servings')).toBe('8');
    expect(dashboardRequests.at(-1)?.searchParams.get('pinned')).toBe(stock.ingredientId);
    await act(async () => { acknowledge!(); await settle(); });
  });
  it('retains an offline guest import through a later pantry addition and reconnect replay', async () => {
    await prepareGuest();
    failSync = true;
    await click(button('Confirm import'));
    await waitUntil(() => localStorage.getItem(pantryQueueKey('account:alice')) !== null);
    expect(localStorage.getItem(pantryQueueKey('account:alice'))).not.toBeNull();
    await click(button('Shop'));
    await click(button('Have it'));
    failSync = false;
    await reconnect();
    expect(liveEntries().map((entry) => entry.ingredientId).sort()).toEqual(['chicken-thighs-boneless', 'salt']);
    expect(localStorage.getItem(pantryQueueKey('account:alice'))).toBeNull();
  });
  it('keeps a failed guest enqueue retryable and imports it only once', async () => {
    await prepareGuest(); const save = Storage.prototype.setItem;
    const rejected = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key: string, value: string) {
      if (key === pantryQueueKey('account:alice')) throw new Error('Storage full');
      return save.call(this, key, value);
    });
    await click(button('Confirm import'));
    await waitUntil(() => Boolean(container.querySelector('[role="alert"]')));
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('Storage full');
    expect(button('Confirm import')).toBeDefined();
    expect(localStorage.getItem(pantryQueueKey('account:alice'))).toBeNull();
    rejected.mockRestore();
    failSync = true;
    await click(button('Confirm import'));
    await waitUntil(() => localStorage.getItem(pantryQueueKey('account:alice')) !== null);
    failSync = false;
    await reconnect(); await reconnect();
    expect(liveEntries()).toHaveLength(1);
    expect(liveEntries()[0].ingredientId).toBe('salt');
    expect(mutationRequests.filter((id) => id.startsWith('import:'))).toHaveLength(1);
    expect(liveEntries()[0].revision).toBe(1);
    expect(localStorage.getItem(pantryQueueKey('account:alice'))).toBeNull();
  });
});
