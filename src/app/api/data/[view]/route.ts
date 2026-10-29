import { belongsToReport } from '@/lib/explorer/public-fields';
import { marketCoverage } from '@/lib/market/active';
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { parseExplorerQuery, ExplorerError } from '@/lib/explorer/query';
import { readArchive, readReport } from '@/lib/explorer/read';
import {
  archiveRows,
  deriveData,
  filterRows,
  latestReports,
  reportStatus,
  scoreInputs,
} from '@/lib/explorer/derive';
import { explorerCatalog } from '@/lib/explorer/catalog';
import { rowsCsv } from '@/lib/explorer/csv';
import { hash, sourceDay } from '@/lib/usda/adapter';
import type { DataRow } from '@/lib/explorer/types';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const views = ['history', 'rows', 'report', 'catalog', 'score', 'export'];
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ view: string }> }
) {
  try {
    const { view } = await params;
    if (!views.includes(view))
      throw new ExplorerError('Unknown explorer resource.', 404);
    const limit = checkRateLimit(
      request,
      view === 'export' || view === 'report' ? 'data-download' : 'data-read',
      view === 'export' || view === 'report' ? 10 : 60
    );
    if (!limit.allowed)
      return NextResponse.json(
        { error: 'Too many requests. Try again shortly.' },
        {
          status: 429,
          headers: { 'Retry-After': String(limit.resetInSeconds) },
        }
      );
    if (view === 'catalog')
      return NextResponse.json(
        { ingredients: explorerCatalog() },
        { headers: { 'Cache-Control': 'public, max-age=300' } }
      );
    const query = parseExplorerQuery(request.nextUrl.searchParams);
    if (view === 'report') {
      if (!query.version || query.version.startsWith('demo-'))
        throw new ExplorerError('Select a stored USDA report version.');
      if (query.mode === 'demo') throw new ExplorerError('Stored USDA reports are unavailable in demonstration mode.', 404);
      const report = await readReport(query.version);
      return NextResponse.json(report, {
        headers: {
          'Cache-Control': 'public, max-age=60',
          ...(request.nextUrl.searchParams.get('download') === '1'
            ? {
                'Content-Disposition': `attachment; filename="usda-${report.slug}-${report.id}.json"`,
              }
            : {}),
        },
      });
    }
    if (view === 'score') {
      // Date/source/variety filters are for exploration, never a hidden change to scoring policy.
      const now = new Date(query.asof);
      const today = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Denver',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(now);
      const start = new Date(`${today}T12:00:00Z`);
      start.setUTCDate(start.getUTCDate() - 41);
      const scoringQuery = {
        ...query,
        start: start.toISOString().slice(0, 10),
        end: today,
        source: '',
        region: '',
        snapshot: '',
      };
      const read = await readArchive(scoringQuery);
      const result = deriveData(read.archive, scoringQuery, read.mode);
      return NextResponse.json(
        {
          score: result.score,
          inputs: scoreInputs(read.archive, scoringQuery),
          mode: result.mode,
          asof: result.asof,
          context:
            'Most recent retained offer cycle within the last six weeks, recomputed using today’s policy and currently usable stored benchmarks. Not a historical score or a promise to match unarchived dashboard offers.',
        },
        { headers: { 'Cache-Control': 'no-store' } }
      );
    }
    const read = await readArchive(query);
    const result = deriveData(read.archive, query, read.mode);
    if (view === 'history')
      return NextResponse.json({ ...result, tracking: read.mode === 'demo' ? null : await marketCoverage(query.zip) }, {
        headers: { 'Cache-Control': 'no-store' },
      });
    let rows: DataRow[];
    let selectedVersion: string | undefined;
    if (query.dataset === 'original') {
      const latest = latestReports(read.archive.reports);
      const reports = read.archive.reports
        .filter(
          (r) =>
            (!query.version || query.version === r.id) &&
            r.config.mappings.some(
              (m) => m.ingredientId === query.ingredient
            ) &&
            (query.status === 'all' || reportStatus(r, latest) === query.status)
        )
        .sort(
          (a, b) =>
            b.period_end.localeCompare(a.period_end) ||
            b.published_at.localeCompare(a.published_at) ||
            a.id.localeCompare(b.id)
        );
      const selected = reports[0];
      selectedVersion = selected?.id;
      if (!selected) rows = [];
      else {
        const report = await readReport(selected.id);
        rows = report.payload.flatMap((section) =>
          section.results.flatMap((original) => {
            let day: string;
            try {
              day = sourceDay(original[report.config.fields.periodEnd]);
            } catch {
              return [];
            }
            if (!belongsToReport(original, report.config, report)) return [];
            const matching = report.config.mappings.filter((m) =>
              Object.entries(m.equals).every(
                ([k, v]) => String(original[k] ?? '') === v
              )
            );
            const rawPrice = Number(original[report.config.fields.price]);
            return [
              {
                id: `${report.id}:${hash({ sectionName: section.reportSection, row: original })}`,
                date: day,
                source: 'USDA',
                ingredient:
                  matching.length === 1 ? matching[0].ingredientId : 'unmapped',
                variety: String(
                  original.variety || original.type || original.commodity || ''
                ),
                store: '',
                region:
                  report.config.regions[
                    String(original[report.config.fields.region])
                  ] || String(original[report.config.fields.region] || ''),
                price:
                  Number.isFinite(rawPrice) && rawPrice > 0 ? rawPrice : null,
                unit: String(original[report.config.fields.unit] || ''),
                version: report.id,
                status: reportStatus(selected, latest),
                details: {
                  original,
                  section: section.reportSection,
                  mappedIngredient:
                    matching.length === 1 ? matching[0].ingredientId : null,
                  representation: report.representation,
                },
              },
            ];
          })
        );
      }
    } else rows = archiveRows(read.archive, query, read.mode);
    // Include a current-policy trace only when the selected window contains the complete
    // six-week scoring range; narrower or historical exploration must not imply replayed scores.
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Denver',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(query.asof));
    const scoringStart = new Date(`${today}T12:00:00Z`);
    scoringStart.setUTCDate(scoringStart.getUTCDate() - 41);
    const cutoff = scoringStart.toISOString().slice(0, 10);
    if (
      query.dataset === 'calculated' &&
      query.end === today &&
      query.start <= cutoff &&
      result.score &&
      result.score.cycle >= cutoff
    ) {
      rows.push({
        id: `score:${query.ingredient}:${result.score.trace.policyVersion}:${result.score.cycle}`,
        date: result.score.cycle,
        source: 'PANTRYBOT',
        ingredient: query.ingredient,
        variety: `Value score ${result.score.trace.valueScore}/100`,
        store: '',
        region: '',
        price: null,
        unit: 'score',
        version: '',
        status: read.mode === 'demo' ? 'synthetic_demo' : 'accepted',
        details: {
          kind: 'Current-policy recomputation over the latest retained offer cycle; not a recorded historical score.',
          evaluatedAt: query.asof,
          ...result.score,
        },
      });
    }
    rows = filterRows(rows, query);
    if (view === 'export') {
      if (rows.length > 10000)
        throw new ExplorerError(
          'More than 10,000 rows match. Narrow the filters before exporting.',
          413
        );
      const metadata = JSON.stringify({
        dataset: query.dataset,
        filters: { ...query, page: undefined },
        snapshot: result.snapshot,
        mode: read.mode,
        asof: query.asof,
        selectedVersion,
        units:
          query.dataset === 'original'
            ? 'Original source units; see unit column.'
            : 'Normalized dollars per unit.',
        revisionPolicy:
          'Latest accepted USDA version per source period; latest retrieved store-offer revision per offer/week. Use status=all to inspect revisions.',
        attribution:
          'USDA rows: U.S. Department of Agriculture. Store rows: retained PantryBot offer projections.',
      });
      return new NextResponse(rowsCsv(rows), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="pantrybot-${query.dataset}.csv"`,
          'Cache-Control': 'no-store',
          'X-Export-Metadata': encodeURIComponent(metadata),
          'Access-Control-Expose-Headers': 'X-Export-Metadata',
        },
      });
    }
    return NextResponse.json(
      {
        rows: rows.slice(query.page * 100, (query.page + 1) * 100),
        total: rows.length,
        page: query.page,
        pageSize: 100,
        snapshot: result.snapshot,
        asof: query.asof,
        mode: read.mode,
        selectedVersion,
        note:
          query.dataset === 'original'
            ? 'All retained market rows in the selected report period, including other ingredients and unmapped rows. Ingredient selects the report; it does not hide its other commodities.'
            : undefined,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    const known = error instanceof ExplorerError;
    if (!known) console.error('data_explorer_read_failed');
    return NextResponse.json(
      {
        error: known
          ? error.message
          : 'The data explorer could not load this resource. Please retry.',
      },
      {
        status: known ? error.status : 503,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  }
}
