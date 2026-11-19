// @vitest-environment jsdom
// The module and shop-view model that replaced the four-way tab (v2.0 M3 Phase B.3a, #701): navigateTo sets the module and,
// for Shop, the view; going to another module leaves the Shop view alone, so it is still there on return (owner decision 1).
import { afterEach, describe, expect, it } from 'vitest';
import { act, createElement } from 'react';
import { createDashboardHarness, keylessPayload, type DashboardHarness } from 'tests/helpers/dashboard-harness';
import AppProvider from '@/modules/shell/AppProvider';
import { useShellContext, useShopContext } from '@/modules/shell/app-context';
import { destinationOf, legacyTab } from '@/modules/shell/navigation';

const payload = keylessPayload();
let harness: DashboardHarness | undefined;
afterEach(async () => { await harness?.teardown(); harness = undefined; });

let shell: ReturnType<typeof useShellContext>;
let shop: ReturnType<typeof useShopContext>;
function Probe() { shell = useShellContext(); shop = useShopContext(); return null; }

async function mount() {
  harness = await createDashboardHarness({ payload });
  await act(async () => {
    harness!.root.render(createElement(AppProvider, { initialData: payload, initialAccountId: null }, createElement(Probe)));
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

describe('legacy tab mapping (until the tab strip becomes links)', () => {
  it('maps a module and view to the four-way tab and back', () => {
    expect(legacyTab('shop', 'BOARD')).toBe('BOARD');
    expect(legacyTab('shop', 'SHOPPING_LIST')).toBe('SHOPPING_LIST');
    expect(legacyTab('shop', 'RADAR')).toBe('RADAR');
    expect(legacyTab('plan', 'RADAR')).toBe('MEAL_PLAN');
    expect(destinationOf('MEAL_PLAN')).toEqual({ module: 'plan' });
    expect(destinationOf('RADAR')).toEqual({ module: 'shop', view: 'RADAR' });
    expect(destinationOf('SHOPPING_LIST')).toEqual({ module: 'shop', view: 'SHOPPING_LIST' });
  });
});
