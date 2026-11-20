import type { Locator, Page } from '@playwright/test';
import { DashboardPage } from './pages/DashboardPage';
import { expect, test } from './support/fixtures';

// Visual snapshots (M2 item 4, spec section 6). Light theme, plus the Shop in dark since the shell adopted the tokens (M4-1b);
// the screens below the shell are not tokenized yet, so the dark Shop is half dark until M4-3a (M4 decision 18).
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

  test('shop home, dark', async ({ page, problems }) => {
    void problems;
    await page.emulateMedia({ colorScheme: 'dark' });
    const home = new DashboardPage(page);
    await home.goto();
    await expect(home.heading).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await snapshot(page, 'shop-home-dark');
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
    await home.tab('Plan').click();
    await expect(page.getByRole('heading', { level: 2, name: /Your 3-Dish Weekend Meal Prep Plan/ })).toBeVisible();
    await snapshot(page, 'meal-plan');
  });

  test('settings', async ({ page, problems }) => {
    void problems;
    const home = new DashboardPage(page);
    await home.goto();
    await home.openSettings();
    await snapshot(page, 'settings');
  });

  test('account panel', async ({ page, problems }) => {
    void problems;
    const home = new DashboardPage(page);
    await home.goto();
    await home.openSettings();
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

// The design system's own page, in both themes (full page: it is long, and nothing on it depends on
// the clock or the data, so it is the most stable snapshot we have). Needs the E2E_DESIGN_GUIDE=1
// build. Intentional primitive or token changes re-baseline these.
test.describe('visual: design guide', () => {
  for (const scheme of ['light', 'dark'] as const) {
    test(`design guide, ${scheme}`, async ({ page, problems }) => {
      void problems;
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto('/design');
      await expect(page.getByRole('heading', { level: 1, name: 'Design System' })).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('data-ds', '');
      await expect(page.locator('html')).toHaveAttribute('data-theme', scheme);
      await expect(page).toHaveScreenshot(`design-guide-${scheme}.png`, { fullPage: true });
    });
  }
});
