import type { ReportConfig } from '@/lib/usda/adapter';
/** Audited USDA market fields. Unknown fields are omitted, not blindly published. */
const USDA_FIELDS = new Set(
  `commodity community condition environment final_ind market_type office_city office_code office_name office_state organic package package_size price_avg price_max price_min price_unit prior_WK_store_count prior_WK_wtd_avg_price prior_YR_store_count prior_YR_wtd_avg_price published_date quality_grade region reportSection report_begin_date report_date report_end_date report_title size slug_id slug_name store_count type variety wtd_avg_price`.split(
    ' '
  )
);
export function publicSourceRow(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(
      ([key, v]) =>
        USDA_FIELDS.has(key) &&
        (v === null || ['string', 'number', 'boolean'].includes(typeof v))
    )
  );
}
/** Sanitized source envelope preserves selected market fields, including unmapped rows. */
export function publicReport(payload: unknown) {
  const envelope =
    payload && typeof payload === 'object' && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : {};
  const sections = Array.isArray(payload) ? payload : envelope.results;
  if (!Array.isArray(sections)) return [];
  return sections.map((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item))
      return { reportSection: 'Unknown', results: [] };
    const section = item as Record<string, unknown>;
    return {
      reportSection: String(section.reportSection || ''),
      results: Array.isArray(section.results)
        ? section.results.map(publicSourceRow)
        : [],
    };
  });
}
export const REPORT_BYTE_LIMIT = 4_000_000; // Matches the archive's enforced JSON payload cap.

export function publicConfig(c: ReportConfig): ReportConfig {
  return {
    adapterVersion: c.adapterVersion,
    timezone: c.timezone,
    cadenceDays: c.cadenceDays,
    graceDays: c.graceDays,
    sections: c.sections,
    sourceSlug: c.sourceSlug,
    requireStatistics: c.requireStatistics,
    publicationClock: c.publicationClock,
    metric: c.metric,
    regions: c.regions,
    units: Object.fromEntries(
      Object.entries(c.units).map(([key, v]) => [
        key,
        { unit: v.unit, multiplier: v.multiplier },
      ])
    ),
    fields: {
      section: c.fields.section,
      rows: c.fields.rows,
      periodStart: c.fields.periodStart,
      periodEnd: c.fields.periodEnd,
      publishedAt: c.fields.publishedAt,
      price: c.fields.price,
      unit: c.fields.unit,
      region: c.fields.region,
      featurePct: c.fields.featurePct,
      weight: c.fields.weight,
    },
    mappings: c.mappings.map((m) => ({
      ingredientId: m.ingredientId,
      equals: m.equals,
    })),
  };
}

/** One response envelope can contain several source periods/publication revisions. */
export function belongsToReport(
  row: Record<string, unknown>,
  config: ReportConfig,
  report: { period_start: string; period_end: string; published_at: string }
) {
  const day = (value: unknown) => {
    const raw = String(value ?? '');
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw);
    return m ? `${m[3]}-${m[1]}-${m[2]}` : raw;
  };
  const raw = String(row[config.fields.publishedAt] ?? '');
  const m = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})$/.exec(raw);
  const clock = m
    ? `${m[3]}-${m[1]}-${m[2]}T${m[4]}:${m[5]}:${m[6]}`
    : raw.replace(' ', 'T');
  return (
    day(row[config.fields.periodStart]) === report.period_start &&
    day(row[config.fields.periodEnd]) === report.period_end &&
    clock.slice(0, 19) === report.published_at.replace(' ', 'T').slice(0, 19)
  );
}
