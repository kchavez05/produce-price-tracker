import { test as base, expect, type Page } from '@playwright/test';
import { checkAccessibility, checkNoHorizontalScroll, type AxeOptions } from './a11y';
import { matchAdvisory } from './advisories';
import { freezeDate, stubAnalytics } from './stubs';

/** The first-run marker (src/modules/shell/first-run.ts). Tests start on a device that is already set up, so the journeys that
 * are not about onboarding open where they say; a test about the first visit opts out with `test.use({ firstRun: true })`. */
const SETUP_COMPLETED_KEY = 'pantrybot_setup_completed_v20';

/**
 * Wire the standard boundary onto a page: stubbed Analytics, a pinned clock, and collection of
 * console problems and requests that leave the test server.
 */
async function guard(page: Page, origin: string, problems: string[], advisories: string[], firstRun: boolean): Promise<void> {
  await stubAnalytics(page);
  await freezeDate(page);
  if (!firstRun) {
    await page.addInitScript((key) => {
      try { if (window.localStorage.getItem(key) === null) window.localStorage.setItem(key, '1'); } catch { /* storage unavailable */ }
    }, SETUP_COMPLETED_KEY);
  }
  page.on('console', (message) => {
    if (message.type() !== 'error' && message.type() !== 'warning') return;
    const advisory = matchAdvisory(message.type(), message.text());
    if (advisory) advisories.push(`${advisory.id}: ${advisory.why}`);
    else problems.push(`console ${message.type()}: ${message.text()}`);
  });
  page.on('pageerror', (error) => problems.push(`page error: ${error.message}`));
  page.on('request', (request) => {
    const url = request.url();
    if (!url.startsWith('data:') && !url.startsWith('blob:') && !url.startsWith(origin)) problems.push(`external request: ${url}`);
  });
}

interface Fixtures {
  /** Start on a device that has never been set up, so the app opens the welcome setup (default: already set up). */
  firstRun: boolean;
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
  firstRun: [false, { option: true }],
  problems: async ({ page, baseURL, firstRun }, use, testInfo) => {
    const problems: string[] = [];
    const advisories: string[] = [];
    await guard(page, new URL(baseURL ?? 'http://localhost').origin, problems, advisories, firstRun);
    await use(problems);
    // Known browser advisories do not fail the test, but stay visible in the report.
    for (const advisory of new Set(advisories)) testInfo.annotations.push({ type: 'advisory', description: advisory });
    expect(problems, 'console errors, hydration warnings or external requests').toEqual([]);
  },
  newGuest: async ({ browser, baseURL, problems, firstRun }, use, testInfo) => {
    const advisories: string[] = [];
    const contexts: Awaited<ReturnType<typeof browser.newContext>>[] = [];
    await use(async () => {
      const context = await browser.newContext({ ...testInfo.project.use, baseURL });
      contexts.push(context);
      const page = await context.newPage();
      await guard(page, new URL(baseURL ?? 'http://localhost').origin, problems, advisories, firstRun);
      return page;
    });
    for (const advisory of new Set(advisories)) testInfo.annotations.push({ type: 'advisory', description: advisory });
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
