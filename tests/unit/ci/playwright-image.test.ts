import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Every browser job runs in the official Playwright image (no browser download, no 185-package apt install; #790): the
// Tier 2 and Tier 3 jobs, the advisory visual job, and the Visual Baselines workflow that generates what the visual job
// compares against. The image bundles browsers for exactly one Playwright version, so its tag must follow the pinned
// @playwright/test version.
const root = process.cwd();
const installed = JSON.parse(readFileSync(join(root, 'node_modules/@playwright/test/package.json'), 'utf8')).version as string;
const declared = (JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).devDependencies['@playwright/test'] as string);
const workflow = readFileSync(join(root, '.github/workflows/ci.yml'), 'utf8');
const baselines = readFileSync(join(root, '.github/workflows/visual-baselines.yml'), 'utf8');
const imageVersions = (text: string) => [...text.matchAll(/image:\s*mcr\.microsoft\.com\/playwright:v([0-9.]+)-noble/g)].map((match) => match[1]);
const between = (text: string, from: string, to?: string) => text.slice(text.indexOf(from), to ? text.indexOf(to) : undefined);

describe('Playwright image in CI', () => {
  it('pins @playwright/test exactly, so the image tag cannot drift from a range', () => {
    expect(declared).toBe(installed);
  });

  it('uses the image for the Tier 2, Tier 3 and visual jobs and for the baselines workflow, at the installed version', () => {
    const ciImages = imageVersions(workflow);
    expect(ciImages).toHaveLength(3);
    expect(imageVersions(baselines)).toHaveLength(1);
    for (const version of [...ciImages, ...imageVersions(baselines)]) expect(version).toBe(installed);
  });

  it('no longer runs playwright install or a Playwright browser cache anywhere', () => {
    for (const text of [workflow, baselines]) {
      expect(text).not.toMatch(/playwright install/);
      expect(text).not.toMatch(/ms-playwright/);
    }
  });

  it('keeps apt out of the Tier 2 and Tier 3 jobs', () => {
    const jobs = between(workflow, '  browser-tests:', '  visual-snapshots:');
    expect(jobs).not.toMatch(/apt-get/);
  });

  it('allows apt only for the one faketime package, behind the time-boxed retry, in the visual job and the baselines workflow', () => {
    for (const text of [between(workflow, '  visual-snapshots:'), baselines]) {
      const aptLines = text.split('\n').filter((line) => /apt-get (install|update)/.test(line) && !line.trim().startsWith('#'));
      expect(aptLines.length).toBeGreaterThan(0);
      for (const line of aptLines) {
        expect(line).toMatch(/retry-with-timeout\.sh/);
        expect(line).toMatch(/--no-install-recommends faketime/);
        expect(line).not.toMatch(/sudo/);
      }
    }
  });

  it('renders the visual snapshots from the curated baseline, with no live circular fetch (#796)', () => {
    const config = readFileSync(join(root, 'playwright.config.ts'), 'utf8');
    expect(config).toMatch(/fakeClock \? \{ PANTRYBOT_LIVE_OFFERS: 'off' \} : \{\}/);
    expect(readFileSync(join(root, 'package.json'), 'utf8')).toMatch(/"test:e2e:visual": "E2E_FAKE_CLOCK=1 /);
    expect(readFileSync(join(root, 'package.json'), 'utf8')).toMatch(/"test:e2e:update": "E2E_FAKE_CLOCK=1 /);
  });
});
