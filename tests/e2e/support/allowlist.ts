// Pure logic for the accessibility and overflow allowlists (v2.0 M2, decisions 7 and 15).
// Entries are known problems in today's UI, each tied to an issue. The list is a ratchet:
// new violations fail, and an entry that no longer occurs also fails, so it must be deleted.
// Kept free of Playwright imports so Vitest can unit test it.

export interface AllowlistEntry {
  /** Screen key used by the journey, for example "home". */
  screen: string;
  /** axe rule id, or "horizontal-scroll" for the page overflow check. */
  rule: string;
  /** Playwright project names where this is a known problem. */
  projects: string[];
  /** GitHub issue that tracks the fix. */
  issue: number;
  reason: string;
}

export interface Finding {
  rule: string;
  /** How many nodes violate the rule (informational). */
  nodes: number;
}

export interface AllowlistResult {
  /** Findings with no allowlist entry: these fail the test. */
  unexpected: Finding[];
  /** Entries for this screen and project that did not occur: delete them. */
  stale: AllowlistEntry[];
}

export function evaluateAllowlist(entries: readonly AllowlistEntry[], screen: string, project: string, findings: readonly Finding[]): AllowlistResult {
  const applicable = entries.filter((entry) => entry.screen === screen && entry.projects.includes(project));
  const allowed = new Set(applicable.map((entry) => entry.rule));
  const seen = new Set(findings.map((finding) => finding.rule));
  return {
    unexpected: findings.filter((finding) => !allowed.has(finding.rule)),
    stale: applicable.filter((entry) => !seen.has(entry.rule)),
  };
}

export function describeResult(screen: string, project: string, result: AllowlistResult): string {
  const lines: string[] = [];
  for (const finding of result.unexpected) lines.push(`new problem on "${screen}" (${project}): ${finding.rule} (${finding.nodes} node${finding.nodes === 1 ? '' : 's'}). Fix it; do not add an allowlist entry for new code.`);
  for (const entry of result.stale) lines.push(`stale allowlist entry on "${screen}" (${project}): ${entry.rule} (#${entry.issue}) no longer occurs. Delete it from a11y-allowlist.json.`);
  return lines.join('\n');
}
