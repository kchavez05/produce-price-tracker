import { verifiedLocalWeekCount } from '@/lib/market/history-summary';
import type { ScoredCommodity } from '@/types/domain';

// v2.0 M4-3c (wireframe Shop Radar, "Price trend"): the verified local prices of the last weeks (up to six) as small bars, the current week
// marked. It draws what DealDetails draws for the same history, only smaller, and only when there is verified history to show
// (so a fallback estimate never looks like a trend). The picture has a text name and the exact prices are in each bar's title.
export default function PriceTrend({ item }: { item: ScoredCommodity }) {
  const history = item.priceHistory;
  if (item.comparisonEvidence || !history || verifiedLocalWeekCount(history) === 0) return null;
  const max = Math.max(...history.map((point) => point.bestLocalPrice ?? 0), 1);
  const current = history.at(-1)?.weekStart;
  return (
    <div role="img" aria-label={`Price trend for ${item.ingredient.name}, last ${history.length} weeks`} style={{ gridTemplateColumns: `repeat(${history.length}, minmax(0, 1fr))` }} className="grid h-8 items-end gap-1">
      {history.map((point) => point.bestLocalPrice === null
        ? <div key={point.weekStart} title={`${point.label}: No verified local price`} className="h-1 rounded-t bg-border" />
        : (
          <div
            key={point.weekStart}
            title={`${point.label}: Best $${point.bestLocalPrice.toFixed(2)}`}
            style={{ height: `${Math.max(22, Math.round((point.bestLocalPrice / max) * 100))}%` }}
            className={`rounded-t ${point.weekStart === current ? 'bg-save' : 'bg-border-strong'}`}
          />
        ))}
    </div>
  );
}
