import { expect, test } from './support/fixtures';

test.describe('smoke: home', () => {
  test('loads the header, ZIP control and price list with no console errors', async ({ page, problems }) => {
    void problems; // asserted empty by the fixture after the test
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1, name: /PantryBot/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Mead \/ Longmont, CO \(80542\)/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Value Board/ })).toBeVisible();
    expect(await page.getByRole('heading', { level: 3 }).count()).toBeGreaterThan(3);
  });
});
