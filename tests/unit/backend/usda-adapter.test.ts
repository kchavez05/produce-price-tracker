import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseReport, validateConfig, hash } from '@/lib/usda/adapter';
import { selectBenchmarks, type BenchmarkRow } from '@/lib/usda/read';

const now = new Date('2026-10-28T18:00:00Z');
const definition = JSON.parse(readFileSync('config/usda/2756.json','utf8'));
const config = validateConfig(definition.config);
const fixture = JSON.parse(readFileSync('tests/fixtures/usda/2756.json','utf8'));
function benchmark(extra: Partial<BenchmarkRow> = {}): BenchmarkRow {
  return { slug: '2756', version_id: 'version-1', period_end: '2026-10-23', fetched_at: now.toISOString(), checked_at: now.toISOString(),
    ingredient_id: 'chicken-thighs-boneless', region: 'NATIONAL', value: 3, unit: 'lb', feature_pct: 0, config,
    original: { store_count: 10 }, ...extra };
}
describe('validated USDA source adapters', () => {
  for (const slug of [3324,3228,2868,2756,2995]) {
    it(`parses real source excerpts for ${slug} with source dates and compatible units`, () => {
      const c = validateConfig(JSON.parse(readFileSync(`config/usda/${slug}.json`,'utf8')).config);
      const data = JSON.parse(readFileSync(`tests/fixtures/usda/${slug}.json`,'utf8'));
      const reports = parseReport(data,c,now);
      expect(reports[0].period_end).toBe('2026-10-23');
      expect(reports[0].rows.length).toBeGreaterThan(0);
      expect(reports[0].rows.every((row) => row.region === 'NATIONAL' && row.unit === 'lb' && row.value>0)).toBe(true);
      expect(reports[0].published_at).not.toContain('Z'); // source clock has no claimed timezone
    });
  }
  it('rejects truncated sections, missing sections, invalid dates and incompatible metrics', () => {
    expect(() => parseReport([{ ...fixture[0], stats: { totalRows: 999 } }],config,now)).toThrow('incomplete_report');
    expect(() => parseReport([],config,now)).toThrow();
    const bad = structuredClone(fixture); bad[0].results[0].report_end_date='02/30/2026';
    expect(() => parseReport(bad,config,now)).toThrow();
    expect(() => validateConfig({ ...config,metric:'wholesale_cutout' })).toThrow();
  });
  it('leaves ambiguous mappings and unknown units unmapped without discarding raw data', () => {
    const duplicate = { ...config, mappings: [...config.mappings,...config.mappings] };
    const reports = parseReport(fixture,duplicate,now);
    expect(reports.every((r) => r.rows.length === 0)).toBe(true);
    expect(reports[0].payload).toEqual(fixture);
    expect(hash({ b:1,a:2 })).toEqual(hash({ a:2,b:1 }));
  });
});
describe('USDA stored benchmark selection', () => {
  it('preserves a valid zero feature percentage and weights compatible observations', () => {
    const selection=selectBenchmarks([benchmark({ value:2 }),benchmark({ value:4, original:{ store_count:30 } })],now);
    expect(selection.overrides['chicken-thighs-boneless']).toEqual({ mountainBaseline:3.5,mountainAdFeaturePct:0 });
    expect(selection.provenance['chicken-thighs-boneless'].region).toBe('NATIONAL');
  });
  it('prefers a compatible Mountain series without mixing it with national values', () => {
    const selection=selectBenchmarks([benchmark({ value:20 }),benchmark({ region:'MOUNTAIN',value:2 })],now);
    expect(selection.overrides['chicken-thighs-boneless'].mountainBaseline).toBe(2);
  });
  it('uses source-period age rather than fetch time and stops applying values after fourteen days', () => {
    expect(selectBenchmarks([benchmark()],new Date('2026-11-02T18:00:00Z')).status).toBe('stale');
    expect(selectBenchmarks([benchmark({ fetched_at:'2026-11-07T18:00:00Z' })],new Date('2026-11-07T18:00:00Z')).status).toBe('fallback');
    expect(selectBenchmarks([benchmark({ period_end:'2026-11-01' })],now).status).toBe('fallback');
  });
});
