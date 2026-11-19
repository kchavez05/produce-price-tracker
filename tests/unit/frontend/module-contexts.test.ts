// @vitest-environment jsdom
// Tests that the Shop and Plan components render on their own from the AppProvider contexts, with no props and no dashboard
// shell around them (v2.0 M3 Phases B.2a and B.2b, #701). The goldens pin that the shell's markup is unchanged; these pin the
// new contract: each component reads its state and calls its actions through the context hooks.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createDashboardHarness, keylessPayload, type DashboardHarness, type FetchHandler } from 'tests/helpers/dashboard-harness';
import AppProvider from '@/modules/shell/AppProvider';
import {
  useAccountContext, useDashboardContext, usePlanContext, usePreferencesContext, useShellContext, useShopContext,
} from '@/modules/shell/app-context';
import BoardAlerts from '@/modules/shop/BoardAlerts';
import BoardControls from '@/modules/shop/BoardControls';
import BoardLeaderboard from '@/modules/shop/BoardLeaderboard';
import RadarSection from '@/modules/shop/RadarSection';
import TripSection from '@/modules/shop/TripSection';
import PlanBlueprints from '@/modules/plan/PlanBlueprints';
import PlanDishes from '@/modules/plan/PlanDishes';
import PlanHeader from '@/modules/plan/PlanHeader';

const payload = keylessPayload();
let harness: DashboardHarness | undefined;
let onFetch: FetchHandler | undefined;
afterEach(async () => { await harness?.teardown(); harness = undefined; onFetch = undefined; vi.restoreAllMocks(); });

interface Seen {
  dashboard: ReturnType<typeof useDashboardContext>;
  preferences: ReturnType<typeof usePreferencesContext>;
  shop: ReturnType<typeof useShopContext>;
  shell: ReturnType<typeof useShellContext>;
  plan: ReturnType<typeof usePlanContext>;
  account: ReturnType<typeof useAccountContext>;
}
let seen: Seen;
function Probe() {
  seen = { dashboard: useDashboardContext(), preferences: usePreferencesContext(), shop: useShopContext(), shell: useShellContext(), plan: usePlanContext(), account: useAccountContext() };
  return null;
}

/** Render only the given module components inside the provider (plus the context probe), with no shell. */
async function mountModules(...components: Array<() => ReturnType<typeof createElement>>) {
  harness = await createDashboardHarness({ payload, onFetch });
  await act(async () => {
    harness!.root.render(createElement(AppProvider, { initialData: payload, initialAccountId: null },
      createElement(Probe), ...components.map((component, index) => createElement('div', { key: index, 'data-module': index }, component()))));
    await harness!.settle();
  });
  return harness;
}
const buttons = (h: DashboardHarness) => [...h.container.querySelectorAll('button')];
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

  it('BoardLeaderboard opens the Shell pantry drawer state for a grouped deal', async () => {
    const h = await mountModules(() => createElement(BoardLeaderboard));
    expect(seen.shell.showPantry).toBe(false);
    await act(async () => {
      buttons(h).find((b) => /Not marked available/.test(b.textContent ?? ''))!.click();
      await h.settle();
    });
    expect(seen.shell.showPantry).toBe(true);
    expect(seen.shell.arbitrageToast).toContain('Choose the specific ingredient');
  });

  it('BoardAlerts shows the alerts and pins through the Preferences context', async () => {
    const [first, ...rest] = payload.commodities;
    const alertPayload = { ...payload, splurgeAlerts: [first], commodities: [first, ...rest] };
    harness = await createDashboardHarness({ payload: alertPayload });
    await act(async () => {
      harness!.root.render(createElement(AppProvider, { initialData: alertPayload, initialAccountId: null },
        createElement(Probe), createElement(BoardAlerts)));
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
      harness!.root.render(createElement(AppProvider, { initialData: radarPayload, initialAccountId: null },
        createElement(Probe), createElement(RadarSection)));
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
    // Grouped deals explain themselves with a toast and open the pantry drawer; they are never sent to the stock-up review.
    expect(seen.shell.arbitrageToast).toContain('Choose the specific ingredient');
    expect(seen.shell.showPantry).toBe(true);
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
    expect(seen.shell.activeTab).toBe('BOARD');
    await act(async () => { buttons(h).find((b) => b.textContent?.includes('Open Shopping List'))!.click(); await h.settle(); });
    expect(seen.shell.activeTab).toBe('SHOPPING_LIST');
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
