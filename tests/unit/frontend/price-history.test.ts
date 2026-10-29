import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import PriceHistory from '@/components/explorer/PriceHistory';
import type { HistoryPoint } from '@/lib/explorer/types';

function render(points: HistoryPoint[]) {
  return renderToStaticMarkup(createElement(PriceHistory, {
    points, start: '2026-10-01', end: '2026-10-29', onRows: () => {},
  }));
}
const benchmark: HistoryPoint = {
  date: '2026-10-23', series: 'USDA NATIONAL', price: 1.2, unit: 'lb', ids: ['usda'],
};
describe('price history summary coverage', () => {
  it('summarizes USDA-only history without implying local observations', () => {
    const html = render([benchmark, { ...benchmark, date: '2026-10-16', price: 1 }]);
    expect(html).toContain('Lowest USDA benchmark');
    expect(html).toContain('USDA mean / median');
    expect(html).toContain('$1.10');
    expect(html).toContain('Highest USDA benchmark');
    expect(html).toContain('No local weeks observed.');
  });
  it('keeps local summary statistics separate from USDA benchmarks', () => {
    const html = render([benchmark, { ...benchmark, series: 'SAFEWAY', price: 0.8 }]);
    expect(html).toContain('Highest observed weekly best');
    expect(html).toContain('Best observed store price each week · 1 weeks');
    expect(html).not.toContain('Lowest USDA benchmark');
  });
  it('handles an empty history without inventing prices', () => {
    const html = render([]);
    expect(html).toContain('No observations for the visible series.');
    expect(html).not.toContain('Lowest USDA benchmark');
  });
});
