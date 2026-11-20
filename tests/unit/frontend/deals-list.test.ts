// @vitest-environment jsdom
// The Deals list (v2.0 M4-3a, wireframe Shop): 12 deals at a time with "Show 12 more", one Stock-Up Alert for the deepest
// discount, the quiet "Have it" toggle, the empty state, and the "could not update prices" banner with Try again. Through the
// in-memory router.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDashboardHarness, keylessPayload, type DashboardHarness, type FetchHandler } from 'tests/helpers/dashboard-harness';
import { expectNoA11yViolations } from 'tests/helpers/render';

const payload = keylessPayload();
let harness: DashboardHarness | undefined;
afterEach(async () => { await harness?.teardown(); harness = undefined; vi.restoreAllMocks(); });

async function start(options: { payload?: typeof payload; onFetch?: FetchHandler } = {}) {
  harness = await createDashboardHarness({ payload: options.payload ?? payload, onFetch: options.onFetch });
  await harness.mount({ initialPath: '/shop' });
  return harness;
}
const cards = (h: DashboardHarness) => h.container.querySelectorAll('article');
const buttons = (h: DashboardHarness) => [...h.container.querySelectorAll('button')];
const text = (h: DashboardHarness) => h.container.textContent ?? '';
const dashboardRequests = (h: DashboardHarness) => h.requests.filter((r) => r.url.startsWith('/api/dashboard?'));

describe('paging', () => {
  it('shows 12 deals first, says how many there are, and offers the next page', async () => {
    const h = await start();
    const total = payload.commodities.length;
    expect(total).toBeGreaterThan(24);
    expect(cards(h)).toHaveLength(12);
    expect(text(h)).toContain(`Showing 12 of ${total} deals`);
    expect(h.button('Show 12 more')).toBeDefined();
  });

  it('adds a page at a time and stops offering more when all are shown', async () => {
    const h = await start();
    const total = payload.commodities.length;
    await h.click(h.button('Show 12 more'));
    expect(cards(h)).toHaveLength(24);
    await h.click(h.button(`Show ${Math.min(12, total - 24)} more`));
    expect(cards(h)).toHaveLength(total);
    expect(text(h)).toContain(`Showing ${total} of ${total} deals`);
    expect(buttons(h).some((b) => /^Show \d+ more$/.test(b.textContent ?? ''))).toBe(false);
  });

  it('starts again at the first page when the category changes, but not when a deal is pinned', async () => {
    const h = await start();
    await h.click(h.button('Show 12 more'));
    expect(cards(h)).toHaveLength(24);
    await h.click(buttons(h).find((b) => /^Pin to Prep$/.test(b.textContent ?? ''))!);
    expect(h.state().pinnedIds).toHaveLength(1);
    expect(cards(h)).toHaveLength(24);
    await h.click(h.button('Produce'));
    const produce = payload.commodities.filter((c) => c.ingredient.category === 'PRODUCE').length;
    expect(cards(h)).toHaveLength(Math.min(12, produce));
    await h.click(h.button('All'));
    expect(cards(h)).toHaveLength(12);
  });
});

describe('the card', () => {
  it('shows the headline, with the rest behind Details', async () => {
    const h = await start();
    const card = cards(h)[0];
    expect(card.querySelector('h3')!.textContent).toBeTruthy();
    expect(card.textContent).toMatch(/\$\d+\.\d{2}/);
    const details = card.querySelector('details')!;
    expect(details.open).toBe(false);
    expect(details.querySelector('summary')!.textContent).toContain('Details');
    expect(details.textContent).toMatch(/Value \d+\/100/);
    expect(details.textContent).toContain('USDA wholesale');
  });

  it('marks Have it as pressed, keeping its name, and flips it back', async () => {
    const h = await start();
    const toggle = () => cards(h)[2].querySelector<HTMLButtonElement>('button[aria-pressed]')!;
    expect(toggle().textContent).toBe('Have it');
    expect(toggle().getAttribute('aria-pressed')).toBe('false');
    await h.click(toggle());
    expect(toggle().getAttribute('aria-pressed')).toBe('true');
    expect(toggle().textContent).toBe('Have it');
    await h.click(toggle());
    expect(toggle().getAttribute('aria-pressed')).toBe('false');
  });

  it('keeps Pin to Prep as the card\'s primary action and says Pinned afterwards', async () => {
    const h = await start();
    const pin = () => [...cards(h)[0].querySelectorAll('button')].find((b) => /^Pin to Prep$|^Pinned$/.test(b.textContent ?? ''))!;
    expect(pin().textContent).toBe('Pin to Prep');
    await h.click(pin());
    expect(pin().textContent).toBe('Pinned');
  });

  it('has no accessibility violations on the list', async () => {
    const h = await start();
    // The page content only: in jsdom every navigation variant is displayed (no CSS), which axe would flag as duplicate landmarks.
    await expectNoA11yViolations(h.container.querySelector('main')!);
  });
});

