import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { compareToBaseline, countRawPaletteClasses, type PaletteCounts } from '../src/design/palette-ratchet';

const root = process.cwd();
const baselinePath = resolve(root, 'src/design/palette-baseline.json');

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.(tsx?|css)$/.test(name) && !/\.test\.tsx?$/.test(name)) out.push(path);
  }
  return out;
}

const current: PaletteCounts = {};
for (const file of walk(resolve(root, 'src'))) {
  const count = countRawPaletteClasses(readFileSync(file, 'utf8'));
  if (count > 0) current[relative(root, file).split('\\').join('/')] = count;
}
const sorted = (counts: PaletteCounts) => Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
const total = (counts: PaletteCounts) => Object.values(counts).reduce((sum, n) => sum + n, 0);
const baseline: PaletteCounts = existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, 'utf8')) : {};
const result = compareToBaseline(baseline, current);

if (process.argv.includes('--init')) {
  writeFileSync(baselinePath, JSON.stringify(sorted(current), null, 2) + '\n');
  console.log(`Wrote baseline: ${total(current)} raw palette classes in ${Object.keys(current).length} files.`);
} else if (process.argv.includes('--update')) {
  if (result.violations.length) {
    console.error('Refusing to raise the baseline. Use semantic tokens instead:');
    for (const v of result.violations) console.error(`  ${v.file}: ${v.baseline} -> ${v.current}`);
    process.exit(1);
  }
  writeFileSync(baselinePath, JSON.stringify(sorted(current), null, 2) + '\n');
  console.log(`Baseline lowered to ${total(current)} raw palette classes.`);
} else {
  if (result.violations.length) {
    console.error('Raw palette classes grew. Use semantic token utilities (bg-surface, text-muted, border-border-strong) instead:');
    for (const v of result.violations) console.error(`  ${v.file}: baseline ${v.baseline}, now ${v.current}`);
    process.exit(1);
  }
  console.log(`Palette ratchet OK: ${total(current)} raw classes (baseline ${total(baseline)}).`);
  if (result.improvements.length) console.log('Counts fell; lower the baseline with `npm run design:palette -- --update`.');
}
