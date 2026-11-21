'use client';
import { useState } from 'react';
import type { HistoryPoint } from '@/lib/explorer/types';
// The series colors are CSS variables (--ex-s1 to --ex-s7 in explorer.css) so the chart follows the theme.
const COLORS = [1, 2, 3, 4, 5, 6, 7].map((n) => `var(--ex-s${n})`);
export function money(n: number | null) {
  return n === null ? '—' : `$${n.toFixed(2)}`;
}
export function summarize(values: number[]) {
  if (!values.length) return null;
  const v = [...values].sort((a, b) => a - b);
  const middle = Math.floor(v.length / 2);
  return {
    min: v[0],
    max: v.at(-1)!,
    mean: v.reduce((a, b) => a + b, 0) / v.length,
    median: (v[middle] + v[Math.floor((v.length - 1) / 2)]) / 2,
  };
}
export default function PriceHistory({
  points,
  start,
  end,
  onRows,
}: {
  points: HistoryPoint[];
  start: string;
  end: string;
  onRows: (point?: HistoryPoint) => void;
}) {
  const [hidden, setHidden] = useState<string[]>([]);
  const [selected, setSelected] = useState<HistoryPoint | null>(null);
  const series = [...new Set(points.map((p) => p.series))].sort();
  const visible = points.filter((p) => !hidden.includes(p.series));
  const local = visible.filter((p) => !p.series.startsWith('USDA'));
  const weekly = new Map<string, number>();
  for (const point of local)
    weekly.set(
      point.date,
      Math.min(weekly.get(point.date) ?? Infinity, point.price)
    );
  const stats = summarize([...weekly.values()]);
  const benchmarkOnly = local.length === 0 && visible.length > 0;
  const cardStats = benchmarkOnly
    ? summarize(visible.map((point) => point.price))
    : stats;
  const max = Math.max(...visible.map((p) => p.price), 1) * 1.15;
  const rangeStart = Math.min(
    Date.parse(start),
    ...points.map((p) => Date.parse(p.date))
  );
  const rangeEnd = Math.max(Date.parse(end), rangeStart + 86400000);
  const x = (day: string) =>
    65 + ((Date.parse(day) - rangeStart) / (rangeEnd - rangeStart)) * 860;
  const y = (price: number) => 235 - (price / max) * 195;
  const ticks = Array.from({ length: 5 }, (_, i) => (max * i) / 4);
  return (
    <>
      <div className="ex-card">
        <div className="ex-heading">
          <div>
            <h3>Price over time</h3>
            <p className="ex-note">
              Dollars per {points[0]?.unit || 'standard unit'} · select a point
              to inspect its evidence
            </p>
          </div>
          <button className="ex-button" onClick={() => onRows()}>
            View underlying rows ↗
          </button>
        </div>
        <div className="ex-legend" aria-label="Visible chart series">
          {series.map((name, i) => (
            <label key={name}>
              <input
                type="checkbox"
                checked={!hidden.includes(name)}
                onChange={() =>
                  setHidden((current) =>
                    current.includes(name)
                      ? current.filter((s) => s !== name)
                      : [...current, name]
                  )
                }
              />
              <span
                className="ex-dot"
                style={{ background: COLORS[i % COLORS.length] }}
              />
              {name.replaceAll('_', ' ')}
            </label>
          ))}
        </div>
        {visible.length ? (
          <div className="ex-chart-scroll" role="region" aria-label="Price chart (scrolls sideways on narrow screens)" tabIndex={0}>
          <svg
            className="ex-chart"
            viewBox="0 0 960 285"
            role="img"
            aria-labelledby="price-chart-title price-chart-desc"
          >
            <title id="price-chart-title">Observed advertised prices</title>
            <desc id="price-chart-desc">
              {visible.length} observations. Missing weeks are gaps. A
              keyboard-accessible table follows this chart.
            </desc>
            {ticks.map((t) => (
              <g key={t}>
                <line
                  x1="65"
                  x2="925"
                  y1={y(t)}
                  y2={y(t)}
                  className="ex-grid-line"
                  strokeDasharray="3 5"
                />
                <text
                  x="50"
                  y={y(t) + 4}
                  textAnchor="end"
                  fontSize="11"
                  className="ex-axis-label"
                >
                  {money(t)}
                </text>
              </g>
            ))}
            {Array.from({ length: 6 }, (_, i) => {
              const timestamp = rangeStart + ((rangeEnd - rangeStart) * i) / 5;
              const day = new Date(timestamp).toISOString().slice(0, 10);
              return (
                <text
                  key={i}
                  x={x(day)}
                  y="270"
                  textAnchor="middle"
                  fontSize="11"
                  className="ex-axis-label"
                >
                  {day.slice(5)}
                </text>
              );
            })}
            {series.map((name, index) => {
              if (hidden.includes(name)) return null;
              const ps = visible
                .filter((p) => p.series === name)
                .sort((a, b) => a.date.localeCompare(b.date));
              const path = ps
                .map(
                  (p, i) =>
                    `${i === 0 || Date.parse(p.date) - Date.parse(ps[i - 1].date) > 8 * 86400000 ? 'M' : 'L'}${x(p.date).toFixed(1)},${y(p.price).toFixed(1)}`
                )
                .join(' ');
              return (
                <g key={name}>
                  <path
                    d={path}
                    fill="none"
                    style={{ stroke: COLORS[index % COLORS.length] }}
                    strokeWidth="2.3"
                    strokeDasharray={
                      name.startsWith('USDA') ? '7 5' : undefined
                    }
                  />
                  {ps.map((p) => (
                    <circle
                      key={p.date}
                      cx={x(p.date)}
                      cy={y(p.price)}
                      r="4.5"
                      className="ex-dot-fill"
                      strokeWidth="2.3"
                      onClick={() => setSelected(p)}
                      style={{ stroke: COLORS[index % COLORS.length], cursor: 'pointer' }}
                    >
                      <title>
                        {name}: {money(p.price)}/{p.unit}, {p.date}. Select to
                        view source rows.
                      </title>
                    </circle>
                  ))}
                </g>
              );
            })}
          </svg>
          </div>
        ) : (
          <div className="ex-empty">
            No observations for the visible series. Try another ingredient,
            store, or date range.
          </div>
        )}
        {selected ? (
          <div className="ex-notice">
            <strong>
              {selected.series.replaceAll('_', ' ')} · {selected.date} ·{' '}
              {money(selected.price)}/{selected.unit}
            </strong>
            <p>
              {selected.ids.length} contributing record(s)
              {selected.version ? ` · report ${selected.version}` : ''}
            </p>
            <details>
              <summary className="ex-link">
                Point provenance and price inputs
              </summary>
              <pre className="ex-json">
                {JSON.stringify(selected.details, null, 2)}
              </pre>
            </details>
            <button className="ex-button" onClick={() => onRows(selected)}>
              Inspect source rows ↗
            </button>
          </div>
        ) : null}
        <p className="ex-note">
          USDA: national advertised retail benchmark. Stores: lowest observed
          compatible advertisement per store/week. Lines break across missing
          weeks; no prices are filled in.
        </p>
      </div>
      <div className="ex-grid">
        <div className="ex-card">
          <span className="ex-eyebrow">{benchmarkOnly ? 'Lowest USDA benchmark' : 'Lowest observed'}</span>
          <p className="ex-stat">{money(cardStats?.min ?? null)}</p>
          <p className="ex-note">{benchmarkOnly ? 'National advertised retail · no local store observations' : 'Across visible stores in this window'}</p>
        </div>
        <div className="ex-card">
          <span className="ex-eyebrow">{benchmarkOnly ? 'USDA mean / median' : 'Weekly mean / median'}</span>
          <p className="ex-stat">
            {money(cardStats?.mean ?? null)}{' '}
            <span style={{ fontSize: 16 }}>
              / {money(cardStats?.median ?? null)}
            </span>
          </p>
          <p className="ex-note">
            {benchmarkOnly
              ? `Visible USDA period benchmarks · ${visible.length} observations`
              : `Best observed store price each week · ${weekly.size} weeks`}
          </p>
        </div>
        <div className="ex-card">
          <span className="ex-eyebrow">{benchmarkOnly ? 'Highest USDA benchmark' : 'Highest observed weekly best'}</span>
          <p className="ex-stat">{money(cardStats?.max ?? null)}</p>
          <p className="ex-note">
            Missing weeks are excluded, never counted as zero
          </p>
        </div>
      </div>
      <div className="ex-card">
        <h3>Weekly price patterns</h3>
        <p className="ex-note">
          Best observed price across visible stores. Darker cells mean lower
          prices within this window. A short history does not establish a
          recurring cycle.
        </p>
        <div className="ex-heat">
          {[...weekly]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, price]) => (
              <button
                key={date}
                onClick={() =>
                  onRows(
                    local.find((p) => p.date === date && p.price === price)
                  )
                }
                style={{
                  background: `color-mix(in srgb, var(--ds-save) ${Math.round(100 * (stats && stats.max > stats.min ? 0.08 + (0.3 * (stats.max - price)) / (stats.max - stats.min) : 0.15))}%, var(--ds-surface))`,
                }}
              >
                <strong>{date.slice(5)}</strong>
                <br />
                {money(price)}
              </button>
            ))}
        </div>
        {weekly.size === 0 ? (
          <p className="ex-note">No local weeks observed.</p>
        ) : null}
      </div>
      <details style={{ marginTop: 20 }}>
        <summary className="ex-link">
          Accessible observations table ({visible.length})
        </summary>
        <div
          className="ex-table-wrap"
          tabIndex={0}
          role="region"
          aria-label="Chart observations"
        >
          <table className="ex-table">
            <caption className="ex-sr">
              Observed prices underlying the chart
            </caption>
            <thead>
              <tr>
                <th>Date</th>
                <th>Series</th>
                <th>Price</th>
                <th>Evidence</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => (
                <tr key={`${p.date}:${p.series}`}>
                  <td>{p.date}</td>
                  <td>{p.series.replaceAll('_', ' ')}</td>
                  <td className="price">
                    {money(p.price)}/{p.unit}
                  </td>
                  <td>
                    <button className="ex-link" onClick={() => onRows(p)}>
                      View {p.ids.length} contributing rows
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}
