// Ratchet guard for raw Tailwind palette utilities (v2.0 M1). New code uses semantic tokens
// (`bg-surface`, `text-muted`); the per-file count of raw palette classes may only fall.

const PALETTES = 'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';
const PROPERTIES = 'bg|text|border|ring|from|to|via|fill|stroke|divide|outline|decoration|accent|caret|placeholder|shadow';
export const RAW_PALETTE_CLASS = new RegExp(`(?<![\\w-])(?:[a-z0-9\\[\\]:&>_-]+:)*(?:${PROPERTIES})-(?:${PALETTES})-(?:50|[1-9]00|950)(?:/\\d+)?(?![\\w-])`, 'g');

export type PaletteCounts = Record<string, number>;

export function countRawPaletteClasses(source: string): number {
  return source.match(RAW_PALETTE_CLASS)?.length ?? 0;
}

export interface RatchetResult {
  /** Files whose count rose, or that are new with a non-zero count. */
  violations: Array<{ file: string; baseline: number; current: number }>;
  /** Files whose count fell (baseline can be lowered). */
  improvements: Array<{ file: string; baseline: number; current: number }>;
}

export function compareToBaseline(baseline: PaletteCounts, current: PaletteCounts): RatchetResult {
  const violations: RatchetResult['violations'] = [];
  const improvements: RatchetResult['improvements'] = [];
  for (const [file, count] of Object.entries(current)) {
    const allowed = baseline[file] ?? 0;
    if (count > allowed) violations.push({ file, baseline: allowed, current: count });
  }
  for (const [file, allowed] of Object.entries(baseline)) {
    const count = current[file] ?? 0;
    if (count < allowed) improvements.push({ file, baseline: allowed, current: count });
  }
  return { violations, improvements };
}
