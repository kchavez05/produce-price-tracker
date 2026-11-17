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

  constructor(readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1, name: /PantryBot/ });
    this.zipButton = page.getByRole('button', { name: /\(\d{5}\)/ });
    this.pantryButton = page.getByRole('button', { name: /Virtual Pantry/ });
    this.signInButton = page.getByRole('button', { name: 'Sign In' });
    this.priceCards = page.getByRole('heading', { level: 3 });
  }

  tab(name: RegExp | string): Locator {
    return this.page.getByRole('button', { name });
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }
}
