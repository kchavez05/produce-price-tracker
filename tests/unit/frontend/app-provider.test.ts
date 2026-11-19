// @vitest-environment jsdom
// Tests for the AppProvider and its seven contexts (v2.0 M3 Phase B.1e, #701). The goldens and the dashboard tests
// pin that the dashboard still behaves exactly as before; these pin what is new: the provider owns the state, so it
// survives its consumers unmounting (what Phase B.3's route changes rely on), the contexts are wired to the right
// owners, and a hook used outside the provider fails with a clear message.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { createDashboardHarness, keylessPayload, type DashboardHarness } from 'tests/helpers/dashboard-harness';
import AppProvider from '@/modules/shell/AppProvider';
import { TestRouter } from 'tests/helpers/app-under-test';
import {
  useAccountContext, useDashboardContext, useLocationContext, usePlanContext, usePreferencesContext, useShellContext,
  useShopContext,
} from '@/modules/shell/app-context';

const payload = keylessPayload();
let harness: DashboardHarness | undefined;
afterEach(async () => { await harness?.teardown(); harness = undefined; });

interface Seen {
  preferences: ReturnType<typeof usePreferencesContext>;
  location: ReturnType<typeof useLocationContext>;
  dashboard: ReturnType<typeof useDashboardContext>;
  account: ReturnType<typeof useAccountContext>;
  plan: ReturnType<typeof usePlanContext>;
  shop: ReturnType<typeof useShopContext>;
  shell: ReturnType<typeof useShellContext>;
}
let seen: Seen;
// A consumer that reads every context, like the shell will once the modules move onto them.
function Probe() {
  seen = {
    preferences: usePreferencesContext(), location: useLocationContext(), dashboard: useDashboardContext(),
    account: useAccountContext(), plan: usePlanContext(), shop: useShopContext(), shell: useShellContext(),
  };
  return createElement('span', { 'data-probe': '' }, 'probe');
}

const provider = (children: ReturnType<typeof createElement> | null) =>
  createElement(TestRouter, null, createElement(AppProvider, { initialData: payload, initialAccountId: null }, children));

async function mountProvider(children: () => ReturnType<typeof createElement> | null = () => createElement(Probe)) {
  harness = await createDashboardHarness({ payload });
  const render = (show: boolean) => act(async () => {
    harness!.root.render(provider(show ? children() : null));
    await harness!.settle();
  });
  await render(true);
  return { render, h: harness };
}

