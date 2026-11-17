import { DashboardPage } from './pages/DashboardPage';
import { expect, test } from './support/fixtures';
import { FIXED_NOW, stubBarcodeLookup } from './support/stubs';

// Self-tests for the support layer (fixtures, stubs, clock, axe helper). Journeys live elsewhere.
test.describe('support layer', () => {
  test('pins Date to the fixed instant while timers keep running', async ({ page, problems }) => {
    void problems;
    await page.goto('/');
    expect(await page.evaluate(() => new Date().toISOString())).toBe(FIXED_NOW.toISOString());
    expect(await page.evaluate(() => new Promise<boolean>((resolve) => setTimeout(() => resolve(true), 50)))).toBe(true);
  });

  test('newGuest opens a separate context with its own cookie jar and the same guards', async ({ page, newGuest, baseURL, problems }) => {
    void problems;
    const other = await newGuest();
    expect(other.context()).not.toBe(page.context());
    await page.context().addCookies([{ name: 'probe', value: '1', url: baseURL! }]);
    expect((await other.context().cookies(baseURL!)).map((cookie) => cookie.name)).not.toContain('probe');
    await new DashboardPage(other).goto();
    await expect(new DashboardPage(other).heading).toBeVisible();
  });

  test('stubs the barcode lookup boundary and records the request', async ({ page, problems }) => {
    void problems;
    const requests = await stubBarcodeLookup(page, { status: 'NOT_FOUND' });
    await page.goto('/');
    const response = await page.evaluate(async () => {
      const result = await fetch('/api/pantry/barcode-lookup', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code: '011110118134' }) });
      return result.json();
    });
    expect(response).toEqual({ status: 'NOT_FOUND' });
    expect(requests).toEqual([{ code: '011110118134' }]);
  });

  test('axe helper passes clean markup and fails an unlisted serious violation', async ({ page, a11y, problems }) => {
    void problems;
    await page.setContent('<!doctype html><html lang="en"><head><title>Synthetic</title></head><body><main><h1>Clean</h1><img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="dot"></main></body></html>');
    await a11y.check('synthetic-clean');
    await page.setContent('<!doctype html><html lang="en"><head><title>Synthetic</title></head><body><main><h1>Bad</h1><img src="data:image/gif;base64,R0lGODlhAQABAAAAACw="></main></body></html>');
    await expect(a11y.check('synthetic-bad')).rejects.toThrow(/new problem on "synthetic-bad".*image-alt/);
  });

  test('overflow helper detects a page wider than the viewport', async ({ page, a11y, problems }) => {
    void problems;
    await page.setContent('<main><h1>Fits</h1></main>');
    await a11y.noHorizontalScroll('synthetic-fit');
    await page.setContent('<main><div style="width:3000px">wide</div></main>');
    await expect(a11y.noHorizontalScroll('synthetic-wide')).rejects.toThrow(/horizontal-scroll/);
  });
});
