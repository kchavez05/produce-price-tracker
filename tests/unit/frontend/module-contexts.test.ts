// @vitest-environment jsdom
// Tests that the Shop, Plan, Shell and Pantry components render on their own from the AppProvider contexts, with no props and no dashboard
// shell around them (v2.0 M3 Phases B.2a to B.2d, #701). The goldens pin that the shell's markup is unchanged; these pin the
// new contract: each component reads its state and calls its actions through the context hooks.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import {
  aliceSync, createDashboardHarness, keylessPayload, type DashboardHarness, type FetchHandler,
} from 'tests/helpers/dashboard-harness';
import AppProvider from '@/modules/shell/AppProvider';
import { TestRouter } from 'tests/helpers/app-under-test';
import {
  useAccountContext, useDashboardContext, useLocationContext, usePlanContext, usePreferencesContext, useShellContext,
  useShopContext,
} from '@/modules/shell/app-context';
import BoardAlerts from '@/modules/shop/BoardAlerts';
import BoardControls from '@/modules/shop/BoardControls';
import BoardLeaderboard from '@/modules/shop/BoardLeaderboard';
import RadarSection from '@/modules/shop/RadarSection';
import TripSection from '@/modules/shop/TripSection';
import PlanBlueprints from '@/modules/plan/PlanBlueprints';
import PlanDishes from '@/modules/plan/PlanDishes';
import PlanHeader from '@/modules/plan/PlanHeader';
import PantryDrawer from '@/modules/pantry/PantryDrawer';
import AccountDialog from '@/modules/shell/AccountDialog';
import AlertsPanel from '@/modules/shell/AlertsPanel';
import FreshnessNotice from '@/modules/shell/FreshnessNotice';
import HeaderPrimary from '@/modules/shell/HeaderPrimary';
import PinSummary from '@/modules/shell/PinSummary';
import { BottomNavigation, SideNavigation } from '@/modules/shell/PrimaryNavigation';
import ShopViewNav from '@/modules/shop/ShopViewNav';
import StoreFilterBar from '@/modules/shell/StoreFilterBar';
import StoresPanel from '@/modules/shell/StoresPanel';
import ZipPanel from '@/modules/shell/ZipPanel';
import type { UserSyncPayload, WeeklySyncCronResult } from '@/types/domain';

const payload = keylessPayload();
let harness: DashboardHarness | undefined;
let onFetch: FetchHandler | undefined;
let sync: UserSyncPayload | undefined;
let accountId: string | null = null;
/** Every path the in-memory router was asked to open, in order. */
let pushes: string[] = [];
afterEach(async () => { await harness?.teardown(); harness = undefined; onFetch = undefined; sync = undefined; accountId = null; pushes = []; vi.restoreAllMocks(); });

interface Seen {
  dashboard: ReturnType<typeof useDashboardContext>;
  preferences: ReturnType<typeof usePreferencesContext>;
  shop: ReturnType<typeof useShopContext>;
  shell: ReturnType<typeof useShellContext>;
  plan: ReturnType<typeof usePlanContext>;
  account: ReturnType<typeof useAccountContext>;
  location: ReturnType<typeof useLocationContext>;
}
let seen: Seen;
function Probe() {
  seen = { dashboard: useDashboardContext(), preferences: usePreferencesContext(), shop: useShopContext(), shell: useShellContext(), plan: usePlanContext(), account: useAccountContext(), location: useLocationContext() };
  return null;
}

/** Render only the given module components inside the provider (plus the context probe), with no shell. */
async function mountModules(...components: Array<() => ReturnType<typeof createElement>>) {
  harness = await createDashboardHarness({ payload, onFetch, sync });
  await act(async () => {
    harness!.root.render(createElement(TestRouter, { onPush: (path) => pushes.push(path) }, createElement(AppProvider, { initialData: payload, initialAccountId: accountId },
      createElement(Probe), ...components.map((component, index) => createElement('div', { key: index, 'data-module': index }, component())))));
    await harness!.settle();
  });
  return harness;
}
const buttons = (h: DashboardHarness) => [...h.container.querySelectorAll('button')];
/** Links (the tab strip, the header Pantry link and the plan header's shopping-list link) are <a href> since B.3c. */
const links = (h: DashboardHarness) => [...h.container.querySelectorAll('a')];
const clickLink = (h: DashboardHarness, find: (a: HTMLAnchorElement) => boolean) =>
  act(async () => { links(h).find(find)!.click(); await h.settle(); });
