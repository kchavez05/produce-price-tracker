# Dependency maintenance

## Next.js 15 PostCSS override — November 9, 2026

Next.js 15.5.28 pins PostCSS 8.4.31. The registry check also found that 15.5.29 retains that pin. The root PostCSS 8.5.30 used elsewhere in the build does not replace Next's nested dependency.

The package-level npm override selects PostCSS **8.5.30 only beneath Next**. It preserves the supported Next.js 15 framework and existing ESLint configuration. It replaces the security-update proposal in PR #593, which targets `main` and upgrades Next to 16.4.3 despite its PostCSS-only title. This fix follows the normal PR path through `develop`.

PostCSS 8.5.30 includes the fixes for the four reported PostCSS advisories: [GHSA-qx2v-qp2m-jg93](https://github.com/advisories/GHSA-qx2v-qp2m-jg93), [GHSA-6g55-p6wh-862q](https://github.com/advisories/GHSA-6g55-p6wh-862q), [GHSA-r28c-9q8g-f849](https://github.com/advisories/GHSA-r28c-9q8g-f849), and [GHSA-fxqj-rqcc-2cmp](https://github.com/advisories/GHSA-fxqj-rqcc-2cmp). The last of these requires at least 8.5.23. See [npm's scoped override documentation](https://docs.npmjs.com/cli/v11/configuring-npm/package-json#overrides).

The source-map regression suite resolves PostCSS from Next's own package location. Two synthetic fixtures reproduce out-of-directory reads with 8.4.31: an absolute map path with no CSS origin, and a relative traversal from a known CSS directory. Both must be rejected after the override. A positive control verifies that an ordinary adjacent source map still loads. Fixtures contain no real private information and are removed after each test.

Before merging, verify a clean `npm ci`, typecheck, lint, unit/smoke/regression suites, catalog projection, production build, and `npm audit --omit=dev`. Confirm `npm ls next postcss` resolves Next to the patched version. Review browser rendering of the compiled dashboard/docs as a check that normal CSS processing still works.

Remove or revise this override when an approved Next upgrade itself resolves a patched PostCSS version. Recheck the resolved dependency tree, audit, source-map regression and production build when doing so; do not remove it solely because the root PostCSS is patched. Keep `unsafeMap` disabled. A future Next major migration remains separate work.

This dependency change introduces no data migrations. Merging into `develop` updates staging; production remediation still requires the normal reviewed `develop` → `main` release. Default-branch Dependabot alerts may remain open until that release. Development-only tooling advisories are tracked separately and are not fixed by this PostCSS override.