describe('the Stock-Up Alert', () => {
  const [first, second, ...rest] = payload.commodities;
  const alertPayload = { ...payload, splurgeAlerts: [{ ...first, discountVsRegularPct: 30 }, { ...second, discountVsRegularPct: 54 }], commodities: [first, second, ...rest] };

  it('is one card for the deepest discount', async () => {
    const h = await start({ payload: alertPayload });
    const alert = h.container.querySelector('section[aria-labelledby="stock-up-alert"]')!;
    expect(alert.querySelector('h2')!.textContent).toBe('Stock-Up Alert');
    expect(alert.textContent).toContain('-54% off');
    expect(alert.textContent).toContain(second.ingredient.name);
    expect(alert.textContent).not.toContain(first.ingredient.name);
  });

  it('is absent when there are no stock-up deals', async () => {
    const h = await start();
    expect(h.container.querySelector('section[aria-labelledby="stock-up-alert"]')).toBeNull();
  });
});

describe('the empty state', () => {
  const noDeals = { ...payload, commodities: [] as typeof payload.commodities, splurgeAlerts: [] };

  it('says nothing matches and points to Settings, with no paging text', async () => {
    const h = await start({ payload: noDeals });
    expect(text(h)).toContain('No deals to show');
    expect(cards(h)).toHaveLength(0);
    expect(text(h)).not.toContain('Showing');
    const link = [...h.container.querySelectorAll('a')].find((a) => a.textContent === 'Open Settings')!;
    expect(link.getAttribute('href')).toBe('/settings');
  });

  it('offers to show all categories when a category is what left nothing', async () => {
    const onlyMeat = { ...payload, commodities: payload.commodities.filter((c) => c.ingredient.category !== 'PRODUCE') };
    const h = await start({ payload: onlyMeat });
    await h.click(h.button('Produce'));
    expect(text(h)).toContain('No deals to show');
    expect(text(h)).toContain('Nothing in this category');
    await h.click(h.button('Show all categories'));
    expect(h.button('All').getAttribute('aria-pressed')).toBe('true');
    expect(cards(h).length).toBeGreaterThan(0);
  });
});

describe('a failed refresh', () => {
  it('says the prices are the last ones, and Try again repeats the request and clears the message', async () => {
    let fail = true;
    const h = await start({ onFetch: (input) => (input.startsWith('/api/dashboard?') && fail ? Response.json({ error: 'no' }, { status: 500 }) : undefined) });
    expect(text(h)).not.toContain('Could not update prices');
    await h.setStoreFilter('ALDI');
    await h.waitUntil(() => text(h).includes('Could not update prices'));
    expect(h.container.querySelector('[role="alert"]')!.textContent).toContain('You are seeing the last prices we got.');
    const requests = dashboardRequests(h).length;
    fail = false;
    await h.click(h.button('Try again'));
    await h.waitUntil(() => dashboardRequests(h).length > requests);
    await h.waitUntil(() => !text(h).includes('Could not update prices'));
  });

  it('clears the message when a later request succeeds', async () => {
    let fail = true;
    const h = await start({ onFetch: (input) => (input.startsWith('/api/dashboard?') && fail ? Response.json({ error: 'no' }, { status: 500 }) : undefined) });
    await h.setStoreFilter('ALDI');
    await h.waitUntil(() => text(h).includes('Could not update prices'));
    fail = false;
    await h.setStoreFilter('ALL');
    await h.waitUntil(() => !text(h).includes('Could not update prices'));
  });
});
