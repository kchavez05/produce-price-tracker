import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import allowlist from './a11y-allowlist.json';
import { describeResult, evaluateAllowlist, type AllowlistEntry, type Finding } from './allowlist';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/** Run axe on the page and return serious and critical WCAG A/AA violations as findings. */
export async function collectAxeFindings(page: Page): Promise<Finding[]> {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  return results.violations
    .filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
    .map((violation) => ({ rule: violation.id, nodes: violation.nodes.length }));
}

/** True when the page scrolls horizontally (content wider than the viewport). */
export async function hasHorizontalScroll(page: Page): Promise<boolean> {
  return page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
}

function assertResult(screen: string, project: string, findings: Finding[]) {
  const result = evaluateAllowlist(allowlist as AllowlistEntry[], screen, project, findings);
  const message = describeResult(screen, project, result);
  if (message) throw new Error(message);
}

/** Fail on any serious or critical axe violation that is not allowlisted, or any stale entry. */
export async function checkAccessibility(page: Page, screen: string, project: string): Promise<void> {
  assertResult(screen, project, (await collectAxeFindings(page)).filter((finding) => finding.rule !== 'horizontal-scroll'));
}

/** Fail if the page scrolls horizontally, unless allowlisted for this screen and project. */
export async function checkNoHorizontalScroll(page: Page, screen: string, project: string): Promise<void> {
  const overflow = await hasHorizontalScroll(page);
  const applicable = (allowlist as AllowlistEntry[]).filter((entry) => entry.rule === 'horizontal-scroll');
  const result = evaluateAllowlist(applicable, screen, project, overflow ? [{ rule: 'horizontal-scroll', nodes: 1 }] : []);
  const message = describeResult(screen, project, result);
  if (message) throw new Error(message);
}
