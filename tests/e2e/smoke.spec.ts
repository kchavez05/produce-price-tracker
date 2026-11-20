import { validateBarcode } from '../../src/lib/barcodes/validation';
import { DashboardPage } from './pages/DashboardPage';
import { expect, test } from './support/fixtures';
import { stubBarcodeLookup } from './support/stubs';

// Tier 2 browser smoke journeys (spec section 5). Keyless guest, WebKit, iPhone and iPad portrait.
// Journeys assert today's behavior on the current UI; M3 must keep them green unchanged.

test.describe('smoke: home', () => {
  test('1. loads the header, ZIP control and price list with no console errors', async ({ page, a11y, problems }) => {
    void problems; // asserted empty by the fixture after the test
    const home = new DashboardPage(page);
    await home.goto();

    await expect(home.heading).toBeVisible();
    await expect(page.getByText('Mead / Longmont, CO · 6 stores')).toBeVisible();
    await expect(home.tab('Deals')).toBeVisible();
    expect(await home.priceCards.count()).toBeGreaterThan(3);
    await a11y.check('home');
    await a11y.noHorizontalScroll('home');

    // The Shop's status lines (M4-3a), in the same page load: a read-only location line that links to Settings, one freshness
    // line, and Details with the disclosure that estimates are not confirmed specials.
    await expect(page.getByText(/· 6 stores$/)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Change in Settings' })).toHaveAttribute('href', '/settings');
    await expect(page.getByText(/^Ad cycle .* updated \d{1,2}:\d{2} (AM|PM) MT/)).toBeVisible();
    await page.getByRole('button', { name: 'Details' }).click();
    const sheet = page.getByRole('dialog', { name: 'Price Data and Freshness' });
    await expect(sheet).toContainText('Estimates are not confirmed current specials; verify them with the store.');
    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();
  });

  test('2. changing ZIP and store filter reloads the price list', async ({ page, problems }) => {
    void problems;
    const home = new DashboardPage(page);
    await home.goto();

    // The ZIP is changed in Settings (the page-top ZIP chip is gone, M4-3a) and the store filter in the Shop's Filters sheet.
    const zipRequest = page.waitForResponse((r) => r.url().includes('/api/dashboard') && r.url().includes('zip=80202'));
    await home.openSettings();
    await home.locationRow.click();
    await page.getByRole('button', { name: 'Denver, CO (80202)' }).click();
    expect((await zipRequest).ok()).toBe(true);
    await expect(page.getByText('Denver, CO 80202')).toBeVisible();
    await page.getByRole('link', { name: 'Back' }).click();
    await expect.poll(() => home.pathname).toBe('/shop');

    const storeRequest = page.waitForResponse((r) => r.url().includes('/api/dashboard') && r.url().includes('store=ALDI'));
    await page.getByRole('button', { name: /^Filters/ }).click();
    await page.getByLabel('Store').selectOption('ALDI');
    expect((await storeRequest).ok()).toBe(true);
    await page.keyboard.press('Escape');
    expect(await home.priceCards.count()).toBeGreaterThan(3);
  });
});

test.describe('smoke: virtual pantry', () => {
  test('3a. adds an item by typed search, keeps it after reload, and stays private to this guest', async ({ page, newGuest, a11y, problems }) => {
    void problems;
    const home = new DashboardPage(page);
    await home.goto();
    expect(await home.pantryCount()).toBe(0);

    await home.openPantry();
    await page.getByPlaceholder('Try lentils, garlic, or rice').fill('olive');
    await page.getByRole('button', { name: 'Add Olive oil' }).click();
    await expect(page.getByText('Olive oil marked Yes.')).toBeVisible();
    await expect.poll(() => home.pantryCount()).toBe(1);
    await a11y.check('pantry');
    await a11y.noHorizontalScroll('pantry');

    // Ingredient Detail (M4-4b): the ingredient's name opens it at its own path. From 1024 px the list stays beside it and there is
    // no Back link; below that the detail is the screen, the list is hidden and Back returns to the Pantry.
    const search = page.getByPlaceholder('Try lentils, garlic, or rice');
    const wideScreen = (page.viewportSize()?.width ?? 0) >= 1024;
    await page.getByRole('link', { name: 'Olive oil' }).click();
    await expect.poll(() => home.pathname).toMatch(/^\/pantry\/item\//);
    const detail = page.getByRole('region', { name: 'Ingredient detail' });
    await expect(detail.getByRole('heading', { level: 2, name: 'Olive oil' })).toBeVisible();
    await a11y.check('pantry-detail');
    await a11y.noHorizontalScroll('pantry-detail');
    if (wideScreen) {
      await expect(search).toBeVisible();
      await expect(detail.getByRole('link', { name: 'Pantry' })).toBeHidden();
      await page.goBack();
    } else {
      await expect(search).toBeHidden();
      await detail.getByRole('link', { name: 'Pantry' }).click();
    }
    await expect.poll(() => home.pathname).toBe('/pantry');
    await expect(search).toBeVisible();

    // Stored entries are restored on the client after load, so wait for them rather than read once.
    await page.reload();
    await expect.poll(() => home.pantryCount()).toBe(1);

    // Session isolation (AGENTS.md section 4): a second guest never sees the first guest's pantry.
    // Open the panel and wait for its load to finish so an empty result is not just "not loaded yet".
    const otherPage = await newGuest();
    const other = new DashboardPage(otherPage);
    await other.goto();
    await other.openPantry();
    await expect(otherPage.getByText(/Saved on this device/)).toBeVisible();
    await expect(otherPage.getByText('Olive oil', { exact: true })).toHaveCount(0);
    expect(await other.pantryCount()).toBe(0);
  });

  test('3b. adds an item by typed barcode with the lookup boundary stubbed, only after confirmation', async ({ page, problems }) => {
    void problems;
    const code = '011110118134';
    const validation = validateBarcode(code);
    if (!validation.ok) throw new Error('fixture barcode must be valid');
    const requests = await stubBarcodeLookup(page, {
      status: 'FOUND',
      barcode: validation.barcode,
      product: {
        source: 'USDA_FDC_BRANDED', fdcId: '2533402', originalBarcode: code, description: 'EXTRA VIRGIN OLIVE OIL', brandName: 'KROGER',
        brandOwner: 'The Kroger Co.', packageLabel: '16.9 FL OZ/500 mL', marketCountry: 'United States', publicationDate: '2023-04-27',
        modifiedDate: '2023-04-01', availableDate: '2023-04-27', snapshotDate: '2026-10-29', sourceUrl: 'https://fdc.nal.usda.gov/food-details/2533402/branded',
      },
      suggestion: { ingredientId: 'olive-oil', ruleId: 'barcode-map-v1-fdc-2533402' },
    });
    const home = new DashboardPage(page);
    await home.goto();
    await home.openPantry();

    await page.getByRole('button', { name: 'Enter barcode' }).click();
    await page.getByLabel('Printed barcode digits').fill(code);
    await page.getByRole('button', { name: 'Look up product' }).click();
    await expect(page.getByText('Product: EXTRA VIRGIN OLIVE OIL')).toBeVisible();
    expect(requests).toHaveLength(1);
    expect(await home.pantryCount()).toBe(0); // nothing is written before confirmation

    await page.getByRole('button', { name: 'Confirm addition' }).click();
    await expect.poll(() => home.pantryCount()).toBe(1);
  });
});

test.describe('smoke: account panel', () => {
  test('4. opens Settings and the account dialog without signing in, and guest pantry data remains', async ({ page, a11y, problems }) => {
    void problems; // also proves no sign-in request left the test server
    const home = new DashboardPage(page);
    await home.goto();
    await home.openPantry();
    await page.getByPlaceholder('Try lentils, garlic, or rice').fill('salt');
    await page.getByRole('button', { name: 'Add Salt' }).click();
    await expect.poll(() => home.pantryCount()).toBe(1);

    // The account dialog opens in place on the Settings page (the header avatar is a link to Settings since M4-2a) and must
    // not navigate: the path is the same after it closes.
    await home.openSettings();
    const pathBeforeDialog = new URL(page.url()).pathname;
    expect(pathBeforeDialog).toBe('/settings');
    await home.signInButton.click();
    await expect(page.getByRole('heading', { name: 'Sign In to Sync Your Virtual Pantry & Preferences' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in with Apple' })).toBeVisible();

    await page.getByRole('button', { name: 'Close account modal' }).click();
    await expect(page.getByRole('heading', { name: 'Sign In to Sync Your Virtual Pantry & Preferences' })).toBeHidden();
    expect(new URL(page.url()).pathname).toBe(pathBeforeDialog);
    expect(await home.pantryCount()).toBe(1);

    // The rest of Settings (M4-2a), in the same page load: its sections, accessibility, the theme control and Back. One journey
    // because the browser matrix shares the app's per-IP rate limits (60 sync reads a minute): an extra page load per project
    // here makes the Chromium shard return 429s.
    for (const section of ['Shopping', 'Meal Prep', 'Appearance', 'Account', 'About']) {
      await expect(page.getByRole('heading', { level: 2, name: section })).toBeVisible();
    }
    await a11y.check('settings');
    await a11y.noHorizontalScroll('settings');
    await page.getByRole('radio', { name: 'Dark' }).check();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(await page.evaluate(() => localStorage.getItem('pantrybot-theme'))).toBe('dark');
    await page.getByRole('radio', { name: 'System' }).check();
    await page.getByRole('link', { name: 'Back' }).click();
    await expect.poll(() => home.pathname).toBe('/pantry');
  });
});

test.describe('smoke: meal plan', () => {
  test('5. generates the keyless 3-dish plan, shopping list and cart bridge', async ({ page, a11y, problems }) => {
    void problems;
    const home = new DashboardPage(page);
    await home.goto();

    await home.tab('Plan').click();
    await expect(page.getByRole('heading', { level: 2, name: /Your 3-Dish Weekend Meal Prep Plan/ })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3 }).filter({ hasText: /Pork|Sausage|Chicken|Beef|Bean|Stew|Skillet/ }).first()).toBeVisible();
    await a11y.check('plan');
    await a11y.noHorizontalScroll('plan');

    await home.openShopView('Trip');
    await expect(page.getByRole('heading', { level: 2, name: 'Best plan' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: /ingredients to buy/ })).toBeAttached();
    await expect(page.getByRole('button', { name: 'Export to Notes' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Print Slip' })).toBeVisible();
    await a11y.check('shopping-list');
    await a11y.noHorizontalScroll('shopping-list');
  });
});

test.describe('smoke: keyboard', () => {
  test('7. tab order reaches the main controls and the tabs work by keyboard', async ({ page, problems }) => {
    void problems;
    const home = new DashboardPage(page);
    await home.goto();

    // Tab through the page and collect the header and page controls in the order they are reached: the account avatar in the
    // header first, then the Shop's location link and its Details button. The navigation (an icon rail before the header on
    // medium widths, a tab bar after the page on compact ones) is left out here and covered below.
    const wanted = (name: string) => name === 'Change in Settings' || name === 'Details' || name.startsWith('Account and settings');
    const controls: string[] = [];
    for (let i = 0; i < 12 && controls.length < 3; i++) {
      await page.keyboard.press('Tab');
      const name = await page.evaluate(() => document.activeElement?.getAttribute('title') ?? document.activeElement?.textContent?.trim() ?? '');
      if (wanted(name)) controls.push(name);
    }
    expect(controls).toEqual([
      expect.stringContaining('Account and settings'),
      'Change in Settings',
      'Details',
    ]);

    // The Pantry tab opens the Pantry by keyboard and the page puts focus on its heading; the Shop tab leaves it.
    await home.pantryButton.focus();
    await page.keyboard.press('Enter');
    await expect(home.pantryHeading).toBeFocused();
    await home.tab('Shop').focus();
    await page.keyboard.press('Enter');
    await expect(home.pantryHeading).toBeHidden();
    await expect.poll(() => home.pathname).toBe('/shop');
  });
});
