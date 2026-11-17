import { defineConfig, devices } from '@playwright/test';

// Browser tests (v2.0 M2). Keyless: no Supabase, AI or market-data variables are passed to the
// server. Set E2E_BASE_URL to test an already running server (no server is started then); this
// keeps the config usable against other targets later (for example a device cloud).
const port = Number(process.env.E2E_PORT ?? 3210);
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${port}`;
const ci = Boolean(process.env.CI);

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: ci,
  retries: ci ? 1 : 0,
  workers: 2,
  timeout: 30_000,
  expect: { timeout: 7_000 },
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
    { name: 'iphone-webkit', use: { ...devices['iPhone 14'], viewport: { width: 390, height: 844 } } },
    { name: 'ipad-webkit', use: { ...devices['iPad (gen 7)'], viewport: { width: 820, height: 1180 } } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        // E2E_SKIP_BUILD reuses an existing .next build (CI builds once before running tests).
        command: `${process.env.E2E_SKIP_BUILD ? '' : 'npm run build && '}npx next start -p ${port}`,
        url: baseURL,
        timeout: 240_000,
        reuseExistingServer: !ci,
        env: {
          PANTRYBOT_BARCODE_LOOKUP_ENABLED: 'true',
          NEXT_PUBLIC_SUPABASE_URL: '',
          NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
        },
      },
});
