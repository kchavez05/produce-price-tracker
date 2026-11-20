import { DashboardPage } from './pages/DashboardPage';
import { expect, test } from './support/fixtures';

// First-run setup (v2.0 M4-2b): a device that has never been set up opens /welcome once, the two steps save the ZIP, and
// Finish goes to Shop. Every other journey starts on a device that is already set up (support/fixtures.ts); this one opts out
// with firstRun. One journey with one page load: the browser matrix shares the app's per-IP rate limits (60 sync reads a
// minute), so extra loads here make the Chromium shard return 429s. The detection rule, Skip, each choice and the
// returning-user cases are pinned in Tier 1 (tests/unit/frontend/welcome.test.ts and first-run.test.ts).
test.use({ firstRun: true });

test.describe('onboarding: the first visit', () => {
  test('13. opens the welcome setup, saves the ZIP over two steps and goes to Shop, and Settings shows it', async ({ page, a11y, problems }) => {
    void problems;
    const home = new DashboardPage(page);
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: 'Where Do You Shop?' })).toBeVisible();
    await expect.poll(() => home.pathname).toBe('/welcome');
    await expect(page.getByRole('navigation', { name: 'Primary' })).toHaveCount(0); // no chrome around setup
    await a11y.check('welcome');
    await a11y.noHorizontalScroll('welcome');

    await page.getByLabel('ZIP code').fill('80202');
    const zipRequest = page.waitForResponse((r) => r.url().includes('/api/dashboard') && r.url().includes('zip=80202'));
    await page.getByRole('button', { name: 'Continue' }).click();
    expect((await zipRequest).ok()).toBe(true);
    await expect(page.getByRole('heading', { level: 1, name: 'Any Food Preferences?' })).toBeVisible();
    await a11y.check('welcome');
    await page.getByRole('button', { name: 'Finish' }).click();

    await expect.poll(() => home.pathname).toBe('/shop');
    await expect(home.zipButton).toContainText('(80202)');
    expect(await page.evaluate(() => localStorage.getItem('pantrybot_user_zip'))).toBe('80202'); // kept on the device
    expect(await page.evaluate(() => localStorage.getItem('pantrybot_setup_completed_v20'))).toBe('1');
    await home.openSettings();
    await expect(page.getByText('Denver, CO 80202')).toBeVisible();

    // Back does not return to the setup.
    await page.goBack();
    await expect.poll(() => home.pathname).toBe('/shop');
    await page.goBack();
    await expect.poll(() => home.pathname).not.toBe('/welcome');
  });
});
