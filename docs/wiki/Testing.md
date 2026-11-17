# Testing

PantryBot has three test tiers. Tiers 1 to 3 run Vitest; Tiers 2 and 3 also run Playwright browser tests against a keyless production build (`next start`, no Supabase, AI or market-data keys, no network beyond localhost). Design: [v2.0 M2 spec](../specs/v2.0-m2-test-infrastructure.md), tracked in [#694](https://github.com/kchavez05/produce-price-tracker/issues/694).

## Tiers

| Tier | Runs on | Vitest | Browser (Playwright) |
|---|---|---|---|
| 1 Unit | every branch and PR | `npm run test:unit` | none |
| 2 Smoke | PRs and pushes to `develop`, `main`, `release` | `npm run test:smoke` | `npm run test:e2e:smoke`: WebKit, iPhone 390x844 and iPad 820x1180, journeys plus axe and no-horizontal-scroll checks per screen |
| 3 Regression | PRs and pushes to `main` and `release`; `develop` PRs labeled `run-tier3` | `npm run test:regression` | `npm run test:e2e:regression`: six WebKit sizes, a Chromium cross-check, three shards of at most 10 minutes each, plus visual snapshots |

Browser Tests (Tier 2) run for PRs into `develop`, `main` and `release` and for pushes to those three branches, not for the push to a PR's own branch (the PR run covers it). A PR into `develop` whose changed files are all docs, root Markdown, `.claude/` or repository-metadata workflows and templates skips the browser job (the `Detect product changes` job in `ci.yml` holds the skip list). Anything else, including `package*.json`, `catalog/`, `tests/`, `scripts/` and `ci.yml` itself, runs it; PRs into `main` and `release` always run it. A skipped job reports as successful, so it stays compatible with a required check. Typecheck, Lint & Build and the Vitest tiers still run on every PR.

Budgets: Tier 2 browser job at most 5 minutes; each Tier 3 shard at most 10. CI retries a failing browser test once; a test that passes only on retry is a flake to fix or quarantine with an issue.

## Running locally

Browser tests are recommended locally and mandatory in CI. WebKit on macOS renders differently from CI, so local runs are for behavior, not pixels.

```bash
npx playwright install webkit chromium
npm run test:e2e:smoke
```

The config builds and starts the app itself. Useful switches:

- `E2E_SKIP_BUILD=1` reuses an existing `.next` build.
- `E2E_DESIGN_GUIDE=1 npm run build -- --no-lint` builds with the development-only `/design` route, which the `/design` specs need. Never set it on Vercel.
- `E2E_BASE_URL` / `E2E_PORT` point the tests at another server or port.
- Stop leftover servers with `pkill -f next-server` (`pkill "next start"` misses them).

## Accessibility and overflow allowlist

Each screen runs axe and a horizontal-overflow check. Known violations live in `tests/e2e/support/a11y-allowlist.json`, each with an issue link. The list is a ratchet: entries may be removed, a stale entry fails the test, and a new violation fails unless allowlisted with an issue. Entries marked `borderline` are never reported stale (their result varies with the runner's fonts).

## Visual snapshots

Snapshots use Playwright's `toHaveScreenshot` at `maxDiffPixelRatio` 0.01, with animations disabled, a fixed clock (`E2E_FAKE_CLOCK=1`, via `faketime`) and the system font stack. They run in the `Visual Snapshots (advisory)` job and become blocking after about two stable weeks.

**Baselines are generated only by CI on `ubuntu-latest`, never on a developer machine and never committed from a local run.** To update them:

1. Add the `update-visual-baselines` label to a pull request (labeling is the trigger; do not push to retrigger).
2. Open the **Visual Baselines** workflow run, download the `visual-baselines` artifact (kept 14 days).
3. Extract it into `tests/e2e/__screenshots__/`, review every image, and commit them in a PR that says why they changed.

The workflow never commits. During the v2.0 M3 refactor any snapshot diff is a failure to explain; each M4 screen PR re-baselines its own screens and says so.

## Labels

- `run-tier3`: runs the Tier 3 browser matrix and the visual job on a `develop` PR. Apply it **before pushing**; labeling alone does not retrigger CI.
- `update-visual-baselines`: runs the Visual Baselines workflow.

## Characterization suite (M3)

The smoke journeys and the visual baselines are the frozen safety net for the dashboard split ([#701](https://github.com/kchavez05/produce-price-tracker/issues/701)). M3 PRs keep them green with no baseline or test edits other than the route and locator changes the split requires; any other edit needs an explanation in the PR description.
