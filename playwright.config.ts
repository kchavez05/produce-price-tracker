import { defineConfig, devices } from '@playwright/test';

// Browser tests (v2.0 M2). Keyless: no Supabase, AI or market-data variables are passed to the
// server. Set E2E_BASE_URL to test an already running server (no server is started then); this
// keeps the config usable against other targets later (for example a device cloud).
const port = Number(process.env.E2E_PORT ?? 3210);
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${port}`;
const ci = Boolean(process.env.CI);
const VISUAL_SPEC = /visual\.spec\.ts/;

// Visual runs pin the server's clock (libfaketime) so date-driven output is identical whenever CI
// runs: the six-week price history panel disappears as the data ages out, the planning cycle and the
// explorer's date range roll forward, and the weekly plan rotates. Masks hide timestamps, but they
// cannot hide a panel that appears or disappears and shifts the layout. "@" (with faketime -f) starts the clock at that
// moment and lets it advance, so timers behave. Set by the test:e2e:visual and :update scripts.
const fakeClock = process.env.E2E_FAKE_CLOCK === '1';
const SERVER_CLOCK_START = '@2026-11-16 12:00:00';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: ci,
  retries: ci ? 1 : 0,
  workers: 2,
  timeout: 30_000,
  expect: {
    timeout: 7_000,
    // Visual checks guard layout and spacing, not font fidelity: the system stack falls back to the
    // runner's font. Baselines come only from CI (ubuntu-latest); see docs/code-review.md.
    toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: 'disabled', caret: 'hide', scale: 'css' },
  },
  // One folder per project, next to the specs: tests/e2e/__screenshots__/<project>/<spec>/<name>.png
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{testFilePath}/{arg}{ext}',
  reporter: ci ? [['list'], ['html', { open: 'never' }]] : [['list']],
  outputDir: 'test-results',
  use: {
    baseURL,
    trace: 'on-first-retry',
    // Deterministic, keyless: always a fresh guest context, no service workers.
    serviceWorkers: 'block',
  },
  projects: [
    // Tier 2 smoke viewports (WebKit). Width classes, not device models (spec section 7).
    { name: 'iphone-webkit', testIgnore: VISUAL_SPEC, use: { ...devices['iPhone 14'], viewport: { width: 390, height: 844 } } },
    { name: 'ipad-webkit', testIgnore: VISUAL_SPEC, use: { ...devices['iPad (gen 7)'], viewport: { width: 820, height: 1180 } } },

    // Tier 3 viewport matrix: the remaining sizes from spec section 7, same journeys, WebKit.
    { name: 'iphone-pro-webkit', testIgnore: VISUAL_SPEC, use: { ...devices['iPhone 14'], viewport: { width: 402, height: 874 } } },
    { name: 'iphone-pro-max-webkit', testIgnore: VISUAL_SPEC, use: { ...devices['iPhone 14'], viewport: { width: 440, height: 956 } } },
    { name: 'ipad-landscape-webkit', testIgnore: VISUAL_SPEC, use: { ...devices['iPad (gen 7)'], viewport: { width: 1194, height: 834 } } },
    // Width check only, no posture handling (the inner display of a foldable, spec section 1).
    { name: 'duo-inner-webkit', testIgnore: VISUAL_SPEC, use: { ...devices['iPad (gen 7)'], viewport: { width: 626, height: 890 } } },

    // Tier 3 cross-check in a second engine at the two Tier 2 widths. A cheap second opinion on
    // layout and behavior, not a Safari substitute (spec section 3).
    { name: 'iphone-chromium', testIgnore: VISUAL_SPEC, use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 } },
    { name: 'ipad-chromium', testIgnore: VISUAL_SPEC, use: { ...devices['Desktop Chrome'], viewport: { width: 820, height: 1180 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } },

    // Visual snapshots (spec section 6): same viewports, only visual.spec.ts, run on their own.
    { name: 'visual-iphone', testMatch: VISUAL_SPEC, use: { ...devices['iPhone 14'], viewport: { width: 390, height: 844 } } },
    { name: 'visual-ipad', testMatch: VISUAL_SPEC, use: { ...devices['iPad (gen 7)'], viewport: { width: 820, height: 1180 } } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        // E2E_SKIP_BUILD reuses an existing .next build (CI builds once before running tests).
        command: `${process.env.E2E_SKIP_BUILD ? '' : 'npm run build && '}${fakeClock ? `faketime -f '${SERVER_CLOCK_START}' ` : ''}npx next start -p ${port}`,
        url: baseURL,
        timeout: 240_000,
        reuseExistingServer: !ci,
        env: {
          PANTRYBOT_BARCODE_LOOKUP_ENABLED: 'true',
          // Serves the dev-only /design style guide in this build (see src/design/guide-access.ts).
          E2E_DESIGN_GUIDE: '1',
          FAKETIME_DONT_FAKE_MONOTONIC: '1',
          NEXT_PUBLIC_SUPABASE_URL: '',
          NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
        },
      },
});
