import { DashboardPage } from './pages/DashboardPage';
import { expect, test } from './support/fixtures';
import { holdRequests } from './support/stubs';

// Module navigation journeys (M3 B.3d, spec acceptance criterion 9): each module is a page at its own URL, the links move
// between them without a reload, "/" opens the last-used module, and nothing the user has done is lost on the way: pins, the
// batch size, a half-typed AI request, and a refetch still in flight. Keyless guest, as the other journeys.

declare global {
  interface Window { __navigationMarker?: number }
}

test.describe('navigation: modules are pages', () => {
  test('8. links move between /shop, /plan and /pantry without a reload, and Back, Forward and reload keep up', async ({ page, problems }) => {
    void problems;
    const home = new DashboardPage(page);
    await home.goto();
    expect(home.pathname).toBe('/shop'); // "/" opens Shop on a first visit
    // A reload would clear this marker: the links must navigate in place.
    await page.evaluate(() => { window.__navigationMarker = 1; });

    await home.tab('Plan').click();
    await expect(home.planHeading).toBeVisible();
    expect(home.pathname).toBe('/plan');

    await home.pantryButton.click();
    await home.pantryHeading.waitFor();
    expect(home.pathname).toBe('/pantry');

    await page.goBack();
    await expect(home.planHeading).toBeVisible();
    expect(home.pathname).toBe('/plan');
    await page.goBack();
    await expect(home.tab('Deals')).toBeVisible();
    await expect.poll(() => home.pathname).toBe('/shop');
    await expect(page.getByRole('group', { name: 'Category' })).toBeVisible();
    await page.goForward();
    await expect(home.planHeading).toBeVisible();
    expect(home.pathname).toBe('/plan');
    expect(await page.evaluate(() => window.__navigationMarker)).toBe(1);

    // A reload stays on the module (the URL says where you are).
    const hydrated = page.waitForResponse((response) => response.url().includes('/api/sync'));
    await page.reload();
    await hydrated;
    await expect(home.planHeading).toBeVisible();
    expect(home.pathname).toBe('/plan');
  });

  test('9. the Shop tab returns to the Shop view the user left, and the Pantry has no Close button', async ({ page, problems }) => {
    void problems;
    const home = new DashboardPage(page);
    await home.goto();

    // Deal Detail (M4-3a): a card's name opens the deal at its own path. From 1024 px the list stays beside it and there is no
    // Back link; below that the detail is the screen, the list is hidden and Back returns to the Deals.
    const wideScreen = (page.viewportSize()?.width ?? 0) >= 1024;
    const cardName = page.locator('article h3 a').first();
    const dealName = (await cardName.textContent())!.trim();
    await cardName.click();
    await expect.poll(() => home.pathname).toMatch(/^\/shop\/deal\//);
    const detail = page.getByRole('region', { name: 'Deal detail' });
    await expect(detail.getByRole('heading', { level: 2, name: dealName })).toBeVisible();
    if (wideScreen) {
      await expect(cardName).toBeVisible();
      await expect(detail.getByRole('link', { name: 'Deals' })).toBeHidden();
      await page.goBack();
    } else {
      await expect(cardName).toBeHidden();
      await detail.getByRole('link', { name: 'Deals' }).click();
    }
    await expect.poll(() => home.pathname).toBe('/shop');
    await expect(cardName).toBeVisible();

    await home.tab('Radar').click();
    await expect(page.getByRole('group', { name: 'Category' })).toBeHidden();
    await home.tab('Plan').click();
    await expect(home.planHeading).toBeVisible();
    await home.openPantry();
    await expect(page.getByRole('button', { name: 'Close Virtual Pantry' })).toHaveCount(0);
    await expect(home.tab('Shop')).not.toHaveAttribute('aria-current', 'page');
    await home.tab('Shop').click();
    await expect.poll(() => home.pathname).toBe('/shop');
    await expect(home.tab('Radar')).toHaveAttribute('aria-current', 'page');
  });

  test('10. "/" opens the last-used module, and Shop for a first visit', async ({ page, newGuest, problems }) => {
    void problems;
    const home = new DashboardPage(page);
    await home.goto();
    await home.tab('Plan').click();
    await expect(home.planHeading).toBeVisible();
    // The module is remembered by an effect after the page shows, so wait for the cookie before leaving for "/".
    const moduleCookie = async () => (await page.context().cookies()).find((cookie) => cookie.name === 'pantrybot_last_module')?.value;
    await expect.poll(moduleCookie).toBe('plan');

    const hydrated = page.waitForResponse((response) => response.url().includes('/api/sync'));
    await page.goto('/');
    await hydrated;
    await expect(home.planHeading).toBeVisible();
    expect(home.pathname).toBe('/plan');
    expect(await moduleCookie()).toBe('plan'); // the module name only

    const other = new DashboardPage(await newGuest());
    await other.goto();
    expect(other.pathname).toBe('/shop');
  });
});

test.describe('navigation: Settings is not a tab', () => {
  test('12. Back returns to the tab the user came from, and "/" never opens Settings', async ({ page, problems }) => {
    void problems;
    const home = new DashboardPage(page);
    await home.goto();
    await home.tab('Plan').click();
    await expect(home.planHeading).toBeVisible();
    const moduleCookie = async () => (await page.context().cookies()).find((cookie) => cookie.name === 'pantrybot_last_module')?.value;
    await expect.poll(moduleCookie).toBe('plan');

    await home.openSettings();
    expect(home.pathname).toBe('/settings');
    // No tab is current on Settings, and it is not remembered as the last-used module.
    await expect(page.locator('a[aria-current="page"]:visible')).toHaveCount(1); // the avatar only
    expect(await moduleCookie()).toBe('plan');

    await page.getByRole('link', { name: 'Back' }).click();
    await expect(home.planHeading).toBeVisible();
    expect(home.pathname).toBe('/plan');

    await home.openSettings();
    const hydrated = page.waitForResponse((response) => response.url().includes('/api/sync'));
    await page.goto('/');
    await hydrated;
    expect(home.pathname).toBe('/plan');
  });
});

test.describe('navigation: nothing is lost when switching module mid-edit', () => {
  test('11. pins, the batch size, a half-typed AI request and a refetch in flight all survive', async ({ page, problems }) => {
    void problems;
    const home = new DashboardPage(page);
    await home.goto();

    // Pin an ingredient on the Board (its button turns to "Pinned"; the header count is hidden on a phone).
    await page.getByRole('button', { name: /Pin to Prep/ }).first().click();
    await expect(page.getByRole('button', { name: /Pinned/ }).first()).toBeVisible();

    // On the plan: choose 8 servings per dish and start typing an AI request.
    await home.tab('Plan').click();
    await expect(home.planHeading).toBeVisible();
    await page.getByRole('button', { name: '8 Srv / Dish' }).click();
    await expect(page.getByRole('button', { name: '8 Srv / Dish' })).toHaveClass(/bg-emerald-400/);
    await home.aiRequest.fill('a half-typed request for spicy stews');

    // Start a refetch (a new ZIP) and hold its response, so it is still in flight while the user moves to the Pantry and back.
    const held = await holdRequests(page, '**/api/dashboard?*zip=80202*');
    await home.openSettings();
    await home.locationRow.click();
    await page.getByRole('button', { name: 'Denver, CO (80202)' }).click();
    await expect.poll(() => held.requests()).toBeGreaterThan(0);
    await home.pantryButton.click();
    await home.pantryHeading.waitFor();
    expect(home.pathname).toBe('/pantry');
    held.release();
    // The response was applied although its page is gone: Settings shows the new ZIP.
    await home.openSettings();
    await expect(page.getByText('Denver, CO 80202')).toBeVisible();

    // Back on the plan: the batch size and the request are as left. Back on the Board: the pin is still there.
    await home.tab('Plan').click();
    await expect(home.planHeading).toBeVisible();
    await expect(home.aiRequest).toHaveValue('a half-typed request for spicy stews');
    await expect(page.getByRole('button', { name: '8 Srv / Dish' })).toHaveClass(/bg-emerald-400/);
    await home.tab('Shop').click();
    await expect.poll(() => home.pathname).toBe('/shop');
    await expect(page.getByRole('button', { name: /Pinned/ }).first()).toBeVisible();
    expect(await home.priceCards.count()).toBeGreaterThan(3);
  });
});
