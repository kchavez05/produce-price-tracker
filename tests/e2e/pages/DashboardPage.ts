import type { Locator, Page } from '@playwright/test';

/**
 * Page object for the app. Locators use roles and accessible names only, so when M3 moved the screens to /shop, /pantry
 * and /plan (B.3c) the change stayed in this file (spec section 9): the tabs and the Pantry control became links. Since M4-1a
 * the navigation is three tabs (Shop, Pantry, Plan: a bottom tab bar, an icon rail or a sidebar by width) and the Shop's
 * Deals, Trip and Radar views are links on the Shop page.
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
    // The Pantry tab is a link to /pantry (the property keeps its name so the specs do not change). Its accessible name
    // is "Pantry (n)". Only the navigation for the current width is displayed, so one link matches.
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

  /**
   * A tab ("Shop", "Plan"; the Pantry tab is pantryButton, whose name carries a count) or a Shop view link ("Deals", "Trip",
   * "Radar"). All are links.
   */
  tab(name: 'Shop' | 'Plan' | 'Deals' | 'Trip' | 'Radar'): Locator {
    return this.page.getByRole('link', { name, exact: true });
  }

  /** Open a Shop view from wherever the app is: the view links are on the Shop page, so another module goes through the Shop tab first. */
  async openShopView(view: 'Deals' | 'Trip' | 'Radar'): Promise<void> {
    if (!(await this.tab(view).isVisible())) await this.tab('Shop').click();
    await this.tab(view).click();
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
