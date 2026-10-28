'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ALL_STORE_CHAINS } from '@/data/store-registry';
import type { explorerCatalog } from '@/lib/explorer/catalog';
import type { DataRow, ExplorerData, HistoryPoint } from '@/lib/explorer/types';
import PriceHistory, { money } from './PriceHistory';
type Catalog = ReturnType<typeof explorerCatalog>;
type RowsResult = {
  rows: DataRow[];
  total: number;
  page: number;
  pageSize: number;
  snapshot: string;
  asof: string;
  mode: string;
  selectedVersion?: string;
  note?: string;
};
type ReportResult = {
  representation: string;
  attribution: string;
  payload: unknown;
};
type ScoreResult = {
  score: ExplorerData['score'];
  mode: string;
  asof: string;
  context: string;
};
const TABS = [
  ['history', 'Price history'],
  ['score', 'Explain this score'],
  ['catalog', 'Ingredient catalog'],
  ['raw', 'Raw data'],
  ['sources', 'Sources & coverage'],
];
function useResource<T>(url: string | null) {
  const [state, setState] = useState<{
    url: string | null;
    data: T | null;
    error: string;
    loading: boolean;
  }>({ url: null, data: null, error: '', loading: false });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    setState({ url, data: null, error: '', loading: true });
    fetch(url, { signal: controller.signal })
      .then(async (response) => {
        const value = await response.json();
        if (!response.ok)
          throw new Error(value.error || 'Unable to load this resource.');
        return value as T;
      })
      .then((data) => setState({ url, data, error: '', loading: false }))
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setState({
            url,
            data: null,
            error:
              error instanceof Error ? error.message : 'Unable to load data.',
            loading: false,
          });
      });
    return () => controller.abort();
  }, [url, attempt]);
  return {
    ...(state.url === url
      ? state
      : { url, data: null, error: '', loading: !!url }),
    retry: () => setAttempt((n) => n + 1),
  };
}
export default function DataExplorer({
  catalog,
  today,
}: {
  catalog: Catalog;
  today: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());
  const tab = params.get('tab') || 'history';
  const ingredient = params.get('ingredient') || 'yellow-white-onions';
  const selected = catalog.find((i) => i.id === ingredient) || catalog[0];
  const end = params.get('end') || today;
  const startDate = new Date(`${end}T12:00:00Z`);
  startDate.setUTCDate(startDate.getUTCDate() - 41);
  const start =
    params.get('start') ||
    (Number.isFinite(startDate.getTime())
      ? startDate.toISOString().slice(0, 10)
      : today);
  const zip = params.get('zip') || '80542';
  const dataset = params.get('dataset') || 'normalized';
  const [exportError, setExportError] = useState('');
  const [exporting, setExporting] = useState(false);
  const core = new URLSearchParams();
  for (const key of [
    'ingredient',
    'zip',
    'start',
    'end',
    'stores',
    'source',
    'region',
    'mode',
    'asof',
    'snapshot',
  ]) {
    const value = params.get(key);
    if (value) core.set(key, value);
  }
  const history = useResource<ExplorerData>(
    ['history', 'raw', 'sources'].includes(tab)
      ? `/api/data/history?${core}`
      : null
  );
  const rowParams = new URLSearchParams(params);
  rowParams.delete('tab');
  if (history.data) {
    rowParams.set('asof', history.data.asof);
    rowParams.set('snapshot', history.data.snapshot);
  }
  const raw = useResource<RowsResult>(
    tab === 'raw' && history.data ? `/api/data/rows?${rowParams}` : null
  );
  const score = useResource<ScoreResult>(
    tab === 'score' ? `/api/data/score?${core}` : null
  );
  const reportVersion =
    params.get('version') || raw.data?.selectedVersion || '';
  const [showReport, setShowReport] = useState(false);
  const report = useResource<ReportResult>(
    tab === 'raw' && showReport && reportVersion
      ? `/api/data/report?version=${encodeURIComponent(reportVersion)}`
      : null
  );
  function href(patch: Record<string, string>, reset = true) {
    const next = new URLSearchParams(searchParams.toString());
    if (reset)
      for (const key of ['page', 'snapshot', 'asof', 'row']) next.delete(key);
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    return `/data?${next}`;
  }
  function navigate(patch: Record<string, string>) {
    setShowReport(false);
    setExportError('');
    router.push(href(patch), { scroll: false });
  }
  function underlying(point?: HistoryPoint) {
    navigate({
      tab: 'raw',
      dataset: point
        ? point.series.startsWith('USDA')
          ? 'normalized'
          : 'offers'
        : 'calculated',
      version: point?.version || '',
      row: point?.ids.length === 1 ? point.ids[0] : '',
      stores:
        point && !point.series.startsWith('USDA')
          ? point.series
          : params.get('stores') || '',
      source: point?.series.startsWith('USDA')
        ? 'USDA'
        : point
          ? ''
          : params.get('source') || '',
      region: point?.series.startsWith('USDA') ? point.series.slice(5) : '',
      status: 'accepted',
      search: '',
      variety: '',
      ...(point && !point.series.startsWith('USDA')
        ? { start: point.date, end: point.date }
        : {}),
    });
  }
  async function downloadCsv() {
    setExportError('');
    setExporting(true);
    try {
      const response = await fetch(`/api/data/export?${rowParams}`);
      if (!response.ok) {
        const value = await response.json();
        throw new Error(value.error || 'Export failed.');
      }
      const blob = await response.blob();
      saveBlob(blob, `pantrybot-${dataset}.csv`);
      const encoded = response.headers.get('X-Export-Metadata');
      if (encoded)
        saveBlob(
          new Blob(
            [JSON.stringify(JSON.parse(decodeURIComponent(encoded)), null, 2)],
            { type: 'application/json' }
          ),
          'pantrybot-export-metadata.json'
        );
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Export failed.');
    } finally {
      setExporting(false);
    }
  }
  const loading = history.loading || raw.loading || score.loading;
  const error = history.error || raw.error || score.error;
  const [ingredientSearch, setIngredientSearch] = useState('');
  return (
    <main className="explorer">
      <header className="ex-top">
        <div className="ex-shell">
          <Link href="/" className="ex-brand">
            ◒ PantryBot{' '}
            <span style={{ fontWeight: 400, color: '#7c8d80' }}>
              {' '}
              / Data lab
            </span>
          </Link>
          <Link href="/" className="ex-note">
            ← Back to meal planning
          </Link>
        </div>
      </header>
      <div className="ex-shell">
        <div className="ex-hero">
          <div>
            <span className="ex-eyebrow">Follow the numbers</span>
            <h1>Good deals. Open data.</h1>
            <p>
              Explore the prices behind your plate. Trace a value score, compare
              weekly advertisements, or go straight to the source rows.
            </p>
          </div>
          <div className="ex-seal">
            <strong>From source to score</strong>
            <br />
            USDA reports → normalized prices
            <br />
            Store offers → weekly observations
            <br />
            Transparent rules → value scores
          </div>
        </div>
        <div className="ex-filters">
          <label className="ex-ingredient">
            Ingredient
            <input
              type="search"
              placeholder="Find an ingredient or variety…"
              value={ingredientSearch}
              onChange={(e) => setIngredientSearch(e.target.value)}
            />
            <select
              aria-label="Ingredient"
              value={ingredient}
              onChange={(e) =>
                navigate({
                  ingredient: e.target.value,
                  version: '',
                  variety: '',
                })
              }
            >
              {catalog
                .filter(
                  (i) =>
                    i.id === ingredient ||
                    `${i.name} ${i.keywords.join(' ')}`
                      .toLowerCase()
                      .includes(ingredientSearch.toLowerCase())
                )
                .map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Market ZIP
            <input
              key={zip}
              name="zip"
              defaultValue={zip}
              inputMode="numeric"
              pattern="[0-9]{5}"
              maxLength={5}
              onBlur={(e) => {
                if (e.target.value !== zip) navigate({ zip: e.target.value });
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur();
              }}
              style={{ width: 100 }}
            />
          </label>
          <label>
            From
            <input
              type="date"
              value={start}
              onChange={(e) => navigate({ start: e.target.value })}
            />
          </label>
          <label>
            Through
            <input
              type="date"
              value={end}
              max={today}
              onChange={(e) => navigate({ end: e.target.value })}
            />
          </label>
          <label>
            Store
            <select
              value={params.get('stores') || ''}
              onChange={(e) => navigate({ stores: e.target.value })}
            >
              <option value="">All observed stores</option>
              {ALL_STORE_CHAINS.map((s) => (
                <option key={s} value={s}>
                  {s.replaceAll('_', ' ')}
                </option>
              ))}
              {(params.get('stores') || '').includes(',') ? (
                <option value={params.get('stores')!}>Selected stores</option>
              ) : null}
            </select>
          </label>
        </div>
        <nav className="ex-tabs" aria-label="Data explorer views">
          {TABS.map(([id, label]) => (
            <Link
              key={id}
              href={href({ tab: id }, false)}
              aria-current={tab === id ? 'page' : undefined}
              scroll={false}
            >
              {label}
            </Link>
          ))}
        </nav>
        {history.data?.mode === 'demo' || score.data?.mode === 'demo' ? (
          <div className="ex-notice">
            <span className="ex-badge demo">Demonstration</span> Deterministic
            example store prices. USDA reports and verified observations are
            unavailable in this mode.{' '}
            <Link
              className="ex-link"
              href={href({ mode: params.get('mode') === 'demo' ? '' : 'demo' })}
            >
              Reload configured data
            </Link>
          </div>
        ) : null}
        {loading ? (
          <p className="ex-note" role="status">
            Loading stored observations…
          </p>
        ) : null}
        {error ? (
          <div role="alert" className="ex-notice ex-error">
            {error}{' '}
            <button
              className="ex-button"
              onClick={() => {
                if (params.has('snapshot') || params.has('asof')) {
                  navigate({ snapshot: '', asof: '', page: '' });
                  return;
                }
                history.retry();
                raw.retry();
                score.retry();
              }}
            >
              {params.has('snapshot') || params.has('asof') ? 'Reload current data' : 'Retry'}
            </button>{' '}
            <Link className="ex-link" href={href({ mode: 'demo' })}>
              Open labeled demonstration
            </Link>
          </div>
        ) : null}
        {tab === 'history' ? (
          <>
            <div className="ex-heading">
              <div>
                <span className="ex-eyebrow">The market, observed</span>
                <h2>{selected.name}</h2>
                <p className="ex-subtitle">
                  {start} — {end} · ZIP {zip} ·{' '}
                  {history.data?.coverage.localWeeks ?? 0} local weeks ·{' '}
                  {history.data?.coverage.usdaPeriods ?? 0} USDA periods
                </p>
              </div>
              <span className="ex-badge">
                {selected.unit === 'lb'
                  ? 'Dollars per pound'
                  : 'Dollars per dozen'}
              </span>
            </div>
            {history.data ? (
              <PriceHistory
                key={`${ingredient}:${start}:${end}:${params.get('stores') || ''}`}
                points={history.data.points}
                start={start}
                end={end}
                onRows={underlying}
              />
            ) : null}
          </>
        ) : null}
        {tab === 'score' ? (
          <ScorePanel
            result={score.data}
            onRows={() =>
              navigate({
                tab: 'raw',
                dataset: 'offers',
                version: '',
                row: score.data?.score?.offerIds[0] || '',
                start: score.data?.score?.cycle || start,
                end: score.data?.score?.cycle || end,
                source: '',
                region: '',
                search: '',
                variety: '',
                status: 'accepted',
              })
            }
          />
        ) : null}
        {tab === 'catalog' ? (
          <CatalogPanel
            entry={selected}
            onRows={() =>
              navigate({ tab: 'raw', dataset: 'normalized', version: '' })
            }
          />
        ) : null}
        {tab === 'raw' ? (
          <>
            <div className="ex-heading">
              <div>
                <span className="ex-eyebrow">Nothing behind the curtain</span>
                <h2>Raw data & derived records</h2>
                <p className="ex-subtitle">
                  Original source fields, normalized observations, and the
                  arithmetic that connects them.
                </p>
              </div>
              <button
                className="ex-button primary"
                disabled={!raw.data || exporting}
                onClick={downloadCsv}
              >
                {exporting ? 'Preparing…' : '↓ Export filtered CSV + metadata'}
              </button>
            </div>
            <div className="ex-toolbar">
              <label>
                Dataset
                <select
                  value={dataset}
                  onChange={(e) =>
                    navigate({
                      dataset: e.target.value,
                      version: '',
                      row: '',
                      source: '',
                      region: '',
                    })
                  }
                >
                  <option value="normalized">
                    Normalized USDA observations
                  </option>
                  <option value="original">Original USDA market rows</option>
                  <option value="offers">Archived store offers</option>
                  <option value="calculated">Calculated weekly results</option>
                </select>
              </label>
              <label>
                Revision status
                <select
                  value={params.get('status') || 'accepted'}
                  onChange={(e) => navigate({ status: e.target.value })}
                >
                  {[
                    'accepted',
                    'all',
                    'superseded',
                    'quarantined',
                    'unmapped',
                  ].map((s) => (
                    <option key={s} value={s}>
                      {s === 'accepted' ? 'Latest accepted' : s}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Search fields
                <input
                  key={params.get('search') || ''}
                  type="search"
                  defaultValue={params.get('search') || ''}
                  placeholder="Commodity, package, source field…"
                  onBlur={(e) => navigate({ search: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.currentTarget.blur();
                  }}
                />
              </label>
              <label>
                Variety / title
                <input
                  key={params.get('variety') || ''}
                  defaultValue={params.get('variety') || ''}
                  onBlur={(e) => navigate({ variety: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.currentTarget.blur();
                  }}
                />
              </label>
            </div>
            <div className="ex-toolbar">
              <label>
                Source
                <select
                  value={params.get('source') || ''}
                  onChange={(e) => navigate({ source: e.target.value })}
                >
                  <option value="">All compatible sources</option>
                  <option value="USDA">USDA</option>
                  <option value="FLIPP_LIVE">Flipp</option>
                  <option value="KROGER_API">Kroger</option>
                </select>
              </label>
              <label>
                Geography
                <select
                  disabled={dataset === 'offers'}
                  value={params.get('region') || ''}
                  onChange={(e) => navigate({ region: e.target.value })}
                >
                  <option value="">All source regions</option>
                  <option value="NATIONAL">National</option>
                  <option value="MOUNTAIN">Mountain (if present)</option>
                </select>
              </label>
              <label>
                Report version
                <select
                  disabled={dataset === 'offers'}
                  value={params.get('version') || ''}
                  onChange={(e) =>
                    navigate({ version: e.target.value, row: '' })
                  }
                >
                  <option value="">
                    {dataset === 'original'
                      ? 'Latest matching report'
                      : 'All matching versions'}
                  </option>
                  {history.data?.reports
                    .filter((r) =>
                      r.config.mappings.some(
                        (m) => m.ingredientId === ingredient
                      )
                    )
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.period_end} · {r.slug} · {r.id.slice(0, 8)} ·{' '}
                        {r.accepted ? 'accepted' : r.validation}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Sort
                <select
                  value={params.get('sort') || 'date'}
                  onChange={(e) => navigate({ sort: e.target.value })}
                >
                  {[
                    'date',
                    'price',
                    'source',
                    'variety',
                    'store',
                    'status',
                  ].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label>
                Direction
                <select
                  value={params.get('direction') || 'desc'}
                  onChange={(e) => navigate({ direction: e.target.value })}
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </label>
            </div>
            <p className="ex-note">
              {dataset === 'original'
                ? 'Ingredient selects a report. All commodities and unmapped rows in that report period remain inspectable. Prices use original source units.'
                : dataset === 'offers'
                  ? 'Stored PantryBot offer fields, not the original provider response. Expand a row for package, conditions, and retrieval receipts.'
                  : 'Normalized and calculated records are derived data, not original API responses.'}{' '}
              {dataset !== 'offers'
                ? 'Store filters do not apply to USDA rows.'
                : 'Geography filters apply only to USDA rows.'}
            </p>
            {params.get('row') ? (
              <div className="ex-notice">
                Showing the selected chart record.{' '}
                <button
                  className="ex-link"
                  onClick={() => navigate({ row: '' })}
                >
                  Show all matching records
                </button>
              </div>
            ) : null}
            {raw.data ? (
              <>
                <p className="ex-note" style={{ margin: '12px 0' }}>
                  {raw.data.total.toLocaleString()} matching records · snapshot{' '}
                  {raw.data.snapshot.slice(0, 10)} ·{' '}
                  {raw.data.mode === 'demo'
                    ? 'synthetic demonstration'
                    : 'stored source data'}
                </p>
                <RowsTable rows={raw.data.rows} />
                <div className="ex-bottom">
                  <span className="ex-note">
                    Page {raw.data.page + 1} of{' '}
                    {Math.max(1, Math.ceil(raw.data.total / 100))} · 100 rows
                    per page
                  </span>
                  <div className="ex-actions">
                    <button
                      className="ex-button"
                      disabled={raw.data.page === 0}
                      onClick={() =>
                        router.push(
                          href(
                            {
                              page: String(raw.data!.page - 1),
                              asof: raw.data!.asof,
                              snapshot: raw.data!.snapshot,
                            },
                            false
                          ),
                          { scroll: false }
                        )
                      }
                    >
                      ← Previous
                    </button>
                    <button
                      className="ex-button"
                      disabled={(raw.data.page + 1) * 100 >= raw.data.total}
                      onClick={() =>
                        router.push(
                          href(
                            {
                              page: String(raw.data!.page + 1),
                              asof: raw.data!.asof,
                              snapshot: raw.data!.snapshot,
                            },
                            false
                          ),
                          { scroll: false }
                        )
                      }
                    >
                      Next →
                    </button>
                  </div>
                </div>
              </>
            ) : null}
            {exportError ? (
              <p role="alert" className="ex-notice ex-error">
                {exportError}
              </p>
            ) : null}
            {reportVersion && history.data?.mode === 'verified' ? (
              <div className="ex-card">
                <div className="ex-heading">
                  <div>
                    <h3>Preserved USDA report</h3>
                    <p className="ex-note">
                      Sanitized public JSON projection · audited market fields,
                      including unmapped rows · 4 MB source limit
                    </p>
                  </div>
                  <div className="ex-actions">
                    <button
                      className="ex-button"
                      onClick={() => setShowReport((s) => !s)}
                    >
                      {showReport ? 'Hide JSON' : 'Inspect JSON'}
                    </button>
                    <a
                      className="ex-button"
                      href={`/api/data/report?version=${encodeURIComponent(reportVersion)}&download=1`}
                    >
                      ↓ Download JSON
                    </a>
                  </div>
                </div>
                {showReport ? (
                  <>
                    {report.loading ? (
                      <p role="status">Loading stored report…</p>
                    ) : null}
                    {report.error ? <p role="alert">{report.error}</p> : null}
                    {report.data ? (
                      <>
                        <p className="ex-note">{report.data.representation}</p>
                        <pre className="ex-json">
                          {JSON.stringify(report.data, null, 2)}
                        </pre>
                      </>
                    ) : null}
                  </>
                ) : null}
              </div>
            ) : (
              <p className="ex-note">
                Choose a USDA report version to inspect or download its stored
                JSON. No reports are manufactured for demonstration mode.
              </p>
            )}
          </>
        ) : null}
        {tab === 'sources' ? <SourcesPanel data={history.data} /> : null}
        {!TABS.some(([id]) => id === tab) ? (
          <div className="ex-empty">
            Unknown view.{' '}
            <Link href="/data" className="ex-link">
              Open price history
            </Link>
          </div>
        ) : null}
        <div className="ex-fineprint">
          Explore stored advertisements, not guaranteed shelf prices. Coupons,
          membership, package size, and local availability matter. Source
          periods and retrieval dates are different clocks.{' '}
          <Link className="ex-link" href={href({ tab: 'sources' }, false)}>
            Read the source notes
          </Link>
          .
        </div>
      </div>
    </main>
  );
}
function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function RowsTable({ rows }: { rows: DataRow[] }) {
  if (!rows.length)
    return (
      <div className="ex-empty">
        No rows match these filters. Try a wider window or another dataset.
      </div>
    );
  return (
    <div
      className="ex-table-wrap"
      tabIndex={0}
      role="region"
      aria-label="Scrollable data records"
    >
      <table className="ex-table">
        <caption className="ex-sr">Filtered source and derived records</caption>
        <thead>
          <tr>
            <th>Period / week</th>
            <th>Source / store</th>
            <th>Variety / title</th>
            <th>Price</th>
            <th>Status</th>
            <th>Source evidence</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>
                {r.date}
                <br />
                <span className="ex-note">{r.region || 'Local market'}</span>
              </td>
              <td>
                {r.source.replaceAll('_', ' ')}
                {r.store ? (
                  <>
                    <br />
                    {r.store.replaceAll('_', ' ')}
                  </>
                ) : null}
              </td>
              <td style={{ minWidth: 170 }}>{r.variety || r.ingredient}</td>
              <td className="price">
                {money(r.price)}
                <br />
                <span className="ex-note">/{r.unit || 'unspecified unit'}</span>
              </td>
              <td>
                <span
                  className={`ex-badge ${r.status === 'synthetic_demo' ? 'demo' : ''}`}
                >
                  {r.status}
                </span>
              </td>
              <td>
                <details>
                  <summary>Inspect row</summary>
                  <pre>{JSON.stringify(r, null, 2)}</pre>
                </details>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function ScorePanel({
  result,
  onRows,
}: {
  result: ScoreResult | null;
  onRows: () => void;
}) {
  if (!result) return null;
  if (!result.score)
    return (
      <div className="ex-empty">
        No retained offer is available for this ingredient and market in the
        last six weeks. The catalog still explains the policy.
      </div>
    );
  const { commodity: c, trace } = result.score;
  const components = [
    {
      name: 'Affordability',
      score: trace.affordabilityScore,
      weight: 55,
      note: 'Category-specific price curve. Lower prices earn a higher score.',
    },
    {
      name: 'Discount depth',
      score: trace.discountDepthScore,
      weight: 35,
      note: `Max(${trace.discountVsBaselinePct}% baseline discount, ${trace.discountVsRegularPct}% regular-price discount × 0.9) = ${trace.effectiveDiscount.toFixed(2)}%.`,
    },
    {
      name: 'Market signal',
      score: trace.wholesaleBonusScore,
      weight: 10,
      note: 'Neutral 60/100 in the verified-history path. Six weighted points; not measured wholesale momentum.',
    },
  ];
  return (
    <>
      <div className="ex-heading">
        <div>
          <span className="ex-eyebrow">Show your work</span>
          <h2>Why this score?</h2>
          <p className="ex-subtitle">
            {c.ingredient.name} · {c.bestOffer.store.replaceAll('_', ' ')} ·
            policy {trace.policyVersion}
          </p>
        </div>
        <button className="ex-button" onClick={onRows}>
          Inspect archived offers ↗
        </button>
      </div>
      <div className="ex-notice">{result.context}</div>
      <div className="ex-two">
        <div className="ex-card">
          <h3>The retained offer</h3>
          <p style={{ fontSize: 21, fontWeight: 600 }}>
            {c.bestOffer.rawTitle}
          </p>
          <p className="ex-stat">
            {money(c.bestOffer.normalizedPricePerUnit)}
            <span style={{ fontSize: 15 }}> / {c.ingredient.standardUnit}</span>
          </p>
          <p className="ex-note">
            {c.bestOffer.rawPriceText} · {c.bestOffer.validFrom} —{' '}
            {c.bestOffer.validTo}
          </p>
          <p className="ex-note">
            {c.bestOffer.dealConditions || 'No additional conditions retained.'}{' '}
            Regular price is the retained comparison input; it may be estimated
            and is not independently verified.
          </p>
          <dl>
            <div className="ex-definition">
              <dt>
                Comparison baseline:{' '}
                {money(c.ingredient.mountainBaselinePerUnit)}/
                {c.ingredient.standardUnit}
              </dt>
              <dd>
                {c.usdaBenchmark?.status === 'fallback'
                  ? 'Static estimate; source origin not documented.'
                  : `${c.usdaBenchmark?.region} USDA advertised retail benchmark · ${c.usdaBenchmark?.periodEnd} · ${c.usdaBenchmark?.status}`}
                <br />
                Regular-price input: {money(c.bestOffer.regularPricePerUnit)}/
                {c.ingredient.standardUnit}
              </dd>
            </div>
            <div className="ex-definition">
              <dt>Offer selection</dt>
              <dd>
                Lowest compatible offer among selected stores in the most recent
                retained ad cycle. Live-source offers take precedence over
                curated estimates.
              </dd>
            </div>
          </dl>
        </div>
        <div className="ex-card">
          <span className="ex-eyebrow">Value score</span>
          <p className="ex-score" style={{ margin: '22px 0' }}>
            {trace.valueScore}
            <span style={{ fontSize: 22, letterSpacing: 0, color: '#6b7a70' }}>
              {' '}
              / 100
            </span>
          </p>
          <p className="ex-note">
            {trace.contributions.map((n) => n.toFixed(2)).join(' + ')} ={' '}
            {trace.unroundedScore.toFixed(2)}
            <br />
            Final score rounded to the nearest whole number.
          </p>
          <p className="ex-note">
            Evaluated {result.asof}. Full input values are available below.
          </p>
        </div>
      </div>
      <div className="ex-grid">
        {components.map((component, index) => (
          <div className="ex-card" key={component.name}>
            <span className="ex-eyebrow">{component.weight}% weight</span>
            <h3 style={{ marginTop: 10 }}>{component.name}</h3>
            <p className="ex-stat">
              {component.score}
              <span style={{ fontSize: 14 }}> / 100</span>
            </p>
            <div className="ex-contribution">
              <div style={{ width: `${component.score}%` }} />
            </div>
            <p className="ex-note">{component.note}</p>
            <p style={{ fontSize: 13, marginTop: 10, fontWeight: 700 }}>
              +{trace.contributions[index].toFixed(2)} points
            </p>
          </div>
        ))}
      </div>
      <div className="ex-card">
        <h3>Recommendation labels are separate decisions</h3>
        <dl>
          <div className="ex-definition">
            <dt>Cycle badge: {c.cycleSignal?.badgeLabel}</dt>
            <dd>
              {result.mode === 'demo'
                ? 'Synthetic demonstration; no verified local weeks.'
                : `${c.priceHistory.filter((p) => p.bestLocalPrice !== null).length} observed local weeks in the six-week scoring window.`}{' '}
              Observed low:{' '}
              {c.sixWeekLow > 0 ? money(c.sixWeekLow) : 'unavailable'}. A
              verified low requires six local weeks, a price within $0.05 of the
              observed low, and at least 32% off regular price. A ≥42% discount
              alone is labeled a deep discount.
            </dd>
          </div>
          <div className="ex-definition">
            <dt>Action tag: {c.actionTag.replaceAll('_', ' ')}</dt>
            <dd>
              Stock-up anchor: value score ≥82 or regular discount ≥42%, after
              earlier trend/splurge rules. Splurge deals require a verified
              higher-priced item and a deep discount. Curated estimates retain a
              general staple label.
            </dd>
          </div>
          <div className="ex-definition">
            <dt>
              Freezer suggestion:{' '}
              {c.arbitragePrompt?.eligible ? 'eligible' : 'not eligible'}
            </dt>
            <dd>
              Requires a verified offer, an eligible protein/butter/cheese
              ingredient, and a low-price badge, ≥38% regular discount, or
              splurge alert. Estimated future savings use the retained
              regular-price comparison, not a forecast.
            </dd>
          </div>
        </dl>
        <details style={{ marginTop: 16 }}>
          <summary className="ex-link">
            Full calculation inputs and rule outputs
          </summary>
          <pre className="ex-json">{JSON.stringify(result.score, null, 2)}</pre>
        </details>
      </div>
      <div className="ex-card" style={{ marginTop: 20 }}>
        <h3>Affordability curves & discount formula</h3>
        <p className="ex-note">
          Protein: 100 at ≤$1.25, 12 at ≥$8. Produce: 100 at ≤$0.60, 15 at
          ≥$3.80. Dairy/eggs: 100 at ≤$1.60, 20 at ≥$5. Intermediate scores
          follow a straight line and are rounded. Prices are per ingredient
          standard unit.
        </p>
        <p className="ex-note">
          Discount = round(100 × (reference − offer) / reference). Missing or
          invalid comparison inputs assert no discount. Discount-depth score is
          10 for effective discounts ≤0%, 100 for ≥50%, otherwise round(10 +
          effective discount / 50 × 90).
        </p>
      </div>
    </>
  );
}
function CatalogPanel({
  entry,
  onRows,
}: {
  entry: Catalog[number];
  onRows: () => void;
}) {
  return (
    <>
      <div className="ex-heading">
        <div>
          <span className="ex-eyebrow">What belongs together, and why</span>
          <h2>{entry.name}</h2>
          <p className="ex-subtitle">
            {entry.category} / {entry.subcategory} · compared per {entry.unit}
          </p>
        </div>
        <button className="ex-button" onClick={onRows}>
          See mapped observations ↗
        </button>
      </div>
      <div className="ex-two">
        <div className="ex-card">
          <h3>The grouping rationale</h3>
          <p className="ex-subtitle">{entry.rationale}</p>
          <p className="ex-note" style={{ marginTop: 16 }}>
            {entry.limitation}
          </p>
          <p className="ex-note" style={{ marginTop: 12 }}>
            Editorial policy: {entry.rationaleVersion}
          </p>
        </div>
        <div className="ex-card">
          <h3>Store title matching</h3>
          <dl>
            <div className="ex-definition">
              <dt>Accepted keywords</dt>
              <dd>{entry.keywords.join(' · ')}</dd>
            </div>
            <div className="ex-definition">
              <dt>Excluded keywords</dt>
              <dd>
                {entry.exclusions.join(' · ') ||
                  'No ingredient-specific exclusions.'}
              </dd>
            </div>
            <div className="ex-definition">
              <dt>Fallback baseline</dt>
              <dd>
                {money(entry.fallback)}/{entry.unit}. {entry.fallbackOrigin}
              </dd>
            </div>
          </dl>
        </div>
      </div>
      <div className="ex-heading">
        <h2>USDA mappings</h2>
      </div>
      {entry.mappings.length ? (
        entry.mappings.map((mapping, index) => (
          <div key={index} className="ex-card" style={{ marginBottom: 14 }}>
            <span className="ex-badge">
              Report {mapping.slug} · {mapping.version}
            </span>
            <h3 style={{ marginTop: 12 }}>{mapping.title}</h3>
            <p className="ex-note">
              {Object.entries(mapping.dimensions)
                .map(([key, value]) => `${key}: ${value}`)
                .join(' · ')}
            </p>
            <p className="ex-note">
              Compatible source rows use store-count weights. Normalization
              multiplies the source package price by the configured conversion
              factor. Source dimensions remain separate even when their prices
              feed one benchmark.
            </p>
            <details>
              <summary className="ex-link">
                Exact mapping and unit conversions
              </summary>
              <pre className="ex-json">{JSON.stringify(mapping, null, 2)}</pre>
            </details>
          </div>
        ))
      ) : (
        <div className="ex-empty">
          No compatible USDA mapping. A labeled static estimate is used when a
          benchmark is unavailable.
        </div>
      )}
    </>
  );
}
function SourcesPanel({ data }: { data: ExplorerData | null }) {
  return (
    <>
      <div className="ex-heading">
        <div>
          <span className="ex-eyebrow">Know what you’re comparing</span>
          <h2>Sources & coverage</h2>
          <p className="ex-subtitle">
            Source dates, retrieval dates, and scoring eligibility answer
            different questions.
          </p>
        </div>
      </div>
      <div className="ex-grid">
        <div className="ex-card">
          <h3>USDA retail reports</h3>
          <p className="ex-note">
            National advertised retail benchmarks across specialty crops, beef,
            pork, chicken, and dairy. These are not local shelf-price averages
            or wholesale trends.
          </p>
          <a
            className="ex-link ex-note"
            href="https://mymarketnews.ams.usda.gov/mymarketnews-api"
          >
            U.S. Department of Agriculture ↗
          </a>
        </div>
        <div className="ex-card">
          <h3>Store advertisements</h3>
          <p className="ex-note">
            Retained Flipp/Kroger offers for the selected ZIP. Latest retrieved
            revision per offer/week, then the lowest compatible observed offer
            per store/week. Not a complete store survey.
          </p>
        </div>
        <div className="ex-card">
          <h3>This selection</h3>
          <p className="ex-stat">
            {data?.coverage.localWeeks ?? 0}
            <span style={{ fontSize: 15 }}> local weeks</span>
          </p>
          <p className="ex-note">
            {data?.coverage.usdaPeriods ?? 0} USDA periods for this ingredient ·{' '}
            {data?.mode || 'loading'} mode. National report availability does
            not imply local store coverage.
          </p>
        </div>
      </div>
      <div className="ex-card">
        <h3>Freshness and clocks</h3>
        <p className="ex-subtitle">
          Wednesday ingestion reuses the latest available source release.
          “Current” means within the report cadence plus grace (currently nine
          days). “Stale” remains usable through fourteen days after the source
          period; older values stay available for history but current scoring
          uses a labeled fallback.
        </p>
        <p className="ex-note">
          Report periods belong to the source. Retrieval times are UTC. Local ad
          cycles use America/Denver. USDA publication clocks lack an offset and
          are preserved without inventing a timezone. A recent check does not
          make an old report fresh.
        </p>
      </div>
      <div className="ex-heading">
        <h2>Stored report versions</h2>
      </div>
      <div
        className="ex-table-wrap"
        tabIndex={0}
        role="region"
        aria-label="Stored report coverage"
      >
        <table className="ex-table">
          <thead>
            <tr>
              <th>Report</th>
              <th>Source period</th>
              <th>Published clock (unoffset)</th>
              <th>Retrieved (UTC)</th>
              <th>Version / status</th>
            </tr>
          </thead>
          <tbody>
            {data?.reports.map((r) => (
              <tr key={r.id}>
                <td>
                  {r.slug}
                  <br />
                  {r.title}
                </td>
                <td>
                  {r.period_start}
                  <br />
                  {r.period_end}
                </td>
                <td>{r.published_at}</td>
                <td>{r.fetched_at}</td>
                <td>
                  {r.id.slice(0, 8)}
                  <br />
                  {r.accepted ? 'Accepted' : r.validation}
                  {r.active ? ' · active publication' : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data && !data.reports.length ? (
        <p className="ex-notice">
          No stored USDA report versions in this window.
        </p>
      ) : null}
      <div className="ex-card" style={{ marginTop: 20 }}>
        <h3>A short data dictionary</h3>
        <dl>
          {[
            [
              'Advertised retail benchmark',
              'A summary of USDA-reported retail advertisements across a named geography and source period.',
            ],
            [
              'Normalized unit',
              'A package price converted to a comparable unit, such as dollars per pound or per dozen.',
            ],
            [
              'Canonical ingredient',
              'A PantryBot recipe and matching group. It is not a USDA commodity classification.',
            ],
            [
              'Baseline vs regular price',
              'The baseline is a compatible usable USDA benchmark or static estimate. Regular price is the retained offer comparison price and may be estimated.',
            ],
            [
              'Weighted mean',
              'Sum of each normalized source price multiplied by its store count, divided by total compatible store counts.',
            ],
            [
              'Verified observation',
              'An archived live-source observation with retained provenance; it is still an advertisement rather than a guaranteed shelf price.',
            ],
            [
              'Synthetic demonstration',
              'Deterministic example data, isolated from verified history. Legacy unverified imports are not promoted into verified series.',
            ],
            [
              'Missing observation',
              'Unknown. It does not mean zero, unchanged, or unavailable everywhere.',
            ],
            [
              'Revision and receipt',
              'A revision preserves changed offer content. A receipt records another retrieval, including a return to a previous price. Repeated checks are not new observed weeks.',
            ],
          ].map(([term, definition]) => (
            <div className="ex-definition" key={term}>
              <dt>{term}</dt>
              <dd>{definition}</dd>
            </div>
          ))}
        </dl>
      </div>
    </>
  );
}
