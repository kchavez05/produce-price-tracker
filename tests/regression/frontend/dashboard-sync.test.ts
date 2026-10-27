// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, Root } from 'react-dom/client';
import MealPrepDashboard from '@/components/MealPrepDashboard';
import { DashboardPayload, FreezerItem, UserSyncPayload } from '@/types/domain';
import { createMockCommodity, createMockDish } from 'tests/test-utils';
import { createTestSyncLock } from 'tests/sync-lock';
import { syncQueueKey } from '@/lib/sync/queue';

vi.mock('@/lib/supabase/client', () => ({ createBrowserSupabaseClient: () => null }));

const stock: FreezerItem = {
  id: 'stock', canonicalIngredientId: 'test-ingredient', ingredientName: 'Test Ingredient', category: 'PRODUCE',
  quantityLbOrDoz: 0.5, unit: 'lb', purchasePricePerUnit: 2, regularPricePerUnit: 4,
  totalCostBasis: 1, estimatedSavings: 1, store: 'KING_SOOPERS', storeBanner: 'King Soopers', purchasedAtIso: '',
};
const initialSync: UserSyncPayload = {
  authenticated: true,
  profile: { id: 'alice', email: '', displayName: 'Alice', provider: 'google', isCloudBacked: false, createdAtIso: '', updatedAtIso: '' },
  preferences: { userId: 'alice', defaultZip: '80542', favoriteStoreIds: ['KING_SOOPERS'], macroGoal: 'ANY',
    dietaryConstraints: [], vesselArchetype: 'ANY', targetServings: 6, pinnedIngredientIds: [],
    onHandIngredientIds: [stock.canonicalIngredientId], updatedAtIso: '' },
  freezerItems: [stock], savedRecipes: [], storageMode: 'SQLITE_LOCAL_FALLBACK', supabaseConfigured: false, syncedAtIso: '',
};
const dish = createMockDish({ id: 'meal', totalBatchCost: 0, costPerServing: 0 });
const initialData: DashboardPayload = {
  zipCode: '80542', cityLabel: 'Mead, CO', adCycleLabel: 'This week', lastUpdatedIso: '',
  dataSourcesActive: { flippLive: false, usdaLive: false, krogerLive: false, geminiConfigured: false, sqlitePersisted: true },
  sqliteStats: { dbPath: ':memory:', totalHistoricalOfferRows: 0, totalUsdaSnapshotRows: 0, trackedWeeksCount: 0 },
  nearbyKingSoopersLocations: [], selectedKingSoopersLocationId: '', activeStores: ['KING_SOOPERS'],
  freezerInventory: [stock], commodities: [createMockCommodity()], splurgeAlerts: [],
  recommendedTrio: [dish], allRankedDishes: [dish], marketRadar: { buyBeforeSpike: [], holdOffDropping: [] },
};

let container: HTMLDivElement;
let root: Root;
let server: UserSyncPayload;
let dashboardRequests: URL[];
let acknowledge: (() => void) | undefined;
let holdSync: boolean;
let failSync: boolean;

const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
function button(text: string) {
  const found = [...container.querySelectorAll('button')].find((element) => element.textContent?.includes(text));
  if (!found) throw new Error(`Missing button: ${text}`);
  return found;
}
async function click(element: HTMLElement) {
  await act(async () => { element.click(); await settle(); });
}

