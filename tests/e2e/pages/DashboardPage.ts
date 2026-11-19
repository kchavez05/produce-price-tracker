import type { Locator, Page } from '@playwright/test';

/**
 * Page object for the app. Locators use roles and accessible names only, so when M3 moved the screens to /shop, /pantry
 * and /plan (B.3c) the change stayed in this file (spec section 9): the tabs and the Pantry control became links.
 */
export class DashboardPage {
  readonly heading: Locator;
  readonly zipButton: Locator;
  readonly pantryButton: Locator;
  readonly signInButton: Locator;
  readonly priceCards: Locator;
  readonly pantryHeading: Locator;
  readonly planHeading: Locator;
  /** The optional AI meal-plan request box on the plan. */
  readonly aiRequest: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1, name: /PantryBot/ });
    // The header control ends with "Change"; the location list buttons in the open panel do not.
    this.zipButton = page.getByRole('button', { name: /\(\d{5}\)\s*Change$/ });
    // The Pantry control is a link to /pantry since M3 B.3c (the property keeps its name so the specs do not change). The
    // "Virtual Pantry" label is hidden on narrow screens, so the accessible name is "Pantry (n)".
    this.pantryButton = page.getByRole('link', { name: /Pantry\s*\(\d+\)/ });
    this.signInButton = page.getByRole('button', { name: 'Sign In', exact: true });
    this.priceCards = page.getByRole('heading', { level: 3 });
    this.pantryHeading = page.getByRole('heading', { level: 2, name: 'Virtual Pantry' });
    this.planHeading = page.getByRole('heading', { level: 2, name: /Your 3-Dish Weekend Meal Prep Plan/ });
    this.aiRequest = page.getByRole('textbox', { name: 'Optional AI meal-plan request' });
  }

  /** The current path, for example "/shop" (each module is a page since M3 B.3c). */
  get pathname(): string {
    return new URL(this.page.url()).pathname;
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

  /** A tab of the module strip. Since M3 B.3c the tabs are links (the Plan tab goes to /plan, the three Shop tabs stay on /shop). */
  tab(name: RegExp | string): Locator {
    return this.page.getByRole('link', { name });
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
