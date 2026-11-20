// @vitest-environment jsdom
// The module and shop-view model that replaced the four-way tab (v2.0 M3 Phase B.3a, #701): navigateTo sets the module and,
// for Shop, the view; going to another module leaves the Shop view alone, so it is still there on return (owner decision 1).
import { afterEach, describe, expect, it } from 'vitest';
import { act, createElement } from 'react';
import { createDashboardHarness, keylessPayload, type DashboardHarness } from 'tests/helpers/dashboard-harness';
import AppProvider from '@/modules/shell/AppProvider';
import { TestRouter } from 'tests/helpers/app-under-test';
import { useShellContext, useShopContext } from '@/modules/shell/app-context';
import {
  isTabModule, LAST_MODULE_COOKIE, lastModulePath, moduleOfPath, pathOf,
} from '@/modules/shell/navigation';

const payload = keylessPayload();
let harness: DashboardHarness | undefined;
afterEach(async () => { await harness?.teardown(); harness = undefined; });

let shell: ReturnType<typeof useShellContext>;
let shop: ReturnType<typeof useShopContext>;
function Probe() { shell = useShellContext(); shop = useShopContext(); return null; }

async function mount() {
  harness = await createDashboardHarness({ payload });
  await act(async () => {
    harness!.root.render(createElement(TestRouter, null, createElement(AppProvider, { initialData: payload, initialAccountId: null }, createElement(Probe))));
    await harness!.settle();
  });
  return harness;
}
const go = (h: DashboardHarness, destination: Parameters<typeof shell.navigateTo>[0]) =>
  act(async () => { shell.navigateTo(destination); await h.settle(); });

describe('navigateTo', () => {
  it('starts on the Shop Board', async () => {
    await mount();
    expect([shell.module, shop.shopView]).toEqual(['shop', 'BOARD']);
  });

  it('moves between the Shop views and the Plan module', async () => {
    const h = await mount();
    await go(h, { module: 'shop', view: 'SHOPPING_LIST' });
    expect([shell.module, shop.shopView]).toEqual(['shop', 'SHOPPING_LIST']);
    await go(h, { module: 'shop', view: 'RADAR' });
    expect([shell.module, shop.shopView]).toEqual(['shop', 'RADAR']);
    await go(h, { module: 'plan' });
    expect(shell.module).toBe('plan');
  });

  it('leaves the Shop view alone when going to Plan, so it is still there on return', async () => {
    const h = await mount();
    await go(h, { module: 'shop', view: 'RADAR' });
    await go(h, { module: 'plan' });
    expect(shop.shopView).toBe('RADAR');
    await go(h, { module: 'shop', view: 'BOARD' });
    expect([shell.module, shop.shopView]).toEqual(['shop', 'BOARD']);
  });
});

describe('the Pantry module (a tab since M4-1a)', () => {
  it('opens from any module with no return point, and leaves the Shop view untouched', async () => {
    const h = await mount();
    await go(h, { module: 'shop', view: 'RADAR' });
    await go(h, { module: 'pantry' });
    expect(shell.module).toBe('pantry');
    expect(shop.shopView).toBe('RADAR');
    expect('pantryReturn' in shell).toBe(false);
    expect('closePantry' in shell).toBe(false);
  });

  it('is left by choosing another module, and the Shop view is untouched meanwhile', async () => {
    const h = await mount();
    await go(h, { module: 'shop', view: 'SHOPPING_LIST' });
    await go(h, { module: 'pantry' });
    expect(shop.shopView).toBe('SHOPPING_LIST');
    await go(h, { module: 'plan' });
    expect(shell.module).toBe('plan');
    expect(shop.shopView).toBe('SHOPPING_LIST');
  });

  it('is opened by the stock-up review with its toast, from wherever the user is', async () => {
    const h = await mount();
    await go(h, { module: 'plan' });
    await act(async () => { shell.handleReviewStockUp(); await h.settle(); });
    expect(shell.module).toBe('pantry');
    expect(shell.arbitrageToast).toContain('Review your Pantry before stocking up.');
  });
});

describe('the module is the URL', () => {
  it('derives the module from the path and pushes the path of a destination, once per module change', async () => {
    const pushes: string[] = [];
    harness = await createDashboardHarness({ payload });
    await act(async () => {
      harness!.root.render(createElement(TestRouter, { onPush: (path) => pushes.push(path) },
        createElement(AppProvider, { initialData: payload, initialAccountId: null }, createElement(Probe))));
      await harness!.settle();
    });
    const h = harness;
    await go(h, { module: 'shop', view: 'RADAR' });
    expect(pushes).toEqual([]); // still on /shop: a Shop view change is state, not a URL
    await go(h, { module: 'plan' });
    await go(h, { module: 'plan' });
    await go(h, { module: 'pantry' });
    await go(h, { module: 'shop', view: 'BOARD' });
    expect(pushes).toEqual(['/plan', '/pantry', '/shop']);
  });

  it('maps paths to modules, with Shop as the default', () => {
    expect(moduleOfPath('/shop')).toBe('shop');
    expect(moduleOfPath('/plan')).toBe('plan');
    expect(moduleOfPath('/pantry')).toBe('pantry');
    expect(moduleOfPath('/settings')).toBe('settings');
    expect(moduleOfPath('/')).toBe('shop');
    expect(moduleOfPath('/plan/anything')).toBe('plan');
    expect(moduleOfPath('/privacy')).toBe('shop');
    expect(pathOf({ module: 'shop', view: 'RADAR' })).toBe('/shop');
    expect(pathOf({ module: 'plan' })).toBe('/plan');
    expect(pathOf({ module: 'pantry' })).toBe('/pantry');
    expect(pathOf({ module: 'settings' })).toBe('/settings');
  });

  it('sends "/" to the last-used module, and to Shop for a first visit or a bad cookie', () => {
    expect(lastModulePath(undefined)).toBe('/shop');
    expect(lastModulePath('plan')).toBe('/plan');
    expect(lastModulePath('pantry')).toBe('/pantry');
    expect(lastModulePath('shop')).toBe('/shop');
    // Settings is not a tab, so a cookie naming it is not a last-used module (M4-2a).
    expect(lastModulePath('settings')).toBe('/shop');
    expect(isTabModule('settings')).toBe(false);
    expect(lastModulePath('nonsense')).toBe('/shop');
    expect(lastModulePath('')).toBe('/shop');
    expect(isTabModule('plan')).toBe(true);
    expect(isTabModule('Plan')).toBe(false);
    expect(LAST_MODULE_COOKIE).toBe('pantrybot_last_module');
  });
});
