// @vitest-environment jsdom
// The Shop's status lines and Filters sheet (v2.0 M4-3a, wireframes Shop and Shop Loading): a read-only location line that
// links to Settings, one freshness line with Details (the freshness disclosure, #828), "Updating prices…" while a refetch is
// in flight, the Trip count, and the store filter and sort behind a Filters button. Through the in-memory router.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { ALL_STORE_CHAINS } from '@/data/store-registry';
import { createDashboardHarness, keylessPayload, type DashboardHarness, type FetchHandler } from 'tests/helpers/dashboard-harness';

const payload = keylessPayload();
let harness: DashboardHarness | undefined;
afterEach(async () => { await harness?.teardown(); harness = undefined; vi.restoreAllMocks(); });

async function start(onFetch?: FetchHandler, initialPath = '/shop') {
  harness = await createDashboardHarness({ payload, onFetch });
  await harness.mount({ initialPath });
  return harness;
}
const text = (h: DashboardHarness) => h.container.textContent ?? '';
const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]');
const dashboardRequests = (h: DashboardHarness) => h.requests.filter((r) => r.url.startsWith('/api/dashboard?'));
const section = (h: DashboardHarness) => h.container.querySelector('section[aria-label="Prices"]')!;
const select = (label: string) => {
  const field = [...document.querySelectorAll('label')].find((l) => l.textContent === label)!;
  return document.querySelector<HTMLSelectElement>(`#${field.htmlFor}`)!;
};
async function choose(h: DashboardHarness, element: HTMLSelectElement, value: string) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')!.set!.call(element, value);
    element.dispatchEvent(new Event('change', { bubbles: true }));
    await h.settle();
  });
}
/** A dashboard response that stays pending until released, so a test can look at the screen while a refetch is in flight. */
function heldDashboard() {
  const releases: Array<() => void> = [];
  const onFetch: FetchHandler = (input) => (input.startsWith('/api/dashboard?')
    ? new Promise<Response>((resolve) => { releases.push(() => resolve(Response.json(payload))); })
    : undefined);
  return {
    onFetch,
    /** Answer the oldest pending request only. */
    releaseOne: () => releases.shift()?.(),
    releaseAll: () => releases.splice(0).forEach((release) => release()),
    pending: () => releases.length,
  };
}

describe('the location line', () => {
  it('is read-only: the city and the store count, with a link to Settings', async () => {
    const h = await start();
    const header = section(h);
    expect(header.textContent).toContain(`${payload.cityLabel} · 6 stores`);
    expect(header.querySelector('input, select')).toBeNull();
    const link = [...header.querySelectorAll('a')].find((a) => a.textContent === 'Change in Settings')!;
    expect(link.getAttribute('href')).toBe('/settings');
    await h.click(link);
    expect(h.path()).toBe('/settings');
  });

  it('says "1 store" for one store, not "1 stores"', async () => {
    harness = await createDashboardHarness({ payload, storage: { pantrybot_active_stores: JSON.stringify(['ALDI']) } });
    await harness.mount({ initialPath: '/shop' });
    await harness.waitUntil(() => section(harness!).textContent?.includes('· 1 store') === true);
    expect(section(harness).textContent).toContain('· 1 store');
    expect(section(harness).textContent).not.toContain('1 stores');
  });

  it('shows on every Shop view', async () => {
    const h = await start();
    for (const view of ['Trip', 'Radar'] as const) {
      await h.openShopView(view);
      expect(section(h).textContent).toContain('· 6 stores');
    }
  });

  it('is not on the other tabs', async () => {
    const h = await start(undefined, '/plan');
    expect(h.container.querySelector('section[aria-label="Prices"]')).toBeNull();
  });
});

describe('the freshness line and Details', () => {
  it('says the planning cycle, when the page was updated, and that some prices are estimates', async () => {
    const h = await start();
    const line = section(h).textContent!;
    expect(line).toContain(`Ad cycle ${payload.adCycleLabel}`);
    expect(line).toMatch(/updated \d{1,2}:\d{2} (AM|PM) MT/);
    expect(payload.freshness!.estimatedBestPrices).toBeGreaterThan(0);
    expect(line).toContain('some prices are estimates');
  });

  it('opens the full freshness information, including that estimates are not confirmed specials', async () => {
    const h = await start();
    expect(dialog()).toBeNull();
    await h.click(h.button('Details'));
    expect(dialog()?.getAttribute('aria-label') ?? dialog()?.textContent).toContain('Price Data and Freshness');
    expect(dialog()!.textContent).toContain('verified live prices');
    expect(dialog()!.textContent).toContain('Estimates are not confirmed current specials; verify them with the store.');
    expect(dialog()!.textContent).toContain('Refresh attempted:');
    expect(dialog()!.textContent).toContain('Flipp:');
  });

  it('closes again', async () => {
    const h = await start();
    await h.click(h.button('Details'));
    await h.click(document.querySelector<HTMLButtonElement>('[role="dialog"] button[aria-label="Close"]')!);
    expect(dialog()).toBeNull();
  });
});

