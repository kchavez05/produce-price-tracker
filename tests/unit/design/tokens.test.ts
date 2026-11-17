import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { contrastRatio } from '@/design/contrast';
import { THEMES, colorTokens, textContrastPairs, uiContrastPairs } from '@/design/tokens';
import { renderTokensCss } from '@/design/render-css';

describe('design tokens', () => {
  it('keeps the generated CSS in sync with tokens.ts', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/design/tokens.css'), 'utf8');
    expect(css).toBe(renderTokensCss());
  });

  it('computes known WCAG ratios', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
  });

  for (const theme of THEMES) {
    describe(`${theme} theme`, () => {
      it.each(textContrastPairs)('text %s on %s is at least 4.5:1', (fg, bg) => {
        expect(contrastRatio(colorTokens[fg][theme], colorTokens[bg][theme])).toBeGreaterThanOrEqual(4.5);
      });
      it.each(uiContrastPairs)('UI %s against %s is at least 3:1', (fg, bg) => {
        expect(contrastRatio(colorTokens[fg][theme], colorTokens[bg][theme])).toBeGreaterThanOrEqual(3);
      });
    });
  }
});
