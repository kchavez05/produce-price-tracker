import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { compareToBaseline, countRawPaletteClasses } from '@/design/palette-ratchet';

describe('countRawPaletteClasses', () => {
  it('counts raw palette utilities, including variants and opacity', () => {
    const source = 'className="bg-slate-50 text-emerald-600 hover:bg-emerald-50 dark:border-slate-700 md:focus:ring-blue-500/50 from-amber-100"';
    expect(countRawPaletteClasses(source)).toBe(6);
  });
  it('ignores semantic tokens, white/black and look-alikes', () => {
    const source = 'bg-surface text-muted border-border-strong bg-white text-black bg-slate size-4 text-sm bg-accent/50 xbg-slate-50';
    expect(countRawPaletteClasses(source)).toBe(0);
  });
});

describe('compareToBaseline', () => {
  it('flags growth and new files, and reports improvements', () => {
    const result = compareToBaseline({ 'a.tsx': 5, 'b.tsx': 3, 'c.tsx': 2 }, { 'a.tsx': 6, 'b.tsx': 1, 'd.tsx': 1 });
    expect(result.violations).toEqual([{ file: 'a.tsx', baseline: 5, current: 6 }, { file: 'd.tsx', baseline: 0, current: 1 }]);
    expect(result.improvements).toEqual([{ file: 'b.tsx', baseline: 3, current: 1 }, { file: 'c.tsx', baseline: 2, current: 0 }]);
  });
  it('passes when counts are equal or lower', () => {
    expect(compareToBaseline({ 'a.tsx': 2 }, { 'a.tsx': 2 }).violations).toEqual([]);
  });
});

describe('committed baseline', () => {
  it('has no entries for the design system itself', () => {
    const baseline = JSON.parse(readFileSync(resolve(process.cwd(), 'src/design/palette-baseline.json'), 'utf8')) as Record<string, number>;
    expect(Object.keys(baseline).filter((file) => file.startsWith('src/components/ui/') || file.startsWith('src/design/'))).toEqual([]);
  });
});
