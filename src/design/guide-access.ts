/**
 * Whether the dev-only `/design` style guide may be served (v2.0 M1, M2).
 *
 * The page is statically prerendered, so this is evaluated at build time: a runtime switch cannot
 * unlock it. Development always serves it. A production build serves it only when it was built with
 * `E2E_DESIGN_GUIDE=1`, which the browser-test builds set so the primitives get browser coverage.
 * It is refused on Vercel production whatever the flag says, so an accidentally copied variable can
 * never publish the guide.
 */
export function designGuideEnabled(env: Readonly<Record<string, string | undefined>> = process.env): boolean {
  if (env.NODE_ENV !== 'production') return true;
  if (env.VERCEL_ENV === 'production') return false;
  return env.E2E_DESIGN_GUIDE === '1';
}
