import type { Page } from '@playwright/test';
import { expect, test } from './support/fixtures';

// Journey 6: static and public pages load, have one h1, pass axe and do not scroll sideways.
// Swagger UI renders after load and in stages: the operation blocks and the servers select
// (#servers, which axe reports as select-name) can appear at different times on a slow runner.
// Axe must wait for both or its findings change from run to run.
const swaggerReady = async (page: Page) => {
  await page.locator('.swagger-ui .opblock').first().waitFor({ timeout: 20_000 });
  await page.locator('.swagger-ui select#servers').waitFor({ timeout: 20_000 });
  await page.waitForLoadState('networkidle');
};

// Swagger UI (swagger-ui-dist) is third-party and renders in stages, so its own markup is excluded
// from axe: its violations are not ours to allowlist, and whether axe sees them (for example the
// servers select's missing name) changed from run to run on CI. The page chrome we write is scanned.
const SWAGGER_UI = '.swagger-ui';

const pages: Array<{ path: string; screen: string; heading: RegExp; ready?: (page: Page) => Promise<void>; axeExclude?: string[] }> = [
  { path: '/privacy', screen: 'privacy', heading: /Privacy/i },
  { path: '/terms', screen: 'terms', heading: /Terms/i },
  { path: '/docs', screen: 'docs', heading: /./, ready: swaggerReady, axeExclude: [SWAGGER_UI] },
  { path: '/data', screen: 'data', heading: /./ },
];

for (const { path, screen, heading, ready, axeExclude } of pages) {
  test(`6. ${path} loads cleanly`, async ({ page, a11y, problems }) => {
    void problems;
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 }).first()).toHaveText(heading);
    await ready?.(page);
    await a11y.check(screen, { exclude: axeExclude });
    await a11y.noHorizontalScroll(screen);
  });
}

// The Data Explorer's filters (M4-7b): below 760 px a summary row and a Filters sheet that stages and applies the filters together; from
// 760 px the inline bar, which applies each change at once. Both set the same URL parameters.
test('7. /data filters apply on narrow and wide screens', async ({ page, problems }) => {
  void problems;
  await page.goto('/data?mode=demo');
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  const narrow = (page.viewportSize()?.width ?? 0) <= 760;
  if (narrow) {
    await expect(page.getByRole('region', { name: 'Filters' })).toBeVisible();
    await expect(page.getByLabel('Market ZIP')).toBeHidden(); // the inline bar is not shown
    await page.getByRole('button', { name: 'Filters', exact: true }).click();
    const sheet = page.getByRole('dialog', { name: 'Filters' });
    await sheet.getByLabel('Market ZIP').fill('80301');
    await expect(page).not.toHaveURL(/zip=80301/); // staged, not applied
    await sheet.getByRole('button', { name: 'Apply' }).click();
    await expect(sheet).toBeHidden();
    await expect(page).toHaveURL(/zip=80301/);
    await expect(page.getByRole('region', { name: 'Filters' })).toContainText('ZIP 80301');
  } else {
    await expect(page.getByRole('region', { name: 'Filters' })).toBeHidden(); // the summary row is not shown
    const zip = page.getByLabel('Market ZIP');
    await expect(zip).toBeVisible();
    await zip.fill('80301');
    await zip.blur();
    await expect(page).toHaveURL(/zip=80301/);
  }
});
