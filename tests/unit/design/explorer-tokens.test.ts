// The Data Explorer's colors (v2.0 M4-7a, spec decision 6): its stylesheet and chart take every color from the design tokens, so the page
// follows the theme (light and dark) and the 3:1 control-border rule. The one exception is the seven chart series colors, which the Explorer
// owns as --ex-s1 to --ex-s7 with a light and a dark set; this guard keeps raw colors out of everything else and keeps the series readable
// on the card surface in both themes. Written against the old stylesheet first (it fails there), then the mapping made it pass.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { contrastRatio } from '@/design/contrast';
import { colorTokens } from '@/design/tokens';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const css = read('src/app/data/explorer.css');
const HEX = /#[0-9a-fA-F]{3,8}\b/;

describe('the Explorer stylesheet', () => {
  it('has no raw colors except the chart series variables', () => {
    const offenders = css.split('\n').map((line, index) => ({ line, n: index + 1 }))
      .filter(({ line }) => HEX.test(line) && !/--ex-s[1-7]:/.test(line))
      .map(({ line, n }) => `${n}: ${line.trim()}`);
    expect(offenders).toEqual([]);
  });

  it('has no named or functional colors either', () => {
    const offenders = css.split('\n').filter((line) => /(?<![-\w])(white|black)(?![-\w])|rgba?\(|hsla?\(/.test(line)).map((line) => line.trim());
    expect(offenders).toEqual([]);
  });

  it('has only valid property names: no token reference was spliced into a property (white-space once was)', () => {
    const broken = css.split('\n').filter((line) => /var\(--[\w-]+\)-/.test(line) || /^\s*var\(/.test(line)).map((line) => line.trim());
    expect(broken).toEqual([]);
  });

  it('keeps its no-wrap and pre-wrap declarations', () => {
    expect(css.match(/white-space: nowrap;/g)).toHaveLength(2);
    expect(css).toMatch(/white-space: pre-wrap;/);
  });

  it('takes its base colors from the design tokens', () => {
    for (const token of ['--ds-ink', '--ds-muted', '--ds-border', '--ds-bg', '--ds-surface', '--ds-accent', '--ds-border-strong', '--ds-focus']) {
      expect(css).toContain(`var(${token})`);
    }
  });
});

describe('the narrow-screen layout', () => {
  it('gives the chart a readable minimum width below 760 px, so it scrolls instead of shrinking its labels away', () => {
    const narrow = css.slice(css.indexOf('@media (max-width: 760px)'));
    expect(narrow).toMatch(/\.ex-chart \{\s*min-width: 640px;/);
    expect(css).toMatch(/\.ex-chart-scroll \{\s*overflow-x: auto;/);
  });
});

describe('the Explorer components', () => {
  it.each(['src/components/explorer/DataExplorer.tsx', 'src/components/explorer/PriceHistory.tsx'])('%s carries no raw colors', (path) => {
    const offenders = read(path).split('\n').filter((line) => HEX.test(line) || /rgba?\(|hsla?\(|fill="white"|stroke="white"/.test(line)).map((line) => line.trim());
    expect(offenders).toEqual([]);
  });
});

describe('the chart series colors', () => {
  const series = [...css.matchAll(/--ex-s([1-7]):\s*(#[0-9a-fA-F]{6})/g)].map((match) => ({ n: Number(match[1]), hex: match[2] }));
  const sets = [series.slice(0, 7), series.slice(7, 14), series.slice(14, 21)];

  it('defines seven colors for the light set, the dark set under the system preference, and the dark set under the theme switch', () => {
    expect(series).toHaveLength(21);
    for (const set of sets) expect(set.map((entry) => entry.n)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('uses the same dark colors whether dark comes from the system or from the theme switch', () => {
    expect(sets[1]).toEqual(sets[2]);
  });

  it.each([[0, 'light'], [1, 'dark']] as const)('keeps every %s-set series line at least 3:1 against the card surface (%s)', (index, theme) => {
    for (const { n, hex } of sets[index]) {
      expect(contrastRatio(hex, colorTokens.surface[theme]), `series ${n} ${hex}`).toBeGreaterThanOrEqual(3);
    }
  });

  it('keeps the series distinct within each set', () => {
    for (const set of sets) expect(new Set(set.map((entry) => entry.hex.toLowerCase())).size).toBe(7);
  });
});
