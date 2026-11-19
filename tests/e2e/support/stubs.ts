import type { Page, Route } from '@playwright/test';

/** Fixed instant for client-side dates. Timers keep running; only Date is pinned. */
export const FIXED_NOW = new Date('2026-11-16T12:00:00Z');

export async function freezeDate(page: Page): Promise<void> {
  await page.clock.setFixedTime(FIXED_NOW);
}

/** The Analytics script only exists on Vercel; an empty script keeps the console check strict. */
export async function stubAnalytics(page: Page): Promise<void> {
  await page.route('**/_vercel/insights/**', (route) => route.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
}

/**
 * Hold the responses of matching requests until `release()` is called, then let them through to the real server. The
 * request itself reaches the server only after the release, so a test can start a refetch, move around the app while it
 * is in flight, and check that its result is applied afterwards. `requests()` counts how many were held so far.
 */
export async function holdRequests(page: Page, url: string): Promise<{ release: () => void; requests: () => number }> {
  let release: () => void = () => undefined;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  let seen = 0;
  await page.route(url, async (route: Route) => {
    seen += 1;
    await gate;
    await route.continue();
  });
  return { release: () => release(), requests: () => seen };
}

/**
 * Stub the barcode lookup HTTP boundary (real lookups need server data and a verified shared
 * limiter). Returns the captured request bodies so a test can assert what was sent.
 */
export async function stubBarcodeLookup(page: Page, body: unknown, status = 200): Promise<unknown[]> {
  const requests: unknown[] = [];
  await page.route('**/api/pantry/barcode-lookup', async (route: Route) => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  });
  return requests;
}
