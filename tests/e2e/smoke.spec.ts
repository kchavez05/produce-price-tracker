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
    await expect(home.zipButton).toContainText('Mead / Longmont, CO (80542)');
    await expect(home.tab(/Value Board/)).toBeVisible();
    expect(await home.priceCards.count()).toBeGreaterThan(3);
    await a11y.check('home');
    await a11y.noHorizontalScroll('home');
  });

  test('2. changing ZIP and store filter reloads the price list', async ({ page, problems }) => {
    void problems;
    const home = new DashboardPage(page);
    await home.goto();

    const zipRequest = page.waitForResponse((r) => r.url().includes('/api/dashboard') && r.url().includes('zip=80202'));
    await home.zipButton.click();
    await page.getByRole('button', { name: 'Denver, CO (80202)' }).click();
    expect((await zipRequest).ok()).toBe(true);
    await expect(home.zipButton).toContainText('(80202)');

    const storeRequest = page.waitForResponse((r) => r.url().includes('/api/dashboard') && r.url().includes('store=ALDI'));
    await page.getByRole('button', { name: 'ALDI', exact: true }).click();
    expect((await storeRequest).ok()).toBe(true);
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
  test('4. opens and closes without signing in, and guest pantry data remains', async ({ page, problems }, testInfo) => {
    void problems; // also proves no sign-in request left the test server
    // Known defect (#544, removed by the M4 shell, #710): the header controls are wider than the 390 px
    // layout, so Chromium's mobile emulation shrinks the page to fit and the Sign In tap is intercepted
    // by the Pantry button. WebKit hides it. Marked as an expected failure so it cannot pass unnoticed:
    // when the header is fixed this test starts passing, which fails the run until this line is removed.
    // The click fails fast on that project: an expected failure must be a thrown error, because a test
    // that runs into its 30 s timeout is reported as timed out, not as an expected failure.
    const knownDefect = testInfo.project.name === 'iphone-chromium';
    test.fail(knownDefect, 'Sign In is not tappable in Chromium at 390 px (#544, #710)');
    const home = new DashboardPage(page);
    await home.goto();
    await home.openPantry();
    await page.getByPlaceholder('Try lentils, garlic, or rice').fill('salt');
    await page.getByRole('button', { name: 'Add Salt' }).click();
    await expect.poll(() => home.pantryCount()).toBe(1);

    await home.signInButton.click({ timeout: knownDefect ? 3_000 : undefined });
    await expect(page.getByRole('heading', { name: 'Sign In to Sync Your Virtual Pantry & Preferences' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in with Apple' })).toBeVisible();

    await page.getByRole('button', { name: 'Close account modal' }).click();
    await expect(page.getByRole('heading', { name: 'Sign In to Sync Your Virtual Pantry & Preferences' })).toBeHidden();
    expect(new URL(page.url()).pathname).toBe('/');
    expect(await home.pantryCount()).toBe(1);
  });
});

test.describe('smoke: meal plan', () => {
  test('5. generates the keyless 3-dish plan, shopping list and cart bridge', async ({ page, a11y, problems }) => {
    void problems;
    const home = new DashboardPage(page);
    await home.goto();

    await home.tab(/^2\. 3-Dish Meal Prep/).click();
    await expect(page.getByRole('heading', { level: 2, name: /Your 3-Dish Weekend Meal Prep Plan/ })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3 }).filter({ hasText: /Pork|Sausage|Chicken|Beef|Bean|Stew|Skillet/ }).first()).toBeVisible();
    await a11y.check('plan');
    await a11y.noHorizontalScroll('plan');

    await home.tab(/^3\. Shopping List/).click();
    await expect(page.getByRole('heading', { level: 3, name: /Deduplicated 3-Dish Shopping List/ })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: /Cart Bridge/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Print Checklist' })).toBeVisible();
    await a11y.check('shopping-list');
    await a11y.noHorizontalScroll('shopping-list');
  });
});

test.describe('smoke: keyboard', () => {
  test('7. tab order reaches the main controls and the pantry panel manages focus', async ({ page, problems }) => {
    void problems;
    const home = new DashboardPage(page);
    await home.goto();

    const reached: string[] = [];
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Tab');
      reached.push(await page.evaluate(() => document.activeElement?.getAttribute('title') ?? document.activeElement?.textContent?.trim() ?? ''));
    }
    expect(reached).toEqual([
      'Click to change your ZIP code',
      'Open Virtual Pantry',
      expect.stringContaining('Smart Push Notifications'),
      expect.stringContaining('Sign In with Google or Apple'),
    ]);

    await home.pantryButton.focus();
    await page.keyboard.press('Enter');
    await expect(home.pantryHeading).toBeFocused();

    await page.getByRole('button', { name: 'Close Virtual Pantry' }).focus();
    await page.keyboard.press('Enter');
    await expect(home.pantryHeading).toBeHidden();
    await expect(home.pantryButton).toBeFocused();
  });
});
