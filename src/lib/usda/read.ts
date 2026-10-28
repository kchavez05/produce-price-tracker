import { marketClient } from '@/lib/market/client';
import { CANONICAL_INGREDIENTS } from '@/data/canonical-ingredients';
import { record, sourceDay, validateConfig, type ReportConfig } from './adapter';

export interface UsdaProvenance {
  status: 'current' | 'stale' | 'fallback'; reason?: string; reportSlug?: string; periodEnd?: string;
  region?: 'MOUNTAIN' | 'NATIONAL'; versionId?: string; fetchedAt?: string; checkedAt?: string;
  unit?: string; aggregation?: 'weighted_mean' | 'unweighted_mean';
}
export interface BenchmarkRow {
  slug: string; version_id: string; period_end: string; fetched_at: string; checked_at: string;
  ingredient_id: string; region: 'MOUNTAIN' | 'NATIONAL'; value: number; unit: string;
  feature_pct: number | null; config: ReportConfig; original?: Record<string, unknown>;
}
export interface UsdaReadResult {
  usdaLive: boolean; status: 'current' | 'stale' | 'fallback'; reason?: string;
  provenance: Record<string, UsdaProvenance>;
  overrides: Record<string, { mountainBaseline?: number; mountainAdFeaturePct?: number }>;
}
export function selectBenchmarks(rows: BenchmarkRow[], now = new Date()): UsdaReadResult {
  const result: UsdaReadResult = { usdaLive: false, status: 'fallback', overrides: {}, provenance: {} };
  for (const ingredient of CANONICAL_INGREDIENTS) {
    const candidates = rows.filter((row) => row.ingredient_id === ingredient.id && row.unit === ingredient.standardUnit &&
      Number.isFinite(Number(row.value)) && Number(row.value) > 0).flatMap((row) => {
      try {
        const config = validateConfig(row.config);
        const today = new Intl.DateTimeFormat('en-CA', { timeZone: config.timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
        const age = (Date.parse(today) - Date.parse(row.period_end)) / 86400000;
        if (!Number.isFinite(age) || age < 0 || age > 14) return [];
        return [{ row, config, age }];
      } catch { return []; }
    }).sort((a, b) => Number(b.row.region === 'MOUNTAIN') - Number(a.row.region === 'MOUNTAIN') ||
      b.row.period_end.localeCompare(a.row.period_end) || a.row.slug.localeCompare(b.row.slug));
    const chosen = candidates[0];
    if (!chosen) { result.provenance[ingredient.id] = { status: 'fallback', reason: 'no_compatible_recent_report' }; continue; }
    const compatible = candidates.filter(({ row }) => row.version_id === chosen.row.version_id && row.region === chosen.row.region);
    const weightField = chosen.config.fields.weight;
    const weights = compatible.map(({ row }) => weightField ? Number(row.original?.[weightField]) : 1);
    if (weights.some((w) => !Number.isFinite(w) || w <= 0)) { result.provenance[ingredient.id] = { status: 'fallback', reason: 'invalid_weights' }; continue; }
    const denominator = weights.reduce((a, b) => a + b, 0);
    const mean = compatible.reduce((sum, { row }, index) => sum + Number(row.value) * weights[index], 0) / denominator;
    const featureRows = compatible.filter(({ row }) => row.feature_pct !== null && Number(row.feature_pct) >= 0 && Number(row.feature_pct) <= 100);
    result.overrides[ingredient.id] = { mountainBaseline: mean,
      ...(featureRows.length === compatible.length ? { mountainAdFeaturePct: compatible.reduce((sum, { row }, i) => sum + Number(row.feature_pct) * weights[i], 0) / denominator } : {}),
    };
    const status = chosen.age <= chosen.config.cadenceDays + chosen.config.graceDays ? 'current' : 'stale';
    result.provenance[ingredient.id] = { status, reportSlug: chosen.row.slug, periodEnd: chosen.row.period_end,
      region: chosen.row.region, versionId: chosen.row.version_id, fetchedAt: chosen.row.fetched_at, checkedAt: chosen.row.checked_at,
      unit: chosen.row.unit, aggregation: weightField ? 'weighted_mean' : 'unweighted_mean' };
  }
  const statuses = Object.values(result.provenance).map((p) => p.status);
  result.usdaLive = statuses.some((s) => s !== 'fallback'); // compatibility: stored verified coverage, never an upstream call
  result.status = statuses.includes('stale') ? 'stale' : statuses.includes('current') ? 'current' : 'fallback';
  return result;
}
export function parseBenchmarkRows(input: unknown): BenchmarkRow[] {
  if (!Array.isArray(input)) return [];
  return input.flatMap((item) => {
    try {
      const row = record(item);
      const config = validateConfig(row.config);
      if (!['MOUNTAIN','NATIONAL'].includes(String(row.region)) || !['lb','doz'].includes(String(row.unit)) ||
        ['slug','version_id','ingredient_id','fetched_at','checked_at'].some((key) => typeof row[key] !== 'string')) return [];
      const value = Number(row.value);
      if (!Number.isFinite(value) || value <= 0) return [];
      const feature = row.feature_pct === null || row.feature_pct === undefined ? null : Number(row.feature_pct);
      if (feature !== null && (!Number.isFinite(feature) || feature < 0 || feature > 100)) return [];
      return [{ slug: String(row.slug), version_id: String(row.version_id), ingredient_id: String(row.ingredient_id),
        period_end: sourceDay(row.period_end), fetched_at: String(row.fetched_at), checked_at: String(row.checked_at),
        config, value, feature_pct: feature, region: row.region as 'MOUNTAIN' | 'NATIONAL', unit: String(row.unit),
        original: row.original ? record(row.original) : undefined }];
    } catch { return []; }
  });
}
export async function readUsdaBenchmarks(now = new Date()): Promise<UsdaReadResult> {
  const client = marketClient();
  if (!client) return { ...selectBenchmarks([], now), reason: 'cloud_not_configured' };
  try {
    const { data, error } = await client.rpc('read_usda_benchmarks').retry(false);
    if (error || !Array.isArray(data)) throw new Error('read_failed');
    return selectBenchmarks(parseBenchmarkRows(data), now);
  } catch { return { ...selectBenchmarks([], now), reason: 'cloud_unavailable' }; }
}
