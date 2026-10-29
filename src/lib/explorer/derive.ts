import { hash } from '@/lib/usda/adapter';
import { CANONICAL_INGREDIENTS } from '@/data/canonical-ingredients';
import { selectBenchmarks, type BenchmarkRow } from '@/lib/usda/read';
import { scoreAllCommodities } from '@/lib/scoring-and-matcher';
import { calculateValueScore } from '@/lib/value-score';
import { emptyHistory, summarizeHistory } from '@/lib/market/history';
import type {
  Archive,
  DataRow,
  ExplorerData,
  ExplorerReport,
  HistoryPoint,
  ExplorerOffer,
} from './types';
import type { ExplorerQuery } from './query';
import { ExplorerError } from './query';
import type { PriceHistoryPoint, StoreChain } from '@/types/domain';

export function scoreInputs(archive: Archive, query: ExplorerQuery) {
  const ingredient = CANONICAL_INGREDIENTS.find((item) => item.id === query.ingredient)!;
  const active = new Set(archive.reports.filter((r) => r.active && r.accepted).map((r) => r.id));
  const benchmarks = selectBenchmarks(benchmarkRows(archive, active), new Date(query.asof));
  return {
    ingredient: {
      ...ingredient,
      mountainBaselinePerUnit: benchmarks.overrides[ingredient.id]?.mountainBaseline ?? ingredient.mountainBaselinePerUnit,
      usdaSignal: { ...ingredient.usdaSignal, trend: 'STABLE' as const },
    },
    benchmark: benchmarks.provenance[ingredient.id] ?? null,
  };
}

