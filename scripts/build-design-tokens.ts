import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderTokensCss } from '../src/design/render-css';

const target = resolve(process.cwd(), 'src/design/tokens.css');
const expected = renderTokensCss();

if (process.argv.includes('--check')) {
  const current = existsSync(target) ? readFileSync(target, 'utf8') : '';
  if (current !== expected) {
    console.error('src/design/tokens.css is out of date. Run `npm run design:tokens`.');
    process.exit(1);
  }
  console.log('Design tokens are up to date.');
} else {
  writeFileSync(target, expected);
  console.log('Wrote src/design/tokens.css');
}
