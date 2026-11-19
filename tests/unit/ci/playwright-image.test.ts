import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// The browser jobs run in the official Playwright image (no apt install, no browser download; #790). The image bundles
// browsers for exactly one Playwright version, so its tag must follow the pinned @playwright/test version.
const root = process.cwd();
const installed = JSON.parse(readFileSync(join(root, 'node_modules/@playwright/test/package.json'), 'utf8')).version as string;
const declared = (JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).devDependencies['@playwright/test'] as string);
const workflow = readFileSync(join(root, '.github/workflows/ci.yml'), 'utf8');
const images = [...workflow.matchAll(/image:\s*mcr\.microsoft\.com\/playwright:v([0-9.]+)-noble/g)].map((match) => match[1]);

describe('Playwright image in CI', () => {
  it('pins @playwright/test exactly, so the image tag cannot drift from a range', () => {
    expect(declared).toBe(installed);
  });

  it('uses the image for the Tier 2 and Tier 3 browser jobs, at the installed Playwright version', () => {
    expect(images).toHaveLength(2);
    for (const version of images) expect(version).toBe(installed);
  });

  it('no longer installs system dependencies or browsers with apt in those jobs', () => {
    const jobs = workflow.slice(workflow.indexOf('  browser-tests:'), workflow.indexOf('  visual-snapshots:'));
    expect(jobs).not.toMatch(/playwright install/);
    expect(jobs).not.toMatch(/apt-get/);
  });
});
