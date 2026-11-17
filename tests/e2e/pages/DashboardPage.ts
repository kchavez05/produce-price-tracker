import type { Locator, Page } from '@playwright/test';

/**
 * Page object for the dashboard. Locators use roles and accessible names only, so when M3 moves
 * the screens to /shop, /pantry and /plan the change stays in this file (spec section 9).
 */
export class DashboardPage {
  readonly heading: Locator;
  readonly zipButton: Locator;
  readonly pantryButton: Locator;
  readonly signInButton: Locator;
  readonly priceCards: Locator;
  readonly pantryHeading: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1, name: /PantryBot/ });
    // The header control ends with "Change"; the location list buttons in the open panel do not.
    this.zipButton = page.getByRole('button', { name: /\(\d{5}\)\s*Change$/ });
    // The "Virtual Pantry" label is hidden on narrow screens, so the accessible name is "Pantry (n)".
    this.pantryButton = page.getByRole('button', { name: /Pantry\s*\(\d+\)/ });
    this.signInButton = page.getByRole('button', { name: 'Sign In', exact: true });
    this.priceCards = page.getByRole('heading', { level: 3 });
    this.pantryHeading = page.getByRole('heading', { level: 2, name: 'Virtual Pantry' });
  }

  /** The number in the Pantry button, for example 2 for "Pantry (2)". */
  async pantryCount(): Promise<number> {
    const text = (await this.pantryButton.textContent()) ?? '';
    return Number(/\((\d+)\)/.exec(text)?.[1] ?? NaN);
  }

  async openPantry(): Promise<void> {
    await this.pantryButton.click();
    await this.pantryHeading.waitFor();
  }

  tab(name: RegExp | string): Locator {
    return this.page.getByRole('button', { name });
  }

  /**
   * Open the dashboard and wait until it is hydrated. The page fetches /api/sync from a client
   * effect on mount, so that response means event handlers are attached; without this, a click or
   * keypress right after load can be silently ignored under load.
   */
  async goto(): Promise<void> {
    const hydrated = this.page.waitForResponse((response) => response.url().includes('/api/sync'));
    await this.page.goto('/');
    await hydrated;
  }
}
