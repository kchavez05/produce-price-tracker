import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import allowlist from './a11y-allowlist.json';
import { SCROLL_RULE, axeEntries, describeResult, evaluateAllowlist, scrollEntries, type AllowlistEntry, type Finding } from './allowlist';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

export interface AxeOptions {
  /**
   * CSS selectors to leave out of the scan. Only for third-party widgets we do not control
   * (such as Swagger UI), whose markup and render timing would make results unstable.
   */
  exclude?: string[];
}

/** Run axe on the page and return serious and critical WCAG A/AA violations as findings. */
export async function collectAxeFindings(page: Page, options: AxeOptions = {}): Promise<Finding[]> {
  // Next.js briefly empties document.title while it swaps the page during a client navigation (seen on about one run in
  // five when axe runs right after a tab click), which axe reports as document-title. Wait for the settled title so the
  // scan sees the page the user sees; a page that never gets a title still fails, after the wait.
  await page.waitForFunction(() => document.title.trim() !== '');
  const builder = new AxeBuilder({ page }).withTags(WCAG_TAGS);
  for (const selector of options.exclude ?? []) builder.exclude(selector);
  const results = await builder.analyze();
  return results.violations
    .filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
    .map((violation) => ({ rule: violation.id, nodes: violation.nodes.length }));
}

/** True when the page scrolls horizontally (content wider than the viewport). */
export async function hasHorizontalScroll(page: Page): Promise<boolean> {
  return page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
}

function assertResult(entries: AllowlistEntry[], screen: string, project: string, findings: Finding[]) {
  const result = evaluateAllowlist(entries, screen, project, findings);
  const message = describeResult(screen, project, result);
  if (message) throw new Error(message);
}

/**
 * Fail on any serious or critical axe violation that is not allowlisted, or any stale entry.
 * Overflow entries belong to checkNoHorizontalScroll and are not considered here.
 */
export async function checkAccessibility(page: Page, screen: string, project: string, options: AxeOptions = {}): Promise<void> {
  assertResult(axeEntries(allowlist as AllowlistEntry[]), screen, project, await collectAxeFindings(page, options));
}

/** Fail if the page scrolls horizontally, unless allowlisted for this screen and project. */
export async function checkNoHorizontalScroll(page: Page, screen: string, project: string): Promise<void> {
  const overflow = await hasHorizontalScroll(page);
  assertResult(scrollEntries(allowlist as AllowlistEntry[]), screen, project, overflow ? [{ rule: SCROLL_RULE, nodes: 1 }] : []);
}
