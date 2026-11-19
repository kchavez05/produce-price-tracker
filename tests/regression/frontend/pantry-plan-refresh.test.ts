// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { PantryEntry } from '@/types/pantry';
import { DashboardPayload } from '@/types/domain';
import { createMockCommodity, createMockDish, createMockIngredient } from 'tests/test-utils';
const pantry = vi.hoisted(() => ({ entries: [] as PantryEntry[] }));
vi.mock('@/hooks/usePantry', () => ({ usePantry: () => ({ owner: 'account:test', entries: pantry.entries, guest: false,
  guestEntries: [], hasLegacyEdits: false, importDuplicates: [], status: 'Saved', error: null, conflicts: [],
  save: vi.fn(), remove: vi.fn(), retry: vi.fn(), resolve: vi.fn(), importGuest: vi.fn(), reviewLegacy: vi.fn(), importLegacy: vi.fn() }) }));
vi.mock('@/hooks/useUserSync', () => ({ useUserSync: () => ({ authenticated: true,
  profile: { id: 'test', email: '', displayName: 'Test account', provider: 'google', isCloudBacked: true, createdAtIso: '', updatedAtIso: '' },
  lastSyncedIso: '2026-10-29T12:00:00Z',
  storageMode: 'SUPABASE_RLS', supabaseConfigured: true, syncStatus: 'IDLE', authLoading: false, hasGuestDataToMerge: false,
  guestFreezerCount: 0, signInWithProvider: vi.fn(), signOut: vi.fn(), dismissGuestMergePrompt: vi.fn(), pushCloudSync: vi.fn(),
  exportAccountDataJson: vi.fn(), deleteAccountAndData: vi.fn() }) }));
import AppUnderTest from 'tests/helpers/app-under-test';

const generated = createMockDish({ id: 'generated-plan', title: 'Generated plan before pantry edit' });
const data: DashboardPayload = {
  zipCode: '80542', cityLabel: 'Test market', adCycleLabel: 'This week', lastUpdatedIso: '2026-10-29T12:00:00Z',
  dataSourcesActive: { flippLive: false, usdaLive: false, krogerLive: false, geminiConfigured: false, sqlitePersisted: false },
  sqliteStats: { dbPath: ':memory:', totalHistoricalOfferRows: 0, totalUsdaSnapshotRows: 0, trackedWeeksCount: 0 },
  nearbyKingSoopersLocations: [], selectedKingSoopersLocationId: '', activeStores: ['KING_SOOPERS'],
  commodities: [createMockCommodity({ ingredient: createMockIngredient({ id: 'chicken-thighs-boneless', name: 'Chicken thighs', category: 'PROTEIN' }) })],
  splurgeAlerts: [], recommendedTrio: [], allRankedDishes: [], marketRadar: { buyBeforeSpike: [], holdOffDropping: [] },
};
let root: Root;
let container: HTMLDivElement;
const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
async function run(action: () => void) { await act(async () => { action(); await settle(); }); }
function button(text: string) {
  const found = [...container.querySelectorAll<HTMLElement>('button, a[href]')].find((element) => element.textContent?.includes(text));
  if (!found) throw new Error(`Missing button: ${text}`);
  return found;
}
async function render() { await run(() => root.render(createElement(AppUnderTest, { initialData: data, initialAccountId: 'test' }))); }
beforeEach(() => {
  pantry.entries = []; localStorage.clear();
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ dishes: [generated], usedAi: false })));
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await run(() => root.unmount()); container.remove(); vi.unstubAllGlobals(); });
describe('pantry availability and the active meal plan', () => {
  it('stops displaying a generated/fallback plan after availability changes without making a new AI request', async () => {
    await render();
    await run(() => button('Plan').click());
    await run(() => button('Remix 3-dish plan with AI').click());
    expect(container.textContent).toContain(generated.title);
    pantry.entries = [{ id: 'oil', ingredientId: 'olive-oil', displayName: 'Olive oil', available: true, revision: 1, updatedAtIso: '' }];
    await render();
    expect(container.textContent).not.toContain(generated.title);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('retains the active plan when only quantity or date changes', async () => {
    pantry.entries = [{ id: 'oil', ingredientId: 'olive-oil', displayName: 'Olive oil', available: true, revision: 1, updatedAtIso: '', quantity: 1 }];
    await render();
    await run(() => button('Plan').click());
    await run(() => button('Remix 3-dish plan with AI').click());
    pantry.entries = [{ ...pantry.entries[0], quantity: 0, useByDate: '2000-01-01', revision: 2 }];
    await render();
    expect(container.textContent).toContain(generated.title);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