describe('AppProvider', () => {
  it('renders no markup of its own', async () => {
    const { render, h } = await mountProvider();
    expect(h.container.innerHTML).toBe('<span data-probe="">probe</span>');
    await render(false);
    expect(h.container.innerHTML).toBe('');
  });

  it('keeps every slice of state while its consumers unmount and mount again', async () => {
    vi.stubGlobal('scrollTo', vi.fn());
    const { render } = await mountProvider();
    const pinnable = seen.dashboard.data.commodities[0].ingredient.id;
    const dish = seen.dashboard.data.allRankedDishes[seen.dashboard.data.allRankedDishes.length - 1];
    await act(async () => {
      seen.preferences.handleTogglePin(pinnable);          // Preferences (and a dashboard refetch)
      seen.plan.setCustomPrompt('soup');                   // Plan UI
      seen.plan.setShowAllBlueprints(true);                // Plan UI
      seen.shop.setTripMode('ALDI');                       // Shop UI
      seen.shell.setArbitrageToast('Hello from the toast'); // Shell UI
      seen.shell.navigateTo({ module: 'shop', view: 'RADAR' }); // Shell UI (module) and Shop UI (view)
      seen.location.setZipInput('80301');                  // Location
      await harness!.settle();
    });
    expect(seen.preferences.pinnedIds).toEqual([pinnable]);
    await act(async () => { seen.plan.handlePromoteDish(dish); await harness!.settle(); }); // Plan action
    expect(seen.dashboard.activeTrio[0].id).toBe(dish.id);

    await render(false); // the consumers go away (a navigation), the provider stays mounted
    await render(true);

    expect(seen.preferences.pinnedIds).toEqual([pinnable]);
    expect(seen.plan.customPrompt).toBe('soup');
    expect(seen.plan.showAllBlueprints).toBe(true);
    expect(seen.shop.tripMode).toBe('ALDI');
    expect(seen.shell.arbitrageToast).toBe('Hello from the toast');
    expect(seen.shell.module).toBe('shop');
    expect(seen.shop.shopView).toBe('RADAR');
    expect(seen.location.zipInput).toBe('80301');
    // The promoted plan also survives: it is still the active trio, so the shopping list built from it is unchanged.
    expect(seen.dashboard.activeTrio[0].id).toBe(dish.id);
    vi.unstubAllGlobals();
  });

  it('feeds the Plan context into the derived data and clears the plan when a preference changes', async () => {
    vi.stubGlobal('scrollTo', vi.fn());
    await mountProvider();
    const standard = seen.dashboard.activeTrio.map((d) => d.id);
    const dish = seen.dashboard.data.allRankedDishes[seen.dashboard.data.allRankedDishes.length - 1];
    await act(async () => { seen.plan.handlePromoteDish(dish); await harness!.settle(); });
    expect(seen.dashboard.activeTrio.map((d) => d.id)).not.toEqual(standard);
    expect(seen.dashboard.shoppingPlan.items.length).toBeGreaterThan(0);
    await act(async () => { seen.preferences.handleServingsChange(8); await harness!.settle(); });
    expect(seen.preferences.targetServings).toBe(8);
    expect(seen.dashboard.activeTrio[0]?.id).not.toBe(dish.id);
    vi.unstubAllGlobals();
  });

  it('exposes the owner of each slice through its own context only', async () => {
    await mountProvider();
    expect(Object.keys(seen.preferences)).toEqual(expect.arrayContaining(['storeFilter', 'pinnedIds', 'handleTogglePin', 'handleStoreChange']));
    expect(seen.preferences).not.toHaveProperty('handleZipSubmit');
    expect(Object.keys(seen.location)).toEqual(expect.arrayContaining(['currentZip', 'zipInput', 'handleZipSubmit']));
    expect(Object.keys(seen.dashboard)).toEqual(expect.arrayContaining(['data', 'activeTrio', 'shoppingPlan', 'serverData', 'syncDashboard']));
    expect(Object.keys(seen.account)).toEqual(expect.arrayContaining(['userSync', 'pantry', 'pantryOwnerRef', 'canUseAi']));
    expect(Object.keys(seen.plan)).toEqual(expect.arrayContaining(['customPrompt', 'customAiDishes', 'handleGenerateAiPlan', 'handlePromoteDish']));
    expect(Object.keys(seen.shop)).toEqual(expect.arrayContaining(['tripMode', 'checkedItems', 'toggleCheckedItem', 'handleCopyShoppingListForNotes']));
    expect(Object.keys(seen.shell)).toEqual(expect.arrayContaining(['module', 'navigateTo', 'handleReviewStockUp', 'handleForceCloudSync', 'showAiSignIn']));
  });

  it('starts from the server payload: the first render matches a server render of the same props', async () => {
    harness = await createDashboardHarness({ payload });
    const server = renderToString(provider(createElement(Probe)));
    await act(async () => {
      harness!.root.render(provider(createElement(Probe)));
    });
    expect(harness.container.innerHTML).toBe(server);
  });
});

describe('context hooks outside the provider', () => {
  const hooks = {
    usePreferencesContext, useLocationContext, useDashboardContext, useAccountContext, usePlanContext, useShopContext,
    useShellContext,
  };
  for (const [name, hook] of Object.entries(hooks)) {
    it(`${name} fails with a clear message`, () => {
      function Bare() { hook(); return null; }
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      expect(() => renderToString(createElement(Bare))).toThrow(`${name} must be used inside AppProvider`);
      vi.restoreAllMocks();
    });
  }
});
