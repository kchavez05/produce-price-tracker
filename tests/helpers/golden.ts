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
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, body);
    return;
  }
  if (!existsSync(file)) {
    throw new Error(`Missing golden ${name}.html. Generate it with: npm run test:golden:update`);
  }
  // Compare as a whole string, so a failure prints a line diff of the first differing markup.
  expect(body).toBe(readFileSync(file, 'utf8'));
}
