// Browser performance advisories that are not defects of a page's behavior, and so are recorded
// rather than failed on. Kept narrow on purpose: each entry matches one known message, and
// anything else (errors, hydration warnings, other warnings) still fails the test.
// Pure, with no Playwright imports, so Vitest can unit test it.

const ADVISORIES: ReadonlyArray<{ id: string; pattern: RegExp; why: string }> = [
  {
    id: 'unused-css-preload',
    // WebKit: "The resource <url>.css was preloaded using link preload but not used within a few
    // seconds from the window's load event." Next.js and React 19 emit route-level stylesheet
    // preload hints; whether the browser reports an unused one depends on runner timing (seen on
    // CI only). It says nothing about hydration or behavior. A possible performance follow-up (M5).
    pattern: /^The resource \S+\.css was preloaded using link preload but not used within a few seconds from the window's load event\./,
    why: 'unused stylesheet preload hint (performance advisory)',
  },
];

/** The advisory a console warning matches, or undefined if it is a real problem. */
export function matchAdvisory(type: string, text: string): { id: string; why: string } | undefined {
  if (type !== 'warning') return undefined;
  const found = ADVISORIES.find((advisory) => advisory.pattern.test(text));
  return found && { id: found.id, why: found.why };
}