beforeEach(async () => {
  localStorage.clear();
  sessionStorage.clear();
  server = structuredClone(initialSync);
  dashboardRequests = [];
  acknowledge = undefined;
  holdSync = false;
  failSync = false;
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('navigator', { onLine: true, locks: { request: createTestSyncLock() } });
  vi.stubGlobal('fetch', vi.fn(async (input: string, init?: RequestInit) => {
    if (input === '/api/sync') {
      if (init?.method === 'POST') {
        if (failSync) throw new Error('offline');
        if (holdSync) await new Promise<void>((resolve) => { acknowledge = resolve; });
        const mutation = JSON.parse(init.body as string);
        server = { ...server, preferences: { ...server.preferences!, ...mutation.preferences },
          freezerItems: mutation.freezerItems ?? server.freezerItems, syncedAtIso: new Date().toISOString() };
      }
      return Response.json(server);
    }
    if (input.startsWith('/api/dashboard?')) {
      dashboardRequests.push(new URL(input, 'http://localhost'));
      const meal = server.freezerItems.length ? dish : { ...dish, totalBatchCost: 12, costPerServing: 2 };
      return Response.json({ ...initialData, freezerInventory: server.freezerItems, recommendedTrio: [meal], allRankedDishes: [meal] });
    }
    throw new Error(`Unexpected request: ${input}`);
  }));
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  await act(async () => { root.render(createElement(MealPrepDashboard, { initialData })); await settle(); });
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('signed-in dashboard sync', () => {
  it('preserves pins and servings selected before and during a preference acknowledgment', async () => {
    await click(button('Pin to Prep'));
    await click(button('2. 3-Dish Meal Prep'));
    holdSync = true;
    await click(button('High-Protein'));
    expect(acknowledge).toBeTypeOf('function');
    await click(button('8 Srv / Dish'));
    await act(async () => { acknowledge!(); await settle(); });
    expect(localStorage.getItem(syncQueueKey('alice'))).toBeNull();
    expect(button('8 Srv / Dish').className).toContain('bg-emerald-400');
    await click(button('All Macros'));
    expect(dashboardRequests.at(-1)?.searchParams.get('servings')).toBe('8');
    expect(dashboardRequests.at(-1)?.searchParams.get('pinned')).toBe('test-ingredient');
    // Release the second deliberately held request before unmounting.
    await act(async () => { acknowledge!(); await settle(); });
  });

  it('retains an offline guest import through a later freezer addition and reconnect replay', async () => {
    await act(async () => root.unmount());
    const imported = { ...stock, id: 'guest-import', canonicalIngredientId: 'guest-only', ingredientName: 'Imported Guest Stock' };
    localStorage.setItem('pantrybot_virtual_freezer_v12', JSON.stringify([imported]));
    server.freezerItems = [];
    server.preferences!.onHandIngredientIds = [];
    root = createRoot(container);
    await act(async () => {
      root.render(createElement(MealPrepDashboard, { initialData: { ...initialData, freezerInventory: [] } }));
      await settle();
    });
    failSync = true;
    await click(button('Alice'));
    await click(button('Merge into Account'));
    expect(JSON.parse(localStorage.getItem('pantrybot_virtual_freezer_v14:alice')!))
      .toEqual([imported]);
    expect(localStorage.getItem(syncQueueKey('alice'))).not.toBeNull();
    await click(container.querySelector('[aria-label="Close account modal"]') as HTMLElement);
    await click(button('Virtual Freezer'));
    expect(container.textContent).toContain('Imported Guest Stock');
    await click(button('Add to Freezer ($0 Prep)'));
    const cached = JSON.parse(localStorage.getItem('pantrybot_virtual_freezer_v14:alice')!) as FreezerItem[];
    expect(cached.some((item) => item.id === imported.id)).toBe(true);
    expect(cached.some((item) => item.canonicalIngredientId === 'test-ingredient')).toBe(true);
    failSync = false;
    await act(async () => { window.dispatchEvent(new Event('online')); await settle(); });
    expect(server.freezerItems.some((item) => item.id === imported.id)).toBe(true);
    expect(server.freezerItems.some((item) => item.canonicalIngredientId === 'test-ingredient')).toBe(true);
    expect(localStorage.getItem(syncQueueKey('alice'))).toBeNull();
  });

  it('keeps a failed guest enqueue retryable and imports it only once', async () => {
    await act(async () => root.unmount());
    const imported = { ...stock, id: 'guest-import', canonicalIngredientId: 'guest-only', ingredientName: 'Imported Guest Stock' };
    localStorage.setItem('pantrybot_virtual_freezer_v12', JSON.stringify([imported]));
    server.freezerItems = [];
    server.preferences!.onHandIngredientIds = [];
    root = createRoot(container);
    await act(async () => {
      root.render(createElement(MealPrepDashboard, { initialData: { ...initialData, freezerInventory: [] } }));
      await settle();
    });
    const save = Storage.prototype.setItem;
    const rejected = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key: string, value: string) {
      if (key === syncQueueKey('alice')) throw new Error('Storage full');
      return save.call(this, key, value);
    });
    await click(button('Alice'));
    await click(button('Merge into Account'));
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('Unable to save');
    expect(button('Merge into Account')).toBeDefined();
    expect(localStorage.getItem(syncQueueKey('alice'))).toBeNull();
    rejected.mockRestore();
    failSync = true;
    await click(button('Merge into Account'));
    const cached = JSON.parse(localStorage.getItem('pantrybot_virtual_freezer_v14:alice')!) as FreezerItem[];
    expect(cached).toEqual([imported]);
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });

  it.each(['Thaw & Remove from Freezer', 'Consume 0.5 lb/doz'])('refreshes meal prices after %s', async (title) => {
    await click(button('Virtual Freezer'));
    await click([...container.querySelectorAll('button')].find((element) => element.title === title)!);
    expect(server.freezerItems).toEqual([]);
    expect(server.preferences?.onHandIngredientIds).toEqual([]);
    expect(dashboardRequests.at(-1)?.searchParams.get('onHand')).toBe('');
    expect(button('2. 3-Dish Meal Prep').textContent).toContain('$2.00/srv');
    expect(container.textContent).toContain('Your Virtual Freezer is currently empty.');
  });
});
