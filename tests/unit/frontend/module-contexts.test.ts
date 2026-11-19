// @vitest-environment jsdom
// Tests that the Shop components render on their own from the AppProvider contexts, with no props and no dashboard
// shell around them (v2.0 M3 Phase B.2a, #701). The goldens pin that the shell's markup is unchanged; these pin the
// new contract: each component reads its state and calls its actions through the context hooks.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createDashboardHarness, keylessPayload, type DashboardHarness } from 'tests/helpers/dashboard-harness';
import AppProvider from '@/modules/shell/AppProvider';
import { useDashboardContext, usePreferencesContext, useShellContext, useShopContext } from '@/modules/shell/app-context';
import BoardAlerts from '@/modules/shop/BoardAlerts';
import BoardControls from '@/modules/shop/BoardControls';
import BoardLeaderboard from '@/modules/shop/BoardLeaderboard';
import RadarSection from '@/modules/shop/RadarSection';
import TripSection from '@/modules/shop/TripSection';

const payload = keylessPayload();
let harness: DashboardHarness | undefined;
afterEach(async () => { await harness?.teardown(); harness = undefined; vi.restoreAllMocks(); });

interface Seen {
  dashboard: ReturnType<typeof useDashboardContext>;
  preferences: ReturnType<typeof usePreferencesContext>;
  shop: ReturnType<typeof useShopContext>;
  shell: ReturnType<typeof useShellContext>;
}
let seen: Seen;
function Probe() {
  seen = { dashboard: useDashboardContext(), preferences: usePreferencesContext(), shop: useShopContext(), shell: useShellContext() };
  return null;
}

/** Render only the given module components inside the provider (plus the context probe), with no shell. */
async function mountModules(...components: Array<() => ReturnType<typeof createElement>>) {
  harness = await createDashboardHarness({ payload });
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
