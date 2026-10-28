import { currentAdCycle } from '@/lib/offer-freshness';
import { marketClient, asJson } from '@/lib/market/client';
import { parseReport, validateConfig } from './adapter';
import { reportQuery, UsdaTransport } from './transport';

export async function ingestUsda(options: { trigger?: 'scheduled' | 'recovery' | 'backfill'; reason?: string; cycle?: string } = {}) {
  if (process.env.USDA_INGEST_ENABLED !== 'true') return { status: 'disabled', requests: 0 };
  const client = marketClient();
  if (!client) return { status: 'unavailable', reason: 'cloud_not_configured', requests: 0 };
  const cycle = options.cycle ?? currentAdCycle().start;
  const trigger = options.trigger ?? 'scheduled';
  const { data: catalog, error: catalogError } = await client.from('usda_report_catalog').select('slug,title,config').eq('enabled', true).not('validated_at', 'is', null).limit(20);
  if (catalogError) return { status: 'unavailable', reason: 'catalog_unavailable', requests: 0 };
  if (!catalog?.length) return { status: 'disabled', reason: 'no_validated_reports', requests: 0 };
  const { data: run, error: claimError } = await client.rpc('claim_usda_run', { p_cycle: cycle, p_trigger: trigger, p_reason: options.reason ?? 'Wednesday scheduled batch' });
  if (claimError) return { status: 'unavailable', reason: 'claim_failed', requests: 0 };
  if (!run) return { status: 'duplicate', requests: 0 };
  const key = process.env.USDA_MARS_API_KEY?.trim();
  const transport = new UsdaTransport(key ?? '');
  const outcomes: Record<string, string> = {};
  const until = trigger === 'backfill' ? new Date(`${cycle}T12:00:00Z`) : new Date();
  const since = new Date(until); since.setUTCDate(since.getUTCDate() - (trigger === 'backfill' ? 6 : 14));
  if (!key) outcomes.configuration = 'missing_usda_key';
  else {
    // Sequential requests keep concurrency below two and simplify the shared request budget.
    for (const entry of catalog) {
      try {
        const config = validateConfig(entry.config);
        const payload = await transport.get(`/${entry.slug}`, reportQuery(since.toISOString().slice(0, 10), until.toISOString().slice(0, 10)));
        const reports = parseReport(payload, config);
        if (reports.some((report) => report.period_start < since.toISOString().slice(0,10) || report.period_start > until.toISOString().slice(0,10))) throw new Error('query_window_mismatch');
        const results: string[] = [];
        for (const report of reports) {
          const { data, error } = await client.rpc('publish_usda_report', {
            p_run: run, p_report: asJson({ ...report, rows: undefined, slug: entry.slug }), p_rows: asJson(report.rows),
          });
          if (error) throw new Error('publication_failed');
          results.push(String(data));
        }
        outcomes[entry.slug] = results.includes('published') ? 'published' : results.every((r) => r === 'unchanged') ? 'unchanged' : results.join(',');
      } catch (error) {
        const safeCodes = ['usda_auth_failed','usda_retry_exhausted','request_budget_exhausted','incomplete_report','publication_failed','missing_sections_or_periods'];
        outcomes[entry.slug] = error instanceof Error && safeCodes.includes(error.message) ? error.message : 'report_validation_or_fetch_failed';
        if (outcomes[entry.slug] === 'usda_auth_failed' || outcomes[entry.slug] === 'request_budget_exhausted') break;
      }
    }
  }
  const values = Object.values(outcomes);
  const usable = values.filter((s) => s === 'published' || s === 'unchanged').length;
  const status = usable === catalog.length ? values.every((s) => s === 'unchanged') ? 'unchanged' : 'succeeded' : usable ? 'partial' : 'failed';
  const { error } = await client.rpc('finish_usda_run', { p_run: run, p_status: status, p_requests: transport.requests, p_outcomes: outcomes });
  console.info(JSON.stringify({ event: 'usda_ingestion', run, status: error ? 'unavailable' : status, requests: transport.requests, outcomes }));
  return { status: error ? 'unavailable' : status, runId: run, requests: transport.requests, outcomes };
}
