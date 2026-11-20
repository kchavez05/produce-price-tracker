// @vitest-environment jsdom
// The routes (v2.0 M3 Phase B.3c, #701), through the in-memory router: each module is a page at its own path, the links are
// real links that navigate without a reload and leave modified clicks to the browser, the last-used module is remembered in
// a cookie, and state survives moving between modules (the point of putting the provider in the layout).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createDashboardHarness, keylessPayload, type DashboardHarness } from 'tests/helpers/dashboard-harness';

const payload = keylessPayload();
let harness: DashboardHarness | undefined;
beforeEach(() => { document.cookie = 'pantrybot_last_module=; Max-Age=0; Path=/'; });
afterEach(async () => { await harness?.teardown(); harness = undefined; vi.restoreAllMocks(); });

const MEAL_PLAN = 'Plan';
const LIST = 'Trip';
const RADAR = 'Radar';
const text = (h: DashboardHarness) => h.container.textContent ?? '';
const cookie = () => document.cookie.split('; ').find((entry) => entry.startsWith('pantrybot_last_module='));
const promptInput = (h: DashboardHarness) => h.container.querySelector<HTMLInputElement>('input[aria-label="Optional AI meal-plan request"]')!;
const dashboardRequests = (h: DashboardHarness) => h.requests.filter((r) => r.url.startsWith('/api/dashboard?'));

async function start(initialPath?: string, onFetch?: Parameters<typeof createDashboardHarness>[0]['onFetch']) {
  harness = await createDashboardHarness({ payload, onFetch });
  await harness.mount(initialPath ? { initialPath } : {});
  return harness;
}

describe('a page per module', () => {
  it('opens on the page for the path', async () => {
    const shop = await start('/shop');
    expect(text(shop)).toContain('Sort by:');
    await shop.teardown();
    const plan = await start('/plan');
    expect(text(plan)).toContain('Your 3-Dish Weekend Meal Prep Plan');
    expect(text(plan)).not.toContain('Sort by:');
    await plan.teardown();
    const pantry = await start('/pantry');
    expect(pantry.container.querySelector('#virtual-pantry-title')).not.toBeNull();
    expect(text(pantry)).not.toContain('Sort by:');
  });

  it('keeps the chrome around every page: the header and the navigation', async () => {
    for (const [path, screen] of [['/shop', 'Shop'], ['/plan', 'Plan'], ['/pantry', 'Pantry']] as const) {
      const h = await start(path);
      // Each screen has a visually hidden h1 with its name (spec 6a); the brand is not a heading.
      expect(h.container.querySelector('h1')?.textContent).toBe(screen);
      expect(h.container.querySelector('h1')?.className).toContain('sr-only');
      expect(h.container.querySelector('header')?.textContent).toContain('PantryBot');
      expect(h.link('Shop')).toBeDefined();
      expect(h.link('Pantry')).toBeDefined();
      expect(h.link('Plan')).toBeDefined();
      await h.teardown();
    }
  });
});

describe('the shell frame (M4-1b)', () => {
  it('opts the app into the design tokens after mount (data-ds on <html>) and out again when it unmounts', async () => {
    expect(document.documentElement.hasAttribute('data-ds')).toBe(false);
    const h = await start('/shop');
    expect(document.documentElement.hasAttribute('data-ds')).toBe(true);
    await h.teardown();
    expect(document.documentElement.hasAttribute('data-ds')).toBe(false);
  });

  it('has a slim header padded for the status bar, and no site footer on the app screens', async () => {
    for (const path of ['/shop', '/plan', '/pantry']) {
      const h = await start(path);
      const header = h.container.querySelector('header')!;
      expect(header.className).toContain('pt-[env(safe-area-inset-top)]');
      expect(header.className).toContain('bg-surface');
      expect(header.querySelectorAll('button').length).toBe(0);
      expect(header.querySelectorAll('a').length).toBe(1); // the account avatar, a link to Settings
      expect(h.container.querySelector('footer')).toBeNull();
      await h.teardown();
    }
  });

  it('puts the ZIP, alerts and store controls in the page, not in the sticky header', async () => {
    const h = await start('/shop');
    const header = h.container.querySelector('header')!;
    const zip = h.container.querySelector('button[title="Click to change your ZIP code"]')!;
    expect(zip).not.toBeNull();
    expect(header.contains(zip)).toBe(false);
    expect(h.container.querySelector('main')!.contains(zip)).toBe(true);
  });
});