export function latestReports(reports: ExplorerReport[]) {
  const chosen = new Map<string, ExplorerReport>();
  for (const r of reports.filter((r) => r.accepted)) {
    const key = `${r.slug}:${r.period_start}:${r.period_end}`;
    const prior = chosen.get(key);
    if (
      !prior ||
      `${r.published_at}:${r.fetched_at}:${r.id}` >
        `${prior.published_at}:${prior.fetched_at}:${prior.id}`
    )
      chosen.set(key, r);
  }
  return new Set([...chosen.values()].map((r) => r.id));
}
export function reportStatus(report: ExplorerReport, latest: Set<string>) {
  return report.accepted
    ? latest.has(report.id)
      ? 'accepted'
      : 'superseded'
    : report.validation;
}
export function currentOfferRevisions(offers: ExplorerOffer[]) {
  const chosen = new Map<string, ExplorerOffer>();
  for (const offer of offers) {
    const key = JSON.stringify([
      offer.source,
      offer.source_offer_id,
      offer.store,
      offer.location_label,
      offer.cycle,
    ]);
    const prior = chosen.get(key);
    if (
      !prior ||
      offer.retrieved_at > prior.retrieved_at ||
      (offer.retrieved_at === prior.retrieved_at &&
        offer.receipt_id > prior.receipt_id)
    )
      chosen.set(key, offer);
  }
  return [...chosen.values()];
}
function benchmarkRows(
  archive: Archive,
  versions: Set<string>
): BenchmarkRow[] {
  const reports = new Map(archive.reports.map((r) => [r.id, r]));
  return archive.observations
    .filter((o) => versions.has(o.version_id))
    .map((o) => {
      const r = reports.get(o.version_id)!;
      return {
        ...o,
        slug: r.slug,
        version_id: r.id,
        period_end: r.period_end,
        fetched_at: r.fetched_at,
        checked_at: r.fetched_at,
        config: r.config,
      };
    });
}
export function historyPoints(
  archive: Archive,
  query: ExplorerQuery
): HistoryPoint[] {
  const points: HistoryPoint[] = [];
  if (query.source === '' || query.source === 'USDA') {
    const rows = benchmarkRows(archive, latestReports(archive.reports));
    for (const day of [...new Set(rows.map((r) => r.period_end))].sort()) {
      const selected = selectBenchmarks(
        rows.filter((r) => r.period_end === day),
        new Date(`${day}T12:00:00Z`)
      );
      const provenance = selected.provenance[query.ingredient];
      const price = selected.overrides[query.ingredient]?.mountainBaseline;
      if (
        price &&
        provenance &&
        (!query.region || query.region === provenance.region)
      )
        points.push({
          date: day,
          series: `USDA ${provenance.region}`,
          price,
          unit: provenance.unit!,
          version: provenance.versionId,
          details: {
            source: 'USDA advertised retail',
            region: provenance.region,
            periodEnd: day,
            retrievedAt: provenance.fetchedAt,
            aggregation: provenance.aggregation,
            reportSlug: provenance.reportSlug,
            contributions: rows
              .filter(
                (r) =>
                  r.version_id === provenance.versionId &&
                  r.region === provenance.region
              )
              .map((r) => ({
                price: r.value,
                unit: r.unit,
                weight: r.config.fields.weight
                  ? r.original?.[r.config.fields.weight]
                  : 1,
                original: r.original,
              })),
          },
          ids: archive.observations
            .filter(
              (o) =>
                o.version_id === provenance.versionId &&
                o.region === provenance.region
            )
            .map((o) => `${o.version_id}:${o.row_key}`),
        });
    }
  }
  if (query.region) return points;
  const groups = new Map<string, ExplorerOffer[]>();
  for (const o of currentOfferRevisions(archive.offers).filter(
    (o) =>
      (!query.stores.length || query.stores.includes(o.store)) &&
      (!query.source || query.source === o.source)
  )) {
    const key = `${o.cycle}:${o.store}`;
    groups.set(key, [...(groups.get(key) || []), o]);
  }
  for (const offers of groups.values()) {
    const min = Math.min(...offers.map((o) => o.normalized_price));
    const selected = offers.filter((o) => o.normalized_price === min);
    points.push({
      date: offers[0].cycle,
      series: offers[0].store,
      price: min,
      unit: offers[0].unit,
      ids: selected.map((o) => `offer:${o.id}`),
      details: {
        method: 'Lowest observed compatible advertisement in this store/week',
        offers: selected.map((o) => ({
          source: o.source,
          title: o.payload.rawTitle,
          packagePrice: o.payload.rawPriceText,
          conditions: o.payload.dealConditions,
          location: o.location_label,
          validFrom: o.source_from,
          validTo: o.source_to,
          retrievedAt: o.retrieved_at,
          revisionId: o.id,
        })),
      },
    });
  }
  return points.sort(
    (a, b) => a.date.localeCompare(b.date) || a.series.localeCompare(b.series)
  );
}
export function archiveRows(
  archive: Archive,
  query: ExplorerQuery,
  mode: 'verified' | 'demo'
): DataRow[] {
  const reports = new Map(archive.reports.map((r) => [r.id, r]));
  const latest = latestReports(archive.reports);
  const currentBenchmarks = selectBenchmarks(
    benchmarkRows(
      archive,
      new Set(
        archive.reports.filter((r) => r.active && r.accepted).map((r) => r.id)
      )
    ),
    new Date(query.asof)
  );
  if (query.dataset === 'offers') {
    const current = new Set(
      currentOfferRevisions(archive.offers).map((o) => o.id)
    );
    return archive.offers.map((o) => ({
      id: `offer:${o.id}`,
      date: o.cycle,
      source: o.source,
      ingredient: o.ingredient_id,
      variety: o.payload.rawTitle,
      store: o.store,
      region: '',
      price: o.normalized_price,
      unit: o.unit,
      version: String(o.id),
      status:
        mode === 'demo'
          ? 'synthetic_demo'
          : current.has(o.id)
            ? 'accepted'
            : 'superseded',
      details: {
        ...o,
        receiptsNote:
          o.receipt_count > o.receipts.length
            ? 'Showing the latest 100 retrieval receipts.'
            : undefined,
        representation:
          'Archived PantryBot offer fields; not an original provider API response.',
      },
    }));
  }
  if (query.dataset === 'calculated')
    return historyPoints(archive, query).map((p) => ({
      id: `summary:${p.series}:${p.date}`,
      date: p.date,
      source: p.series.startsWith('USDA')
        ? 'USDA'
        : query.source || 'STORE_SUMMARY',
      ingredient: query.ingredient,
      variety: '',
      store: p.series.startsWith('USDA') ? '' : p.series,
      region: p.series.startsWith('USDA') ? p.series.slice(5) : '',
      price: p.price,
      unit: p.unit,
      version: p.version || '',
      status: mode === 'demo' ? 'synthetic_demo' : 'accepted',
      details: {
        ...p,
        method: p.series.startsWith('USDA')
          ? 'Compatible source rows weighted by store count.'
          : 'Latest retrieved offer revisions, then lowest observed offer per store/week.',
      },
    }));
  return archive.observations.flatMap((o) => {
    const r = reports.get(o.version_id);
    if (!r) return [];
    const conversion = r.config.units[String(o.original[r.config.fields.unit])];
    return [
      {
        id: `${o.version_id}:${o.row_key}`,
        date: r.period_end,
        source: 'USDA',
        ingredient: o.ingredient_id,
        variety: String(
          o.original.variety || o.original.type || o.original.commodity || ''
        ),
        store: '',
        region: o.region,
        price: o.value,
        unit: o.unit,
        version: o.version_id,
        status: reportStatus(r, latest),
        details: {
          ...o,
          report: r,
          originalPrice: o.original[r.config.fields.price],
          originalUnit: o.original[r.config.fields.unit],
          multiplier: conversion?.multiplier,
          weight: r.config.fields.weight
            ? o.original[r.config.fields.weight]
            : 1,
          calculation: `original price × ${conversion?.multiplier ?? 'unavailable'}`,
          usedInCurrentScoring:
            currentBenchmarks.provenance[o.ingredient_id]?.versionId === r.id &&
            currentBenchmarks.provenance[o.ingredient_id]?.region === o.region,
        },
      },
    ];
  });
}
export function filterRows(rows: DataRow[], query: ExplorerQuery) {
  const filtered = rows.filter(
    (r) =>
      (!query.source || r.source === query.source) &&
      (!query.stores.length || !r.store || query.stores.includes(r.store)) &&
      (!query.region || r.region === query.region) &&
      (!query.version || r.version === query.version) &&
      (!query.row || r.id === query.row) &&
      (query.status === 'all' ||
        (r.status === 'synthetic_demo' && query.status === 'accepted') ||
        r.status === query.status) &&
      (!query.variety ||
        r.variety.toLowerCase().includes(query.variety.toLowerCase())) &&
      (!query.search ||
        JSON.stringify(r).toLowerCase().includes(query.search.toLowerCase()))
  );
  return filtered.sort((a, b) => {
    const key = query.sort as
      | 'date'
      | 'price'
      | 'source'
      | 'variety'
      | 'store'
      | 'status';
    const av = a[key],
      bv = b[key];
    const order =
      typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av ?? '').localeCompare(String(bv ?? ''));
    return (
      (query.direction === 'asc' ? order : -order) || a.id.localeCompare(b.id)
    );
  });
}
export function explainScore(
  archive: Archive,
  query: ExplorerQuery,
  mode: 'verified' | 'demo'
) {
  const offers = currentOfferRevisions(archive.offers).filter(
    (o) => !query.stores.length || query.stores.includes(o.store)
  );
  if (!offers.length) return null;
  const cycle = offers
    .map((o) => o.cycle)
    .sort()
    .at(-1)!;
  const end = new Date(`${cycle}T12:00:00Z`);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 35);
  const points = historyPoints(archive, {
    ...query,
    source: '',
    region: '',
    start: start.toISOString().slice(0, 10),
    end: cycle,
  }).filter(
    (p) => p.date >= start.toISOString().slice(0, 10) && p.date <= cycle
  );
  const weekly = new Map<string, PriceHistoryPoint>();
  for (const p of points.filter((p) => !p.series.startsWith('USDA'))) {
    const point = weekly.get(p.date) || {
      weekStart: p.date,
      label: p.date,
      kingSoopersPrice: null,
      safewayPrice: null,
      usdaMountainAvg: null,
      bestLocalPrice: null,
    };
    point.bestLocalPrice =
      point.bestLocalPrice === null
        ? p.price
        : Math.min(point.bestLocalPrice, p.price);
    weekly.set(p.date, point);
  }
  const active = new Set(
    archive.reports.filter((r) => r.active && r.accepted).map((r) => r.id)
  );
  const benchmarks = selectBenchmarks(
    benchmarkRows(archive, active),
    new Date(query.asof)
  );
  const commodity = scoreAllCommodities(
    offers.filter((o) => o.cycle === cycle).map((o) => o.payload),
    'ALL',
    benchmarks.overrides,
    query.stores.length ? (query.stores as StoreChain[]) : undefined,
    {
      [query.ingredient]:
        mode === 'demo'
          ? emptyHistory()
          : summarizeHistory([...weekly.values()]),
    }
  ).find((c) => c.ingredient.id === query.ingredient);
  if (!commodity) return null;
  commodity.usdaBenchmark = benchmarks.provenance[query.ingredient];
  return {
    commodity,
    offerIds: offers
      .filter(
        (o) =>
          o.cycle === cycle &&
          o.payload.id === commodity.bestOffer.id &&
          o.store === commodity.bestOffer.store
      )
      .map((o) => `offer:${o.id}`),
    cycle,
    trace: calculateValueScore(
      commodity.ingredient,
      commodity.bestOffer.normalizedPricePerUnit,
      commodity.bestOffer.regularPricePerUnit
    ),
  };
}
export function deriveData(
  archive: Archive,
  query: ExplorerQuery,
  mode: 'verified' | 'demo'
): ExplorerData {
  const snapshot = hash({ archive, asof: query.asof });
  if (query.snapshot && query.snapshot !== snapshot)
    throw new ExplorerError(
      'The stored snapshot changed. Reload before continuing or exporting.',
      409
    );
  const points = historyPoints(archive, query);
  return {
    mode,
    asof: query.asof,
    snapshot,
    reports: archive.reports,
    points,
    coverage: {
      localWeeks: new Set(
        points.filter((p) => !p.series.startsWith('USDA')).map((p) => p.date)
      ).size,
      usdaPeriods: new Set(
        points.filter((p) => p.series.startsWith('USDA')).map((p) => p.date)
      ).size,
      start: query.start,
      end: query.end,
    },
    score: explainScore(archive, query, mode),
    warnings: [
      ...(mode === 'demo'
        ? [
            'Synthetic local demonstration prices. No verified USDA reports are manufactured.',
          ]
        : []),
      'USDA series measure advertised retail benchmarks, currently national. Store series measure observed advertisements, not shelf-price surveys.',
      'Score uses the most recent archived offer cycle in this window and today’s scoring policy. It may differ from the live dashboard; this is not a recorded historical score.',
      'Missing observations remain gaps. Weekly patterns do not establish seasonality or predict future prices.',
    ],
  };
}
