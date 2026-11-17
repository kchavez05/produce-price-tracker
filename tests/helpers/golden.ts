// Golden-file comparison for the M3 DOM-equivalence guard (#701, plan decision 8).
// Goldens are regenerated only on purpose, with: npm run test:golden:update
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { expect } from 'vitest';

const root = join(process.cwd(), 'tests/unit/frontend/__goldens__/dashboard');

export function expectGolden(name: string, actual: string): void {
  const file = join(root, `${name}.html`);
  const body = `${actual}\n`;
  if (process.env.UPDATE_DASHBOARD_GOLDENS === '1') {
    // Refuse to rewrite goldens in CI: a green run there must mean a real comparison happened.
    if (process.env.CI) throw new Error('UPDATE_DASHBOARD_GOLDENS must not be set in CI.');
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, body);
    return;
  }
  if (!existsSync(file)) {
    throw new Error(`Missing golden ${name}.html. Generate it with: npm run test:golden:update`);
  }
  const expected = readFileSync(file, 'utf8');
  if (body === expected) return;
  // Report the first differing tag with context; a whole-string diff of a 240 KB golden is unreadable.
  const want = expected.split('\n');
  const got = body.split('\n');
  let at = 0;
  while (at < want.length && at < got.length && want[at] === got[at]) at += 1;
  const show = (lines: string[]) => lines.slice(Math.max(0, at - 2), at + 3).join('\n');
  expect.fail(`Golden ${name}.html differs at line ${at + 1} (golden ${want.length} lines, actual ${got.length}).\n--- golden\n${show(want)}\n--- actual\n${show(got)}`);
}