describe('links', () => {
  it('are real links to the module paths', async () => {
    const h = await start('/shop');
    expect(h.link('Shop').getAttribute('href')).toBe('/shop');
    expect(h.link('Deals').getAttribute('href')).toBe('/shop');
    expect(h.link(MEAL_PLAN).getAttribute('href')).toBe('/plan');
    expect(h.link(LIST).getAttribute('href')).toBe('/shop');
    expect(h.link(RADAR).getAttribute('href')).toBe('/shop');
    expect(h.link('Pantry').getAttribute('href')).toBe('/pantry');
  });

  it('navigate without a reload, changing the page and the path', async () => {
    const h = await start('/shop');
    await h.click(h.link(MEAL_PLAN));
    expect(h.path()).toBe('/plan');
    expect(text(h)).toContain('Your 3-Dish Weekend Meal Prep Plan');
    await h.openShopView('Deals');
    expect(h.path()).toBe('/shop');
    expect(text(h)).toContain('Sort by:');
    expect(h.pushes).toEqual(['/plan', '/shop']);
  });

  it('switch Shop views without a navigation, only a change of module pushes a path', async () => {
    const h = await start('/shop');
    await h.openShopView('Trip');
    expect(text(h)).toContain('Print Checklist');
    await h.openShopView('Radar');
    expect(text(h)).toContain('Predictive 6-Week Cycle Signals');
    expect(h.pushes).toEqual([]);
    expect(h.path()).toBe('/shop');
  });

  it('take over a plain click, so the browser does not reload the page', async () => {
    const h = await start('/shop');
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    await act(async () => { h.link(MEAL_PLAN).dispatchEvent(event); await h.settle(); });
    expect(event.defaultPrevented).toBe(true);
    expect(h.path()).toBe('/plan');
  });

  it('leave a modified or non-primary click to the browser (a new tab, a copy)', async () => {
    const h = await start('/shop');
    const link = h.link(MEAL_PLAN);
    for (const init of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }]) {
      const event = new MouseEvent('click', { bubbles: true, cancelable: true, ...init });
      await act(async () => { link.dispatchEvent(event); await h.settle(); });
      expect(event.defaultPrevented).toBe(false);
    }
    expect(h.pushes).toEqual([]);
    expect(h.path()).toBe('/shop');
  });
});

describe('the last-used module cookie', () => {
  it('remembers the module on every change, the name only', async () => {
    const h = await start('/shop');
    expect(cookie()).toBe('pantrybot_last_module=shop');
    await h.click(h.link(MEAL_PLAN));
    expect(cookie()).toBe('pantrybot_last_module=plan');
    await h.click(h.link('Pantry'));
    expect(cookie()).toBe('pantrybot_last_module=pantry');
    expect(document.cookie).not.toMatch(/alice|@|guest/);
  });

  it('is written on a direct visit to a module too', async () => {
    await start('/plan');
    expect(cookie()).toBe('pantrybot_last_module=plan');
  });
});

describe('state survives moving between modules (the provider is in the layout)', () => {
  it('keeps pins, batch size and a half-typed AI request', async () => {
    const h = await start('/shop');
    await h.click([...h.container.querySelectorAll('button')].find((b) => /Pin to Prep/.test(b.textContent ?? ''))!);
    expect(text(h)).toContain('1 Pinned');
    await h.click(h.link(MEAL_PLAN));
    await h.click([...h.container.querySelectorAll('button')].find((b) => b.textContent?.includes('8 Srv / Dish'))!);
    await h.type(promptInput(h), 'half-typed soup');
    await h.openShopView('Deals');
    expect(text(h)).toContain('1 Pinned');
    await h.click(h.link(MEAL_PLAN));
    expect(promptInput(h).value).toBe('half-typed soup');
    expect([...h.container.querySelectorAll('button')].find((b) => b.textContent?.includes('8 Srv / Dish'))!.className).toContain('bg-emerald-400');
  });

  it('applies a refetch that is still in flight when the user moves to another module', async () => {
    let release: (response: Response) => void = () => undefined;
    const gate = new Promise<Response>((resolve) => { release = resolve; });
    const h = await start('/plan', (input) => (input.startsWith('/api/dashboard?') && input.includes('zip=80999') ? gate : undefined));
    await h.click([...h.container.querySelectorAll('button')].find((b) => b.textContent?.includes('High-Protein'))!); // a refetch is started
    // A held ZIP refetch, started from the header and still in flight while the user moves on.
    await h.click(h.container.querySelector<HTMLElement>('button[title="Click to change your ZIP code"]')!);
    await h.type(h.container.querySelector<HTMLInputElement>('input[placeholder^="e.g. 80542"]')!, '80999');
    await h.click([...h.container.querySelectorAll('button')].find((b) => b.textContent?.includes('Update Location'))!);
    await h.waitUntil(() => dashboardRequests(h).some((r) => r.url.includes('zip=80999')));
    await h.openShopView('Deals');
    expect(h.path()).toBe('/shop');
    release(Response.json({ ...payload, zipCode: '80999' }));
    await h.waitUntil(() => text(h).includes('(80999)'));
  });
});
