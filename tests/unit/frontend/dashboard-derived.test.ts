// @vitest-environment jsdom
// Characterization tests for the derived-data chain and the view state that feeds it (v2.0 M3 Phase B.1a, #701):
// the plan-invalidation signature, the promoted plan feeding the shopping list, state kept across tab switches
// (owner decision 1: preserve all state across navigation) and the price-clock effect. They pin develop's
// behavior so moving the chain into a hook cannot silently change it.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createDashboardHarness, keylessPayload, type DashboardHarness } from 'tests/helpers/dashboard-harness';

const payload = keylessPayload();
let harness: DashboardHarness | undefined;
afterEach(async () => { await harness?.teardown(); harness = undefined; vi.unstubAllGlobals(); });

const TABS = { board: 'Deals', plan: 'Plan', list: 'Trip', radar: 'Radar' };
const buttons = (h: DashboardHarness) => [...h.container.querySelectorAll('button')];
const dishTitles = (h: DashboardHarness) => [...h.container.querySelectorAll('h3')].map((el) => el.textContent ?? '')
  .filter((title) => payload.allRankedDishes.some((dish) => dish.title === title));
const showAll = (h: DashboardHarness) => buttons(h).find((b) => /^Show All \d+ Dishes$/.test(b.textContent ?? ''))!;

async function promoteLastBlueprint(h: DashboardHarness) {
  await h.click(h.link(TABS.plan));
  await h.click(showAll(h));
  const promote = buttons(h).filter((b) => b.textContent === 'Promote to Top 3');
  const chosen = promote[promote.length - 1];
  const title = chosen.parentElement?.querySelector('h4')?.textContent ?? '';
  await h.click(chosen);
  return title;
}

async function start() {
  vi.stubGlobal('scrollTo', vi.fn());
  harness = await createDashboardHarness({ payload });
  await harness.mount();
  return harness;
}

describe('promoted plan and the shopping list (activeTrio feeds shoppingPlan)', () => {
  it('rebuilds the shopping list from the promoted dishes, and keeps both across tab switches', async () => {
    const h = await start();
    await h.openShopView('Trip');
    const listBefore = h.container.textContent ?? '';
    const title = await promoteLastBlueprint(h);
    expect(dishTitles(h)[0]).toBe(title);
    await h.openShopView('Trip');
    const listAfter = h.container.textContent ?? '';
    expect(listAfter).not.toBe(listBefore);
    await h.openShopView('Radar');
    await h.click(h.link(TABS.plan));
    expect(dishTitles(h)[0]).toBe(title);
    await h.openShopView('Trip');
    expect(h.container.textContent).toBe(listAfter);
  });

  it('shows the plan totals from the promoted dishes', async () => {
    const h = await start();
    await h.click(h.link(TABS.plan));
    const heading = () => [...h.container.querySelectorAll('h2')].map((el) => el.textContent ?? '').find((text) => /Total Meals/.test(text));
    const before = heading();
    expect(before).toBeDefined();
    await promoteLastBlueprint(h);
    const after = heading();
    expect(after).toMatch(/\(\d+ Total Meals\)/);
  });
});

describe('plan invalidation (explicit clears and the context signature)', () => {
  it('reverts a promoted plan to the standard suggestions when the batch size changes', async () => {
    const h = await start();
    const title = await promoteLastBlueprint(h);
    expect(dishTitles(h)[0]).toBe(title);
    await h.click(h.button('8 Srv / Dish'));
    await h.waitUntil(() => h.requests.some((r) => r.url.startsWith('/api/dashboard?') && r.url.includes('servings=8')));
    expect(dishTitles(h)[0]).not.toBe(title);
  });

  it('reverts a promoted plan when the optional AI request text changes', async () => {
    const h = await start();
    const title = await promoteLastBlueprint(h);
    expect(dishTitles(h)[0]).toBe(title);
    await h.type(h.container.querySelector<HTMLInputElement>('input[aria-label="Optional AI meal-plan request"]')!, 'extra spicy');
    expect(dishTitles(h)[0]).not.toBe(title);
  });

  it('keeps a promoted plan when only unrelated state changes', async () => {
    const h = await start();
    const title = await promoteLastBlueprint(h);
    await h.openShopView('Deals');
    await h.click(h.button('Fresh Produce'));
    await h.click(h.link(TABS.plan));
    expect(dishTitles(h)[0]).toBe(title);
  });
});

describe('view state survives tab switches (owner decision 1)', () => {
  it('keeps the category and sort on the Board', async () => {
    const h = await start();
    const allCategories = h.container.textContent;
    await h.click(h.button('Fresh Produce'));
    const select = h.container.querySelector('select')!;
    const defaultOrder = h.container.textContent;
    expect(defaultOrder).not.toBe(allCategories);
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')!.set!.call(select, 'LOWEST_PRICE');
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await h.settle();
    const board = h.container.textContent;
    expect(board).not.toBe(defaultOrder);
    await h.click(h.link(TABS.plan));
    await h.openShopView('Deals');
    expect(h.button('Fresh Produce').className).toContain('bg-emerald-600');
    expect(h.container.querySelector('select')!.value).toBe('LOWEST_PRICE');
    expect(h.container.textContent).toBe(board);
  });

  it('keeps "show all blueprints" and the AI request text on the Plan', async () => {
    const h = await start();
    await h.click(h.link(TABS.plan));
    await h.click(showAll(h));
    await h.type(h.container.querySelector<HTMLInputElement>('input[aria-label="Optional AI meal-plan request"]')!, 'soup');
    await h.openShopView('Radar');
    await h.click(h.link(TABS.plan));
    expect(h.button('Hide Full Matrix')).toBeDefined();
    expect(h.container.querySelector<HTMLInputElement>('input[aria-label="Optional AI meal-plan request"]')!.value).toBe('soup');
  });

  it('keeps the chosen trip mode and the checked items on the shopping list', async () => {
    const h = await start();
    await h.openShopView('Trip');
    await h.click(buttons(h).find((b) => b.textContent?.startsWith('#1'))!);
    await h.click(h.container.querySelector<HTMLButtonElement>('button.mt-0\\.5.text-emerald-600')!);
    const list = h.container.textContent;
    const html = h.html();
    await h.openShopView('Radar');
    await h.openShopView('Trip');
    expect(h.container.textContent).toBe(list);
    expect(h.html()).toBe(html);
  });
});

describe('price clock effect', () => {
  it('refreshes on focus and every 60 seconds, and cleans both up on unmount', async () => {
    const add = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(window, 'removeEventListener');
    const setTimer = vi.spyOn(window, 'setInterval');
    const clearTimer = vi.spyOn(window, 'clearInterval');
    const h = await start();
    const focusListeners = add.mock.calls.filter(([type]) => type === 'focus').map(([, listener]) => listener);
    expect(focusListeners.length).toBeGreaterThan(0);
    const timer = setTimer.mock.results.map((result, index) => ({ delay: setTimer.mock.calls[index][1], id: result.value }))
      .find((entry) => entry.delay === 60_000);
    expect(timer).toBeDefined();
    await h.unmount();
    for (const listener of focusListeners) {
      expect(remove.mock.calls.some(([type, removed]) => type === 'focus' && removed === listener)).toBe(true);
    }
    expect(clearTimer.mock.calls.some(([id]) => id === timer!.id)).toBe(true);
  });
});
