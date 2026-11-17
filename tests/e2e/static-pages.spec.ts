import type { Page } from '@playwright/test';
import { expect, test } from './support/fixtures';

// Journey 6: static and public pages load, have one h1, pass axe and do not scroll sideways.
// Swagger UI renders after load; axe must wait for it or the findings change from run to run.
const swaggerReady = async (page: Page) => {
  await page.locator('.swagger-ui .opblock').first().waitFor({ timeout: 20_000 });
  await page.waitForLoadState('networkidle');
};

const pages: Array<{ path: string; screen: string; heading: RegExp; ready?: (page: Page) => Promise<void> }> = [
  { path: '/privacy', screen: 'privacy', heading: /Privacy/i },
  { path: '/terms', screen: 'terms', heading: /Terms/i },
  { path: '/docs', screen: 'docs', heading: /./, ready: swaggerReady },
  { path: '/data', screen: 'data', heading: /./ },
];

for (const { path, screen, heading, ready } of pages) {
  test(`6. ${path} loads cleanly`, async ({ page, a11y, problems }) => {
    void problems;
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 }).first()).toHaveText(heading);
    await ready?.(page);
    await a11y.check(screen);
    await a11y.noHorizontalScroll(screen);
  });
}
