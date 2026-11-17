import type { Locator, Page } from '@playwright/test';
import { DashboardPage } from './pages/DashboardPage';
import { expect, test } from './support/fixtures';

// Visual snapshots (M2 item 4, spec section 6). Light theme only until M4 adopts the tokens.
// Baselines are generated only by CI (ubuntu-latest), never accepted from a developer machine:
// see the "Visual Baselines" workflow. The server clock is pinned; request timestamps are masked.

/**
 * Text that changes on every request or refresh, never with the layout: server timestamps with
 * seconds and data-source periods. Date-driven content (planning cycle, history windows, the
 * explorer's date range, the weekly plan) is not masked, because the visual server's clock is pinned
 * (see playwright.config.ts), so it is the same whenever CI runs.
 */
const DYNAMIC_TEXT = /Planning cycle|Refresh attempted|Page generated|USDA source|week ending|updated|Updated|\bago\b/;

function dynamicRegions(page: Page): Locator[] {
  return [page.locator('p, span, time, td, dd').filter({ hasText: DYNAMIC_TEXT })];
}

async function snapshot(page: Page, name: string): Promise<void> {
  await expect(page).toHaveScreenshot(`${name}.png`, { mask: dynamicRegions(page), maskColor: '#9ca3af' });
}

test.describe('visual: dashboard', () => {
  test('shop home', async ({ page, problems }) => {
    void problems;
    const home = new DashboardPage(page);
    await home.goto();
    await expect(home.heading).toBeVisible();
    await snapshot(page, 'shop-home');
  });

  test('pantry empty and with items', async ({ page, problems }) => {
    void problems;
    const home = new DashboardPage(page);
    await home.goto();
    await home.openPantry();
    await expect(page.getByText(/Saved on this device/)).toBeVisible();
    await snapshot(page, 'pantry-empty');

    for (const [query, label] of [['olive', 'Add Olive oil'], ['salt', 'Add Salt']] as const) {
      await page.getByPlaceholder('Try lentils, garlic, or rice').fill(query);
      await page.getByRole('button', { name: label }).click();
    }
    await expect.poll(() => home.pantryCount()).toBe(2);
    await snapshot(page, 'pantry-with-items');
  });

  test('meal plan', async ({ page, problems }) => {
    void problems;
    const home = new DashboardPage(page);
    await home.goto();
    await home.tab(/^2\. 3-Dish Meal Prep/).click();
    await expect(page.getByRole('heading', { level: 2, name: /Your 3-Dish Weekend Meal Prep Plan/ })).toBeVisible();
    await snapshot(page, 'meal-plan');
  });

  test('account panel', async ({ page, problems }) => {
    void problems;
    const home = new DashboardPage(page);
    await home.goto();
    await home.signInButton.click();
    await expect(page.getByRole('heading', { name: 'Sign In to Sync Your Virtual Pantry & Preferences' })).toBeVisible();
    await snapshot(page, 'account-panel');
  });
});

test.describe('visual: data explorer', () => {
  test('explorer landing', async ({ page, problems }) => {
    void problems;
    await page.goto('/data');
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    await page.waitForLoadState('networkidle');
    await snapshot(page, 'data-explorer');
  });
});