describe('updating prices', () => {
  async function openStoreFilter(h: DashboardHarness) {
    await h.click(h.button('Filters'));
  }

  it('says "Updating prices…" while a refetch is in flight, marks the page busy, then returns to the freshness line', async () => {
    const held = heldDashboard();
    const h = await start(held.onFetch);
    expect(text(h)).not.toContain('Updating prices');
    expect(h.container.querySelector('[aria-busy="true"]')).toBeNull();
    await openStoreFilter(h);
    await choose(h, select('Store'), 'ALDI');
    await h.waitUntil(() => held.pending() > 0);
    expect(section(h).querySelector('[role="status"]')?.textContent).toBe('Updating prices…');
    expect(section(h).textContent).not.toContain('Ad cycle');
    expect(h.container.querySelector('[aria-busy="true"]')).not.toBeNull();
    await act(async () => { held.releaseAll(); await h.settle(); });
    await h.waitUntil(() => !text(h).includes('Updating prices'));
    expect(section(h).textContent).toContain('Ad cycle');
    expect(h.container.querySelector('[aria-busy="true"]')).toBeNull();
  });

  it('stops after a failed request (an error status and a network failure)', async () => {
    for (const failure of [() => Response.json({ error: 'nope' }, { status: 500 }), () => { throw new Error('offline'); }]) {
      const h = await start((input) => (input.startsWith('/api/dashboard?') ? failure() : undefined));
      await openStoreFilter(h);
      await choose(h, select('Store'), 'ALDI');
      await h.waitUntil(() => dashboardRequests(h).length > 0);
      await h.waitUntil(() => !text(h).includes('Updating prices'));
      expect(h.container.querySelector('[aria-busy="true"]')).toBeNull();
      await h.teardown();
    }
  });

  it('stays on until the last of several overlapping requests finishes', async () => {
    const held = heldDashboard();
    const h = await start(held.onFetch);
    await openStoreFilter(h);
    await choose(h, select('Store'), 'ALDI');
    await choose(h, select('Store'), 'ALL');
    await h.waitUntil(() => held.pending() === 2);
    // The first answer does not end "updating": the second request is still in flight.
    await act(async () => { held.releaseOne(); await h.settle(); });
    expect(held.pending()).toBe(1);
    expect(text(h)).toContain('Updating prices…');
    await act(async () => { held.releaseOne(); await h.settle(); });
    await h.waitUntil(() => !text(h).includes('Updating prices'));
  });
});

describe('the Trip count', () => {
  it('shows how many items are on the trip, on the Trip link', async () => {
    const h = await start();
    const trip = [...h.container.querySelectorAll<HTMLAnchorElement>('nav[aria-label="Shop views"] a')].find((a) => a.textContent?.startsWith('Trip'))!;
    expect(trip.textContent).toMatch(/^Trip\d+$/);
    await h.click(trip);
    expect(h.container.textContent).toContain('Deduplicated 3-Dish Shopping List');
  });
});

describe('Filters', () => {
  it('opens a sheet with the store filter and the sort order on Deals', async () => {
    const h = await start();
    expect(h.button('Filters').textContent).toBe('Filters');
    await h.click(h.button('Filters'));
    expect(dialog()?.textContent).toContain('Store');
    expect(select('Store').value).toBe('ALL');
    expect(select('Sort by').value).toBe('VALUE_SCORE');
    expect([...select('Store').options].map((o) => o.value)).toEqual(['ALL', ...ALL_STORE_CHAINS]);
  });

  it('filters by store through the same action as before (a refetch for that store) and counts it on the button', async () => {
    const h = await start();
    await h.click(h.button('Filters'));
    await choose(h, select('Store'), 'ALDI');
    await h.waitUntil(() => dashboardRequests(h).some((r) => r.url.includes('store=ALDI')));
    expect(h.button('Filters').textContent).toBe('Filters (1)');
  });

  it('sorts the Deals through the same state as before and counts it on the button', async () => {
    const h = await start();
    await h.click(h.button('Filters'));
    await choose(h, select('Sort by'), 'LOWEST_PRICE');
    expect(select('Sort by').value).toBe('LOWEST_PRICE');
    expect(h.button('Filters').textContent).toBe('Filters (1)');
  });

  it('offers no sort order on the Trip and Radar views, where it does not apply, but still the store', async () => {
    const h = await start();
    await h.openShopView('Trip');
    await h.click(h.button('Filters'));
    expect(select('Store')).toBeDefined();
    expect([...document.querySelectorAll('label')].some((l) => l.textContent === 'Sort by')).toBe(false);
  });
});
