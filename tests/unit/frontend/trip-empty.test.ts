// @vitest-environment jsdom
// The empty Trip (v2.0 M4-3b, wireframe Empty Trip). The app always plans three dishes, so no real payload leaves the shopping list
// empty; the state is for the day it does (no dishes, nothing to buy). The Shop's contexts are replaced so the component can be
// shown with nothing to buy.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderUi, type RenderHandle } from 'tests/helpers/render';

const navigateTo = vi.fn();
vi.mock('@/modules/shell/app-context', () => ({
  useDashboardContext: () => ({ data: {}, shoppingPlan: { pantryChecklist: [] }, resolvedShoppingItems: [], activeTrio: [], trioTotals: {} }),
  useLocationContext: () => ({ currentZip: '80542' }),
  useShopContext: () => ({ showPrintSlipModal: false }),
  useShellContext: () => ({ navigateTo }),
}));
import TripSection from '@/modules/shop/TripSection';
import { createElement } from 'react';

let handle: RenderHandle | undefined;
afterEach(async () => { await handle?.unmount(); handle = undefined; navigateTo.mockReset(); });

describe('the empty Trip', () => {
  it('says the Trip is empty and offers Browse Deals and Go to Plan as links', async () => {
    handle = await renderUi(createElement(TripSection));
    expect(handle.container.querySelector('h2')!.textContent).toBe('Your Trip Is Empty');
    expect(handle.container.textContent).toContain('Add deals from Deals, or add the missing ingredients from a dish in Plan.');
    const links = [...handle.container.querySelectorAll('a')];
    expect(links.map((a) => [a.textContent, a.getAttribute('href')])).toEqual([['Browse Deals', '/shop'], ['Go to Plan', '/plan']]);
    expect(handle.container.querySelector('#trip-list')).toBeNull();
  });

  it('goes to the Deals view and to Plan through the Shell', async () => {
    handle = await renderUi(createElement(TripSection));
    const [browse, plan] = [...handle.container.querySelectorAll('a')];
    await handle.run(() => browse.click());
    expect(navigateTo).toHaveBeenLastCalledWith({ module: 'shop', view: 'BOARD' });
    await handle.run(() => plan.click());
    expect(navigateTo).toHaveBeenLastCalledWith({ module: 'plan' });
  });
});
