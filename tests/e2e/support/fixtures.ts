import { test as base, expect } from '@playwright/test';

/**
 * Base fixtures for browser tests. Every test gets a fresh browser context (a new guest session),
 * a stub for the Vercel Analytics script, a collector for console problems, and a network guard
 * that fails the test if any request leaves the test server.
 */
export const test = base.extend<{ problems: string[] }>({
  problems: async ({ page, baseURL }, use) => {
    const problems: string[] = [];
    const origin = new URL(baseURL ?? 'http://localhost').origin;

    // The Analytics script only exists on Vercel; stub it so "no console errors" can stay strict.
    await page.route('**/_vercel/insights/**', (route) => route.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
    page.on('console', (message) => {
      if (message.type() === 'error' || message.type() === 'warning') problems.push(`console ${message.type()}: ${message.text()}`);
    });
    page.on('pageerror', (error) => problems.push(`page error: ${error.message}`));
    page.on('request', (request) => {
      const url = request.url();
      if (!url.startsWith('data:') && !url.startsWith('blob:') && !url.startsWith(origin)) problems.push(`external request: ${url}`);
    });

    await use(problems);
    expect(problems, 'console errors, hydration warnings or external requests').toEqual([]);
  },
});

export { expect };
