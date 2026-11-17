import type { Page } from '@playwright/test';
import { expect, test } from './support/fixtures';

// Browser coverage of the dev-only /design style guide (v2.0 M2, decision 12): the design system's
// primitives and themes in real engines. Tier 3 only (tagged), on a build with E2E_DESIGN_GUIDE=1.
// Only /design uses the design tokens today, so this is dark-mode coverage of the design system, not
// of the app; the real screens get theirs in M4. /design is held to zero axe violations with no
// allowlist: the allowlist is for legacy screens, not new code. The scan leaves out the site footer:
// it is legacy chrome rendered by the root layout on every page (a slate palette that fails contrast,
// tracked for the M5 pass in #714 and already covered by the real screens' allowlist), not part of
// the guide.

const THEME_KEY = 'pantrybot-theme';
const LEGACY_FOOTER = ['footer'];

async function openGuide(page: Page): Promise<void> {
  await page.goto('/design');
  await expect(page.getByRole('heading', { level: 1, name: 'Design System' })).toBeVisible();
  // The guide sets data-ds from a mount effect, so its presence means React has hydrated.
  await expect(page.locator('html')).toHaveAttribute('data-ds', '');
}

const themeGroup = (page: Page) => page.getByRole('radiogroup', { name: 'Theme preference' });
const storedTheme = (page: Page) => page.evaluate((key) => window.localStorage.getItem(key), THEME_KEY);

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`design guide, system theme ${scheme}`, { tag: '@tier3' }, () => {
    test.use({ colorScheme: scheme });

    test('follows the system theme and has no accessibility violations, color contrast included', async ({ page, a11y, problems }) => {
      void problems; // no console errors or hydration warnings, asserted by the fixture
      await openGuide(page);
      await expect(page.locator('html')).toHaveAttribute('data-theme', scheme);
      await expect(page.getByText(`Resolved theme: ${scheme}.`)).toBeVisible();
      await a11y.check('design', { exclude: LEGACY_FOOTER });
      await a11y.noHorizontalScroll('design');
    });
  });
}

test.describe('design guide theme control', { tag: '@tier3' }, () => {
  test.use({ colorScheme: 'light' });

  test('a stored choice beats the system theme, survives a reload and is applied before the body renders', async ({ page, problems }) => {
    void problems;
    await openGuide(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    await themeGroup(page).getByRole('radio', { name: 'Dark' }).check();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(await storedTheme(page)).toBe('dark');

    // Record the theme at the moment <body> first exists. The blocking head script sets it, so it must
    // already be dark then, before React hydrates and before anything paints (no flash).
    await page.addInitScript(() => {
      new MutationObserver((_records, observer) => {
        if (document.body) {
          (window as unknown as { __themeAtBody: string | null }).__themeAtBody = document.documentElement.getAttribute('data-theme');
          observer.disconnect();
        }
      }).observe(document, { childList: true, subtree: true });
    });
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(await page.evaluate(() => (window as unknown as { __themeAtBody: string | null }).__themeAtBody)).toBe('dark');
    await expect(themeGroup(page).getByRole('radio', { name: 'Dark' })).toBeChecked();

    await themeGroup(page).getByRole('radio', { name: 'System' }).check();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    expect(await storedTheme(page)).toBeNull();
  });

  test('the segmented control works from the keyboard', async ({ page, problems }) => {
    void problems;
    await openGuide(page);
    const group = themeGroup(page);
    await group.getByRole('radio', { name: 'System' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(group.getByRole('radio', { name: 'Light' })).toBeChecked();
    await page.keyboard.press('ArrowRight');
    await expect(group.getByRole('radio', { name: 'Dark' })).toBeChecked();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.keyboard.press('ArrowLeft');
    await expect(group.getByRole('radio', { name: 'Light' })).toBeChecked();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });
});

test.describe('design guide sheet', { tag: '@tier3' }, () => {
  const insideDialog = (page: Page) => page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"]')));
  const bodyOverflow = (page: Page) => page.evaluate(() => document.body.style.overflow);

  test('moves focus in, traps Tab, locks scroll, and on Escape closes and returns focus to the opener', async ({ page, a11y, problems }) => {
    void problems;
    await openGuide(page);
    const opener = page.getByRole('button', { name: 'Open Sheet' });
    await opener.click();
    const dialog = page.getByRole('dialog', { name: 'Edit Ingredient' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect(dialog.getByRole('button', { name: 'Close' })).toBeFocused();
    await expect.poll(() => bodyOverflow(page)).toBe('hidden');
    await a11y.check('design-sheet', { exclude: LEGACY_FOOTER });

    // The dialog has three focusable controls; six presses go around twice and never leave it.
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab');
      expect(await insideDialog(page)).toBe(true);
    }
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Shift+Tab');
      expect(await insideDialog(page)).toBe(true);
    }

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
    await expect.poll(() => bodyOverflow(page)).toBe('');
  });

  test('closes when the backdrop is pressed', async ({ page, problems }) => {
    void problems;
    await openGuide(page);
    const opener = page.getByRole('button', { name: 'Open Sheet' });
    await opener.click();
    const dialog = page.getByRole('dialog', { name: 'Edit Ingredient' });
    await expect(dialog).toBeVisible();
    await page.mouse.click(4, 4); // the sheet is anchored to the bottom, so the top corner is the backdrop
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
  });
});
