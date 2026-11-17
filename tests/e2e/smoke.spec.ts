import { DashboardPage } from './pages/DashboardPage';
import { expect, test } from './support/fixtures';

test.describe('smoke: home', () => {
  test('loads the header, ZIP control and price list with no console errors', async ({ page, problems }) => {
    void problems; // asserted empty by the fixture after the test
    const home = new DashboardPage(page);
    await home.goto();

    await expect(home.heading).toBeVisible();
    await expect(home.zipButton).toContainText('Mead / Longmont, CO (80542)');
    await expect(home.tab(/Value Board/)).toBeVisible();
    expect(await home.priceCards.count()).toBeGreaterThan(3);
  });
});