const text = (h: DashboardHarness) => h.container.textContent ?? '';

describe('Shop components on the contexts, without the shell', () => {
  it('BoardControls reads and writes the Shop context', async () => {
    const h = await mountModules(() => createElement(BoardControls));
    expect(seen.shop.categoryFilter).toBe('ALL');
    expect(seen.shop.sortMode).toBe('VALUE_SCORE');
    await act(async () => { buttons(h).find((b) => b.textContent?.includes('Fresh Produce'))!.click(); await h.settle(); });
    expect(seen.shop.categoryFilter).not.toBe('ALL');
    expect(buttons(h).find((b) => b.textContent?.includes('Fresh Produce'))!.className).toContain('bg-emerald-600');
    const select = h.container.querySelector('select')!;
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')!.set!.call(select, 'LOWEST_PRICE');
      select.dispatchEvent(new Event('change', { bubbles: true }));
      await h.settle();
    });
    expect(seen.shop.sortMode).toBe('LOWEST_PRICE');
  });

  it('BoardLeaderboard lists the dashboard context\'s commodities and pins through the Preferences context', async () => {
    const h = await mountModules(() => createElement(BoardLeaderboard));
    const pinButtons = () => buttons(h).filter((b) => /Pin to Prep/.test(b.textContent ?? ''));
    expect(pinButtons().length).toBe(seen.dashboard.filteredCommodities.length);
    expect(seen.preferences.pinnedIds).toEqual([]);
    await act(async () => { pinButtons()[0].click(); await h.settle(); });
    expect(seen.preferences.pinnedIds).toHaveLength(1);
    expect(text(h)).toContain('Pinned');
  });

  it('BoardLeaderboard opens the Pantry module for a grouped deal', async () => {
    const h = await mountModules(() => createElement(BoardLeaderboard));
    expect(seen.shell.module).toBe('shop');
    await act(async () => {
      buttons(h).find((b) => /Not marked available/.test(b.textContent ?? ''))!.click();
      await h.settle();
    });
    expect(seen.shell.module).toBe('pantry');
    expect(seen.shell.arbitrageToast).toContain('Choose the specific ingredient');
  });

  it('BoardAlerts shows the alerts and pins through the Preferences context', async () => {
    const [first, ...rest] = payload.commodities;
    const alertPayload = { ...payload, splurgeAlerts: [first], commodities: [first, ...rest] };
    harness = await createDashboardHarness({ payload: alertPayload });
    await act(async () => {
      harness!.root.render(createElement(TestRouter, null, createElement(AppProvider, { initialData: alertPayload, initialAccountId: null },
        createElement(Probe), createElement(BoardAlerts))));
      await harness!.settle();
    });
    expect(buttons(harness).some((b) => /Pin to Prep/.test(b.textContent ?? ''))).toBe(true);
    expect(text(harness)).not.toContain('Pinned');
    await act(async () => { buttons(harness!).find((b) => /Pin to Prep/.test(b.textContent ?? ''))!.click(); await harness!.settle(); });
    expect(seen.preferences.pinnedIds).toEqual([first.ingredient.id]);
    expect(text(harness)).toContain('Pinned');
  });

  it('RadarSection renders from the dashboard context and pins a swap through the Preferences context', async () => {
    const [first, second, ...rest] = payload.commodities;
    const peak = {
      ...second,
      cycleSignal: {
        status: 'CYCLE_PEAK_WAIT' as const, badgeLabel: 'Peak', sixWeekLow: 1, sixWeekHigh: 2, sixWeekMedian: 1.5, pctVsSixWeekLow: 40,
        substitutionSuggestion: {
          substituteIngredientId: first.ingredient.id, substituteName: 'Substitute Pick', substitutePrice: 1, substituteStore: 'KING_SOOPERS' as const,
          savingsPerUnit: 0.5, reason: 'Cheaper this week',
        },
      },
    };
    const radarPayload = { ...payload, commodities: [first, peak, ...rest], marketRadar: { ...payload.marketRadar, cyclePeakWaitList: [peak] } };
    harness = await createDashboardHarness({ payload: radarPayload });
    await act(async () => {
      harness!.root.render(createElement(TestRouter, null, createElement(AppProvider, { initialData: radarPayload, initialAccountId: null },
        createElement(Probe), createElement(RadarSection))));
      await harness!.settle();
    });
    expect(text(harness)).toContain('Predictive 6-Week Cycle Signals');
    expect(text(harness)).toContain('Cheaper this week');
    await act(async () => { buttons(harness!).find((b) => b.textContent === 'Pin Swap')!.click(); await harness!.settle(); });
    expect(seen.preferences.pinnedIds).toEqual([first.ingredient.id]);
  });

  it('TripSection builds the shopping list from the dashboard context and toggles the Shop context', async () => {
    const h = await mountModules(() => createElement(TripSection));
    const toggles = () => [...h.container.querySelectorAll<HTMLButtonElement>('button.mt-0\\.5.text-emerald-600')];
    expect(toggles().length).toBeGreaterThan(0);
    expect(seen.shop.checkedItems).toEqual({});
    await act(async () => { toggles()[0].click(); await h.settle(); });
    expect(Object.values(seen.shop.checkedItems)).toEqual([true]);
    expect(seen.dashboard.resolvedShoppingItems.length).toBeGreaterThan(0);
    await act(async () => { buttons(h).find((b) => /#1/.test(b.textContent ?? ''))!.click(); await h.settle(); });
    expect(seen.shop.tripMode).not.toBe('SPLIT');
    await act(async () => { buttons(h).find((b) => b.textContent?.includes('Preview Printable Slip'))!.click(); await h.settle(); });
    expect(seen.shop.showPrintSlipModal).toBe(true);
    expect(text(h)).toContain('Hide Printable Slip');
  });

  it('TripSection marks availability through the Shell actions', async () => {
    const h = await mountModules(() => createElement(TripSection));
    const toggles = () => buttons(h).filter((b) => /Have at Home\?|On-Hand/.test(b.textContent ?? ''));
    expect(toggles().length).toBeGreaterThan(0);
    for (let index = 0; index < 4; index += 1) await act(async () => { toggles()[index].click(); await h.settle(); });
    // Grouped deals explain themselves with a toast and open the Pantry module; they are never sent to the stock-up review.
    expect(seen.shell.arbitrageToast).toContain('Choose the specific ingredient');
    expect(seen.shell.module).toBe('pantry');
  });
});

describe('Plan components on the contexts, without the shell', () => {
  const titles = (h: DashboardHarness) => [...h.container.querySelectorAll('h3')].map((el) => el.textContent ?? '')
    .filter((title) => payload.allRankedDishes.some((dish) => dish.title === title));

  it('PlanHeader shows the dashboard totals and writes preferences through the Preferences context', async () => {
    const h = await mountModules(() => createElement(PlanHeader));
    expect(text(h)).toContain(`(${seen.dashboard.trioTotals.totalServings} Total Meals)`);
    expect(text(h)).toContain(`$${seen.dashboard.trioTotals.avgPerServing}`);
    await act(async () => { buttons(h).find((b) => b.textContent?.includes('8 Srv / Dish'))!.click(); await h.settle(); });
    expect(seen.preferences.targetServings).toBe(8);
    await act(async () => { buttons(h).find((b) => b.textContent?.includes('High-Protein'))!.click(); await h.settle(); });
    expect(seen.preferences.macroGoal).toBe('HIGH_PROTEIN');
    await act(async () => { buttons(h).find((b) => b.textContent?.includes('Gluten-Free'))!.click(); await h.settle(); });
    expect(seen.preferences.dietaryConstraints).toContain('GLUTEN_FREE');
    await act(async () => { buttons(h).find((b) => b.textContent === 'Clear Profile Filters')!.click(); await h.settle(); });
    expect(seen.preferences.macroGoal).toBe('ANY');
    expect(seen.preferences.dietaryConstraints).toEqual([]);
  });

  it('PlanHeader opens the shopping list through the Shell context and runs the AI controls through the Plan context', async () => {
    const h = await mountModules(() => createElement(PlanHeader));
    await act(async () => { seen.shell.navigateTo({ module: 'plan' }); await h.settle(); });
    expect(seen.shell.module).toBe('plan');
    expect(pushes).toEqual(['/plan']);
    await clickLink(h, (a) => a.textContent?.includes('Open Shopping List') === true);
    expect(seen.shell.module).toBe('shop');
    expect(seen.shop.shopView).toBe('SHOPPING_LIST');
    expect(pushes).toEqual(['/plan', '/shop']);
    await h.type(h.container.querySelector<HTMLInputElement>('input[aria-label="Optional AI meal-plan request"]')!, 'soup');
    expect(seen.plan.customPrompt).toBe('soup');
    expect(seen.account.canUseAi).toBe(false);
    await act(async () => { buttons(h).find((b) => b.textContent?.includes('Sign in to access AI'))!.click(); await h.settle(); });
    expect(seen.shell.showAccountModal).toBe(true);
    expect(seen.shell.accountIntent).toBe('ai');
    await act(async () => { buttons(h).find((b) => b.textContent?.includes('Use standard suggestions'))!.click(); await h.settle(); });
    expect(seen.plan.aiBannerMessage).toBe('Using standard meal-prep suggestions.');
    expect(text(h)).toContain('Using standard meal-prep suggestions.');
  });

  it('PlanDishes lists the dashboard active trio, expands through the Plan context and saves a recipe', async () => {
    onFetch = (input, init) => (input === '/api/saved-recipes' && init?.method === 'POST' ? Response.json({ ok: true }) : undefined);
    const h = await mountModules(() => createElement(PlanDishes));
    expect(titles(h)).toEqual(seen.dashboard.activeTrio.map((dish) => dish.title));
    const first = seen.dashboard.activeTrio[0].id;
    expect(Object.keys(seen.plan.expandedDishIds)).toEqual([first]);
    const second = seen.dashboard.activeTrio[1].id;
    await act(async () => { buttons(h).filter((b) => /Show Prep & Reheat Guide/.test(b.textContent ?? ''))[0].click(); await h.settle(); });
    expect(Object.keys(seen.plan.expandedDishIds).sort()).toEqual([first, second].sort());
    await act(async () => { buttons(h).find((b) => b.textContent?.includes('Save Recipe'))!.click(); await h.settle(); });
    expect(h.requests.some((r) => r.url === '/api/saved-recipes' && r.method === 'POST')).toBe(true);
    // The saved recipe is shown as saved, from the Account context's saved ids.
    await h.waitUntil(() => text(h).includes('Saved in Library'));
  });

  it('PlanBlueprints lists and promotes through the Plan context', async () => {
    vi.stubGlobal('scrollTo', vi.fn());
    const h = await mountModules(() => createElement(PlanBlueprints));
    expect(text(h)).toContain(`Browse All ${seen.dashboard.data.allRankedDishes.length} Cost-Ranked Blueprints`);
    expect(seen.plan.showAllBlueprints).toBe(false);
    await act(async () => { buttons(h).find((b) => /^Show All \d+ Dishes$/.test(b.textContent ?? ''))!.click(); await h.settle(); });
    expect(seen.plan.showAllBlueprints).toBe(true);
    const promote = buttons(h).filter((b) => b.textContent === 'Promote to Top 3');
    expect(promote.length).toBeGreaterThan(0);
    const chosen = promote[promote.length - 1];
    const title = chosen.parentElement?.querySelector('h4')?.textContent ?? '';
    await act(async () => { chosen.click(); await h.settle(); });
    expect(seen.dashboard.activeTrio[0].title).toBe(title);
    vi.unstubAllGlobals();
  });
});

describe('Shell components on the contexts, without the shell', () => {
  const click = (h: DashboardHarness, find: (b: HTMLButtonElement) => boolean) =>
    act(async () => { buttons(h).find(find)!.click(); await h.settle(); });
  const digest = {
    ok: true, cycle: 'preview_digest', executedAtIso: '2026-11-17T12:00:00.000Z', syncedOffersCount: 0,
    refreshStatus: 'estimates_only', auditStorage: 'preview', dataSources: { flippLive: false, krogerLive: false, usdaLive: false },
    smartPushNotifications: [{ id: 'push-1', triggerType: 'FRIDAY_PREP_DIGEST', scheduledWindowLabel: 'Friday 4 PM', title: 'Weekend prep digest',
      subtitle: 'Three dishes', body: 'Your weekend trio is ready.', deepLinkPath: '/', badgeText: 'Digest', priority: 'normal' }],
    fridayWeekendDigest: { generatedAtIso: '2026-11-17T12:00:00.000Z', adCycleLabel: 'This week', zipCode: '80542', topValueCommodities: [],
      splurgeAlerts: [], recommendedWeekendTrio: [], markdownDigest: '# Weekend digest' },
    recentSyncRuns: [],
  } as unknown as WeeklySyncCronResult;

  it('HeaderPrimary reads the location and account and toggles the Shell drawers', async () => {
    sync = aliceSync;
    accountId = 'alice';
    onFetch = (input) => (input.startsWith('/api/cron/weekly-sync?') ? Response.json(digest) : undefined);
    const h = await mountModules(() => createElement(HeaderPrimary));
    expect(text(h)).toContain(seen.dashboard.data.cityLabel);
    expect(text(h)).toContain('(80542)');
    expect(seen.location.showZipModal).toBe(false);
    await click(h, (b) => b.title === 'Click to change your ZIP code');
    expect(seen.location.showZipModal).toBe(true);
    expect(seen.shell.module).toBe('shop');
    // The header has no Pantry control any more: the Pantry is a tab (M4-1a).
    expect(links(h).some((a) => a.title === 'Open Virtual Pantry')).toBe(false);
    await act(async () => { seen.shell.showAiSignIn(); await h.settle(); });
    expect(seen.shell.accountIntent).toBe('ai');
    await act(async () => { seen.shell.setShowAccountModal(false); await h.settle(); });
    await click(h, (b) => b.textContent?.includes('Alice') === true);
    expect(seen.shell.showAccountModal).toBe(true);
    expect(seen.shell.accountIntent).toBe('account');
    await click(h, (b) => b.title.startsWith('Preview Smart Push Notifications'));
    expect(seen.shell.showAlertsModal).toBe(true);
    expect(h.requests.some((r) => r.url === '/api/cron/weekly-sync?cycle=preview_digest&zip=80542')).toBe(true);
  });

  it('StoreFilterBar filters through the Preferences context (and the trip), and opens the stores drawer through Shell', async () => {
    const h = await mountModules(() => createElement(StoreFilterBar));
    expect(text(h)).toContain(`All Stores (${seen.preferences.activeStores.length})`);
    await click(h, (b) => b.textContent === 'ALDI');
    expect(seen.preferences.storeFilter).toBe('ALDI');
    expect(seen.shop.tripMode).toBe('ALDI');
    await click(h, (b) => b.textContent?.includes('All Stores') === true);
    expect(seen.preferences.storeFilter).toBe('ALL');
    expect(seen.shop.tripMode).toBe('SPLIT');
    expect(seen.shell.showStoresModal).toBe(false);
    await click(h, (b) => b.textContent?.includes('My Stores') === true);
    expect(seen.shell.showStoresModal).toBe(true);
  });

  it('FreshnessNotice shows the dashboard freshness details', async () => {
    const h = await mountModules(() => createElement(FreshnessNotice));
    const { freshness } = seen.dashboard.data;
    expect(freshness).toBeDefined();
    expect(text(h)).toContain(`${freshness!.usableLiveOffers} verified live prices`);
    expect(text(h)).toContain(`Planning cycle: ${seen.dashboard.data.adCycleLabel}.`);
  });

  it('PinSummary and the Shop view links read the other contexts and switch views through the Shell context', async () => {
    const entry = { id: 'oil', ingredientId: 'olive-oil', displayName: 'Olive oil', available: true, revision: 1, updatedAtIso: '' };
    sync = aliceSync;
    accountId = 'alice';
    onFetch = (input, init) => (input === '/api/pantry' && (init?.method ?? 'GET') === 'GET'
      ? Response.json({ owner: 'account:alice', entries: [entry], legacyMigrationVersion: 1, needsCatalogMatch: [], acceptedCatalogIds: [] }) : undefined);
    const h = await mountModules(() => createElement('div', null, createElement(PinSummary), createElement(ShopViewNav)));
    await h.waitUntil(() => text(h).includes('1 marked available'));
    expect(text(h)).not.toContain('Pinned');
    await act(async () => { seen.preferences.handleTogglePin(seen.dashboard.data.commodities[0].ingredient.id); await h.settle(); });
    expect(text(h)).toContain('1 Pinned \u2022 1 marked available');
    expect([seen.shell.module, seen.shop.shopView]).toEqual(['shop', 'BOARD']);
    expect(links(h).find((a) => a.textContent?.includes('View 3 Dishes'))!.getAttribute('href')).toBe('/plan');
    expect(links(h).find((a) => a.textContent?.includes('Radar'))!.getAttribute('href')).toBe('/shop');
    expect(links(h).filter((a) => a.getAttribute('aria-current') === 'page').map((a) => a.textContent)).toEqual(['Deals']);
    await clickLink(h, (a) => a.textContent?.includes('Radar') === true);
    expect([seen.shell.module, seen.shop.shopView]).toEqual(['shop', 'RADAR']);
    await clickLink(h, (a) => a.textContent?.includes('Trip') === true);
    expect([seen.shell.module, seen.shop.shopView]).toEqual(['shop', 'SHOPPING_LIST']);
    await clickLink(h, (a) => a.textContent?.includes('View 3 Dishes') === true);
    expect(seen.shell.module).toBe('plan');
    // Moving between Shop views changes no URL; only a change of module does.
    expect(pushes).toEqual(['/plan']);
  });

  it('ZipPanel edits and submits the ZIP through the Location context and closes through Shell state', async () => {
    const h = await mountModules(() => createElement(ZipPanel));
    const input = () => h.container.querySelector<HTMLInputElement>('input[placeholder^="e.g. 80542"]')!;
    await act(async () => { seen.location.setShowZipModal(true); seen.location.setZipError('stale'); await h.settle(); });
    await h.type(input(), '80a30b1');
    expect(seen.location.zipInput).toBe('80301');
    expect(seen.location.zipError).toBeNull();
    await h.type(input(), '');
    await click(h, (b) => b.textContent?.includes('Update Location') === true);
    await h.waitUntil(() => seen.location.zipError !== null);
    expect(text(h)).toContain('Please enter a valid 5-digit US ZIP code.');
    await click(h, (b) => b.textContent === '✕');
    expect(seen.location.showZipModal).toBe(false);
  });

  it('StoresPanel toggles and selects stores through the Preferences and Shell contexts', async () => {
    const h = await mountModules(() => createElement(StoresPanel));
    const cards = () => [...h.container.querySelectorAll<HTMLElement>('div.cursor-pointer')];
    expect(text(h)).toContain(`My Grocery Stores (${seen.preferences.activeStores.length} Active in ${seen.dashboard.data.cityLabel})`);
    const all = seen.preferences.activeStores.length;
    await act(async () => { cards()[0].click(); await h.settle(); });
    expect(seen.preferences.activeStores).toHaveLength(all - 1);
    await click(h, (b) => b.textContent === 'Select All');
    expect(seen.preferences.activeStores).toHaveLength(all);
    await act(async () => { seen.shell.setShowStoresModal(true); await h.settle(); });
    await click(h, (b) => b.textContent === '✕');
    expect(seen.shell.showStoresModal).toBe(false);
  });

  it('AlertsPanel shows the Shell context\'s digest and runs the weekly sync and the digest copy through it', async () => {
    const writeText = vi.fn();
    onFetch = (input, init) => (input === '/api/cron/weekly-sync' && init?.method === 'POST' ? Response.json(digest) : undefined);
    const h = await mountModules(() => createElement(AlertsPanel));
    Object.assign(navigator, { clipboard: { writeText } });
    expect(text(h)).not.toContain('Weekend prep digest');
    await act(async () => { seen.shell.setCronSyncResult(digest); await h.settle(); });
    expect(text(h)).toContain('Weekend prep digest');
    await click(h, (b) => b.textContent?.includes('Copy Friday Markdown Digest') === true);
    expect(writeText).toHaveBeenCalledWith('# Weekend digest');
    expect(seen.shell.copiedDigest).toBe(true);
    const before = h.requests.length;
    await click(h, (b) => b.textContent?.includes('Run Weekly Sync Now') === true);
    await h.waitUntil(() => h.requests.slice(before).some((r) => r.url === '/api/cron/weekly-sync' && r.method === 'POST'));
    expect(JSON.parse(h.requests.slice(before).find((r) => r.url === '/api/cron/weekly-sync')!.body!)).toEqual({ cycle: 'manual_sync', zipCode: '80542' });
  });
});

describe('PrimaryNavigation (M4-1a)', () => {
  const entry = { id: 'oil', ingredientId: 'olive-oil', displayName: 'Olive oil', available: true, revision: 1, updatedAtIso: '' };
  const navs = (h: DashboardHarness) => [...h.container.querySelectorAll('nav')];
  const mountNav = () => mountModules(() => createElement('div', null, createElement(SideNavigation), createElement(BottomNavigation)));

  it('renders the three tabs in the order Shop, Pantry, Plan for every width, as links with the current one marked', async () => {
    const h = await mountNav();
    // An icon rail, a sidebar and a tab bar; CSS shows one of them at a time.
    expect(navs(h).map((nav) => nav.getAttribute('aria-label'))).toEqual(['Primary', 'Primary', 'Primary']);
    for (const nav of navs(h)) {
      const links = [...nav.querySelectorAll('a')];
      expect(links.map((a) => a.textContent?.replace(/\(\d+\)/, '').trim())).toEqual(['Shop', 'Pantry', 'Plan']);
      expect(links.map((a) => a.getAttribute('href'))).toEqual(['/shop', '/pantry', '/plan']);
      expect(links.map((a) => a.getAttribute('aria-current'))).toEqual(['page', null, null]);
    }
    expect(navs(h)[0].parentElement!.className).toContain('medium:block');
    expect(navs(h)[1].parentElement!.parentElement!.className).toContain('wide:block');
    expect(navs(h)[2].parentElement!.className).toContain('medium:hidden');
  });

  it('moves between modules through the Shell context and marks the current module', async () => {
    const h = await mountNav();
    const tab = (nav: number, name: string) => [...navs(h)[nav].querySelectorAll('a')].find((a) => a.textContent?.startsWith(name))!;
    await act(async () => { tab(2, 'Plan').click(); await h.settle(); });
    expect(seen.shell.module).toBe('plan');
    expect([...navs(h)[2].querySelectorAll('a')].map((a) => a.getAttribute('aria-current'))).toEqual([null, null, 'page']);
    await act(async () => { tab(0, 'Pantry').click(); await h.settle(); });
    expect(seen.shell.module).toBe('pantry');
  });

  it('returns to the Shop view the user left, and shows the Pantry count from the Account context', async () => {
    sync = aliceSync;
    accountId = 'alice';
    onFetch = (input, init) => (input === '/api/pantry' && (init?.method ?? 'GET') === 'GET'
      ? Response.json({ owner: 'account:alice', entries: [entry], legacyMigrationVersion: 1, needsCatalogMatch: [], acceptedCatalogIds: [] }) : undefined);
    const h = await mountNav();
    await h.waitUntil(() => text(h).includes('Pantry(1)'));
    await act(async () => { seen.shell.navigateTo({ module: 'shop', view: 'RADAR' }); await h.settle(); });
    await act(async () => { seen.shell.navigateTo({ module: 'plan' }); await h.settle(); });
    const shopTab = [...navs(h)[2].querySelectorAll('a')].find((a) => a.textContent === 'Shop')!;
    await act(async () => { shopTab.click(); await h.settle(); });
    expect([seen.shell.module, seen.shop.shopView]).toEqual(['shop', 'RADAR']);
  });
});

describe('Pantry drawer and account dialog on the contexts, without the shell', () => {
  const click = (h: DashboardHarness, find: (b: HTMLButtonElement) => boolean) =>
    act(async () => { buttons(h).find(find)!.click(); await h.settle(); });
  const entry = { id: 'oil', ingredientId: 'olive-oil', displayName: 'Olive oil', available: true, revision: 1, updatedAtIso: '' };
  const pantryResponse = (owner: string) => Response.json({ owner, entries: [entry], legacyMigrationVersion: 1, needsCatalogMatch: [], acceptedCatalogIds: [] });

  it('PantryDrawer shows the account pantry and has no Close button (the Pantry is a tab)', async () => {
    sync = aliceSync;
    accountId = 'alice';
    onFetch = (input, init) => (input === '/api/pantry' && (init?.method ?? 'GET') === 'GET' ? pantryResponse('account:alice') : undefined);
    const h = await mountModules(() => createElement(PantryDrawer));
    await act(async () => { seen.shell.navigateTo({ module: 'plan' }); await h.settle(); });
    await act(async () => { seen.shell.navigateTo({ module: 'pantry' }); await h.settle(); });
    expect(h.container.querySelector('#virtual-pantry-title')).not.toBeNull();
    expect(seen.shell.module).toBe('pantry');
    await h.waitUntil(() => text(h).includes('Olive oil'));
    expect(text(h)).toContain('Speak pantry ingredients (experimental)');
    expect(buttons(h).some((b) => b.getAttribute('aria-label') === 'Close Virtual Pantry')).toBe(false);
    expect(seen.shell.module).toBe('pantry');
  });

  it('PantryDrawer sends a signed-out visitor to the AI sign-in through the Shell context', async () => {
    const h = await mountModules(() => createElement(PantryDrawer));
    await click(h, (b) => b.textContent?.includes('Sign in for experimental speech entry') === true);
    expect(seen.shell.showAccountModal).toBe(true);
    expect(seen.shell.accountIntent).toBe('ai');
  });

  it('PantryDrawer remounts when the pantry owner settles, so a half-typed search never carries over', async () => {
    let release: (response: Response) => void = () => undefined;
    const gate = new Promise<Response>((resolve) => { release = resolve; });
    sync = aliceSync;
    accountId = 'alice';
    onFetch = (input, init) => (input === '/api/pantry' && (init?.method ?? 'GET') === 'GET' ? gate : undefined);
    const h = await mountModules(() => createElement(PantryDrawer));
    const search = () => h.container.querySelector<HTMLInputElement>('input[type="search"]')!;
    await h.type(search(), 'rice');
    expect(search().value).toBe('rice');
    expect(seen.account.pantry.owner).toBeNull();
    release(pantryResponse('account:alice'));
    await h.waitUntil(() => seen.account.pantry.owner !== null);
    expect(search().value).toBe('');
  });

  it('AccountDialog opens and closes through the Shell context and shows the sign-in prompt or the AI intent', async () => {
    const h = await mountModules(() => createElement(AccountDialog));
    expect(text(h)).not.toContain('Sign In to Sync Your Virtual Pantry');
    await act(async () => { seen.shell.setShowAccountModal(true); await h.settle(); });
    expect(text(h)).toContain('Sign In to Sync Your Virtual Pantry & Preferences');
    await click(h, (b) => b.getAttribute('aria-label') === 'Close account modal');
    expect(seen.shell.showAccountModal).toBe(false);
    await act(async () => { seen.shell.showAiSignIn(); await h.settle(); });
    expect(text(h)).toContain('Sign in to access AI features');
  });

  it('AccountDialog shows the signed-in account and runs Sync Now through the Shell action', async () => {
    sync = aliceSync;
    accountId = 'alice';
    onFetch = (input, init) => (input === '/api/pantry' && (init?.method ?? 'GET') === 'GET' ? pantryResponse('account:alice') : undefined);
    const h = await mountModules(() => createElement(AccountDialog));
    await act(async () => { seen.shell.setShowAccountModal(true); await h.settle(); });
    expect(text(h)).toContain('Account, Cloud Sync & Privacy Controls');
    expect(text(h)).toContain('Alice');
    await h.waitUntil(() => text(h).includes('1 ingredients'));
    await act(async () => { seen.preferences.handleMacroGoalChange('HIGH_PROTEIN'); await h.settle(); });
    expect(text(h)).toContain('HIGH_PROTEIN');
    expect(text(h)).toContain('80542');
    expect(text(h)).toContain(`${seen.preferences.activeStores.length} Chains`);
    const pantryGets = () => h.requests.filter((r) => r.url === '/api/pantry' && r.method === 'GET').length;
    const before = pantryGets();
    await click(h, (b) => b.textContent?.includes('Sync Now') === true);
    await h.waitUntil(() => pantryGets() > before);
  });
});
