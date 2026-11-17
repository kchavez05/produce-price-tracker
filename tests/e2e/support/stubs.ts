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
