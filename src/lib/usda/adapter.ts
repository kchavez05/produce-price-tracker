import { createHash } from 'node:crypto';
import { CANONICAL_INGREDIENTS } from '@/data/canonical-ingredients';

export interface ReportConfig {
  adapterVersion: string;
  timezone: string;
  cadenceDays: number;
  graceDays: number;
  sections: string[];
  sourceSlug?: string;
  requireStatistics?: boolean;
  publicationClock?: 'source_unspecified';
  fields: { section: string; rows: string; periodStart: string; periodEnd: string; publishedAt: string; price: string; unit: string; region: string; featurePct?: string; weight?: string };
  regions: Record<string, 'MOUNTAIN' | 'NATIONAL'>;
  units: Record<string, { unit: 'lb' | 'doz'; multiplier: number }>;
  mappings: { ingredientId: string; equals: Record<string, string> }[];
  metric: 'retail_advertised_price';
}
export interface NormalizedObservation {
  row_key: string; ingredient_id: string; region: 'MOUNTAIN' | 'NATIONAL'; value: number;
  unit: 'lb' | 'doz'; feature_pct: number | null; original: Record<string, unknown>;
}
export interface ParsedReport {
  period_start: string; period_end: string; published_at: string; payload: unknown;
  content_hash: string; adapter_version: string; rows: NormalizedObservation[];
}
export function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('invalid_object');
  return value as Record<string, unknown>;
}
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
    .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(',')}}`;
  return JSON.stringify(value) ?? 'null';
}
export function hash(value: unknown) { return createHash('sha256').update(canonicalJson(value)).digest('hex'); }
export function sourceDay(value: unknown): string {
  const raw = String(value ?? '');
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw);
  const day = match ? `${match[3]}-${match[1]}-${match[2]}` : raw;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isFinite(Date.parse(day)) || new Date(`${day}T12:00:00Z`).toISOString().slice(0, 10) !== day) throw new Error('invalid_source_date');
  return day;
}
export function validateConfig(input: unknown): ReportConfig {
  const c = record(input) as unknown as ReportConfig;
  if (c.metric !== 'retail_advertised_price' || !c.adapterVersion || !c.timezone ||
    !Number.isFinite(c.cadenceDays) || c.cadenceDays <= 0 || !Number.isFinite(c.graceDays) || c.graceDays < 0 ||
    !c.sections?.length || !c.mappings?.length || !c.regions || !c.units || !c.fields) throw new Error('invalid_config');
  new Intl.DateTimeFormat('en-CA', { timeZone: c.timezone });
  for (const field of ['section','rows','periodStart','periodEnd','publishedAt','price','unit','region'] as const) {
    if (typeof c.fields[field] !== 'string' || !c.fields[field]) throw new Error('invalid_field');
  }
  if (Object.values(c.regions).some((region) => !['MOUNTAIN','NATIONAL'].includes(region))) throw new Error('invalid_region');
  for (const conversion of Object.values(c.units)) {
    if (!['lb','doz'].includes(conversion.unit) || !Number.isFinite(conversion.multiplier) || conversion.multiplier <= 0) throw new Error('invalid_unit');
  }
  for (const mapping of c.mappings) {
    if (!CANONICAL_INGREDIENTS.some((i) => i.id === mapping.ingredientId) || !Object.keys(mapping.equals).length) throw new Error('invalid_mapping');
  }
  return c;
}
function numeric(value: unknown): number | null {
  if (value == null || String(value).trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Strict section adapter. Unknown/truncated envelopes fail closed until source validation updates the adapter. */
export function parseReport(payload: unknown, config: ReportConfig, now = new Date()): ParsedReport[] {
  const root = Array.isArray(payload) ? payload : record(payload).results;
  if (!Array.isArray(root)) throw new Error('invalid_sections');
  const groups = new Map<string, ParsedReport>();
  const seenSections = new Set<string>();
  for (const item of root) {
    const section = record(item);
    const sectionName = String(section[config.fields.section] ?? '');
    if (!config.sections.includes(sectionName)) continue;
    if (seenSections.has(sectionName)) throw new Error('duplicate_section');
    seenSections.add(sectionName);
    const rows = section[config.fields.rows];
    if (config.requireStatistics && !section.stats) throw new Error('missing_statistics');
    if (!Array.isArray(rows)) throw new Error('invalid_rows');
    // Never publish known partial data. Unsupported pagination is an explicit validation failure.
    for (const holder of [section, Array.isArray(payload) ? {} : record(payload)]) {
      if (holder.next || holder.next_page || holder.has_more === true || holder.truncated === true) throw new Error('incomplete_report');
      const stats = holder.stats && typeof holder.stats === 'object' ? record(holder.stats) : {};
      const count = holder.total_rows ?? holder.totalRows ?? stats.totalRows;
      if (stats.returnedRows != null && numeric(stats.returnedRows) !== rows.length) throw new Error('incomplete_report');
      if (count != null && numeric(count) !== rows.length) throw new Error('incomplete_report');
    }
    for (const input of rows) {
      const row = record(input);
      if (config.sourceSlug && String(row.slug_id) !== config.sourceSlug) throw new Error('report_identity_mismatch');
      const start = sourceDay(row[config.fields.periodStart]);
      const end = sourceDay(row[config.fields.periodEnd]);
      const rawPublished = String(row[config.fields.publishedAt] ?? '');
      const localTime = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})$/.exec(rawPublished);
      const published = config.publicationClock === 'source_unspecified' && localTime
        ? `${localTime[3]}-${localTime[1]}-${localTime[2]}T${localTime[4]}:${localTime[5]}:${localTime[6]}` : rawPublished;
      // MARS samples provide an unzoned source clock. Preserve its ordering without inventing a UTC offset.
      const clockValid = config.publicationClock === 'source_unspecified'
        ? /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(published)
        : /T.*(?:Z|[+-]\d{2}:\d{2})$/.test(published);
      if (!clockValid || !Number.isFinite(Date.parse(published)) ||
        published.slice(0,10) > now.toISOString().slice(0,10) || start > end || end > now.toISOString().slice(0, 10)) throw new Error('invalid_report_period');
      sourceDay(published.slice(0,10));
      const groupKey = `${start}:${end}:${published}`;
      let group = groups.get(groupKey);
      if (!group) {
        group = { period_start: start, period_end: end, published_at: published, payload, content_hash: hash(payload), adapter_version: config.adapterVersion, rows: [] };
        groups.set(groupKey, group);
      }
      const matches = config.mappings.filter((mapping) => Object.entries(mapping.equals).every(([key, value]) => String(row[key] ?? '') === value));
      const region = config.regions[String(row[config.fields.region] ?? '')];
      const conversion = config.units[String(row[config.fields.unit] ?? '')];
      const price = numeric(row[config.fields.price]);
      const feature = config.fields.featurePct ? numeric(row[config.fields.featurePct]) : null;
      const weight = config.fields.weight ? numeric(row[config.fields.weight]) : 1;
      if (weight === null || weight <= 0) continue;
      if (matches.length !== 1 || !region || !conversion || price === null || price <= 0 ||
        (feature !== null && (feature < 0 || feature > 100))) continue;
      const ingredient = CANONICAL_INGREDIENTS.find((i) => i.id === matches[0].ingredientId)!;
      const value = price * conversion.multiplier;
      if (ingredient.standardUnit !== conversion.unit || !Number.isFinite(value) || value <= 0) continue;
      group.rows.push({ row_key: hash({ sectionName, row }), ingredient_id: ingredient.id, region, value,
        unit: conversion.unit, feature_pct: feature, original: row });
    }
  }
  if (seenSections.size !== config.sections.length || !groups.size) throw new Error('missing_sections_or_periods');
  for (const group of groups.values()) group.rows = [...new Map(group.rows.map((row) => [row.row_key, row])).values()];
  return [...groups.values()].sort((a, b) => a.period_end.localeCompare(b.period_end) || a.published_at.localeCompare(b.published_at));
}
