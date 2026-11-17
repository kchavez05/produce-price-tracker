import { test as base, expect, type Page } from '@playwright/test';
import { checkAccessibility, checkNoHorizontalScroll, type AxeOptions } from './a11y';
import { freezeDate, stubAnalytics } from './stubs';

/**
 * Wire the standard boundary onto a page: stubbed Analytics, a pinned clock, and collection of
 * console problems and requests that leave the test server.
 */
async function guard(page: Page, origin: string, problems: string[]): Promise<void> {
  await stubAnalytics(page);
  await freezeDate(page);
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') problems.push(`console ${message.type()}: ${message.text()}`);
  });
  page.on('pageerror', (error) => problems.push(`page error: ${error.message}`));
  page.on('request', (request) => {
    const url = request.url();
    if (!url.startsWith('data:') && !url.startsWith('blob:') && !url.startsWith(origin)) problems.push(`external request: ${url}`);
  });
}

interface Fixtures {
  /** Console errors, hydration warnings and external requests; asserted empty after the test. */
  problems: string[];
  /** Open another, fully isolated guest (new context, new session cookie) with the same guards. */
  newGuest: () => Promise<Page>;
  a11y: {
    /** Fail on new serious or critical WCAG A/AA axe violations, or stale allowlist entries. */
    check: (screen: string, options?: AxeOptions) => Promise<void>;
    /** Fail on horizontal page scroll unless allowlisted. */
    noHorizontalScroll: (screen: string) => Promise<void>;
  };
}

/**
 * Base fixtures for browser tests. Every test starts in a fresh browser context, which creates a
 * private guest session through the normal cookie. Tests never log in or call Supabase.
 */
export const test = base.extend<Fixtures>({
  problems: async ({ page, baseURL }, use) => {
    const problems: string[] = [];
    await guard(page, new URL(baseURL ?? 'http://localhost').origin, problems);
    await use(problems);
    expect(problems, 'console errors, hydration warnings or external requests').toEqual([]);
  },
  newGuest: async ({ browser, baseURL, problems }, use, testInfo) => {
    const contexts: Awaited<ReturnType<typeof browser.newContext>>[] = [];
    await use(async () => {
      const context = await browser.newContext({ ...testInfo.project.use, baseURL });
      contexts.push(context);
      const page = await context.newPage();
      await guard(page, new URL(baseURL ?? 'http://localhost').origin, problems);
      return page;
    });
    await Promise.all(contexts.map((context) => context.close()));
  },
  a11y: async ({ page }, use, testInfo) => {
    await use({
      check: (screen, options) => checkAccessibility(page, screen, testInfo.project.name, options),
      noHorizontalScroll: (screen) => checkNoHorizontalScroll(page, screen, testInfo.project.name),
    });
  },
});

export { expect };
