// The Data Explorer's header, chart and theme opt-in (v2.0 M4-7a): Back to Settings with a "Data Explorer" title, a chart whose lines take
// the theme-aware series variables and scroll sideways on narrow screens, and the page opting into the token color scheme. The colors
// themselves are guarded in tests/unit/design/explorer-tokens.test.ts.
import { Children, createElement, isValidElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import PriceHistory from '@/components/explorer/PriceHistory';
import TokenScope from '@/design/TokenScope';
import type { HistoryPoint } from '@/lib/explorer/types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: () => undefined, replace: () => undefined }),
  useSearchParams: () => new URLSearchParams(''),
}));

const point = (series: string, date: string, price: number): HistoryPoint => ({ date, series, price, unit: 'lb', ids: [`${series}-${date}`] });
const points = [
  point('SAFEWAY', '2026-10-16', 1.2), point('SAFEWAY', '2026-10-23', 0.9),
  point('ALDI', '2026-10-16', 1.4), point('ALDI', '2026-10-23', 1.1),
];
const chart = () => renderToStaticMarkup(createElement(PriceHistory, { points, start: '2026-10-01', end: '2026-10-29', onRows: () => undefined }));

describe('the Explorer header', () => {
  it('has Back to Settings, the page title and the way back to meal planning, with one h1', async () => {
    const { default: DataExplorer } = await import('@/components/explorer/DataExplorer');
    const { explorerCatalog } = await import('@/lib/explorer/catalog');
    const html = renderToStaticMarkup(createElement(DataExplorer, { catalog: explorerCatalog(), today: '2026-11-20' }));
    const header = html.slice(html.indexOf('<header'), html.indexOf('</header>'));
    expect(header).toMatch(/<a class="ex-back" href="\/settings">.*<span>Back<\/span><\/a>/);
    expect(header).toContain('<p class="ex-title">Data Explorer</p>');
    expect(header).toMatch(/<a class="ex-note" href="\/">Back to meal planning<\/a>/);
    expect(html.match(/<h1[ >]/g)).toHaveLength(1);
  });
});

describe('the price chart', () => {
  it('draws each series line and dot in a theme-aware series variable, in order', () => {
    const html = chart();
    const lines = [...html.matchAll(/<path[^>]*style="stroke:(var\(--ex-s\d\))/g)].map((m) => m[1]);
    expect(lines).toEqual(['var(--ex-s1)', 'var(--ex-s2)']);
    const dots = [...html.matchAll(/<circle[^>]*class="ex-dot-fill"[^>]*style="stroke:(var\(--ex-s\d\))/g)].map((m) => m[1]);
    expect(dots).toEqual(['var(--ex-s1)', 'var(--ex-s1)', 'var(--ex-s2)', 'var(--ex-s2)']);
    expect(html).toContain('style="background:var(--ex-s1)"');
    expect(html).not.toMatch(/stroke="#|fill="#|fill="white"/);
  });

  it('takes the gridlines, axis labels and dot fill from classes the stylesheet themes', () => {
    const html = chart();
    expect(html).toContain('class="ex-grid-line"');
    expect(html).toContain('class="ex-axis-label"');
  });

  it('scrolls sideways on a narrow screen: a focusable, named region around the chart', () => {
    const html = chart();
    expect(html).toMatch(/<div class="ex-chart-scroll" role="region" aria-label="Price chart[^"]*" tabindex="0"><svg class="ex-chart"/);
  });

  it('shades the weekly pattern cells from the theme tokens, not a fixed green', () => {
    const html = chart();
    expect(html).toMatch(/background:color-mix\(in srgb, var\(--ds-save\) \d+%, var\(--ds-surface\)\)/);
    expect(html).not.toContain('rgba(');
  });
});

describe('the /data page', () => {
  it('opts into the token color scheme and shows the footer around the Explorer', async () => {
    const { default: DataPage } = await import('@/app/data/page');
    const tree = DataPage() as ReactElement<{ children: unknown }>;
    const types = Children.toArray(tree.props.children as never).filter(isValidElement).map((child) => child.type);
    expect(types).toContain(TokenScope);
    const { default: AppFooter } = await import('@/components/AppFooter');
    expect(types).toContain(AppFooter);
  });
});
