import { marketClient } from '@/lib/market/client';
import { hash, record, validateConfig } from '@/lib/usda/adapter';
import {
  publicSourceRow,
  publicReport,
  publicConfig,
  REPORT_BYTE_LIMIT,
} from './public-fields';
import { demoArchive } from './demo';
import { ExplorerError, type ExplorerQuery } from './query';
import type {
  Archive,
  ExplorerReport,
  ExplorerObservation,
  ExplorerOffer,
} from './types';
import { ALL_STORE_CHAINS } from '@/data/store-registry';
import type { StoreOffer } from '@/types/domain';
const cache = new Map<
  string,
  { expires: number; archive: Archive; mode: 'verified' | 'demo' }
>();

function offerPayload(input: unknown): StoreOffer {
  const o = record(input);
  if (
    !ALL_STORE_CHAINS.some((s) => s === o.store) ||
    !['FLIPP_LIVE', 'KROGER_API', 'CURATED_FALLBACK'].includes(
      String(o.source)
    ) ||
    ![
      'SHELF_OR_MEMBER',
      'DIGITAL_COUPON',
      'MULTI_BUY',
      'EVERYDAY_LOW',
    ].includes(String(o.dealType)) ||
    !Number.isFinite(Number(o.normalizedPricePerUnit)) ||
    Number(o.normalizedPricePerUnit) <= 0
  )
    throw new Error('invalid_archived_offer');
  return {
    id: String(o.id),
    canonicalIngredientId: String(o.canonicalIngredientId),
    store: o.store as StoreOffer['store'],
    storeLocationLabel: String(o.storeLocationLabel || ''),
    rawTitle: String(o.rawTitle || ''),
    rawPriceText: String(o.rawPriceText || ''),
    salePrice: Number.isFinite(Number(o.salePrice)) ? Number(o.salePrice) : 0,
    saleUnit: String(o.saleUnit || ''),
    normalizedPricePerUnit: Number(o.normalizedPricePerUnit),
    regularPricePerUnit: Number.isFinite(Number(o.regularPricePerUnit))
      ? Number(o.regularPricePerUnit)
      : 0,
    dealType: o.dealType as StoreOffer['dealType'],
    dealConditions:
      typeof o.dealConditions === 'string' ? o.dealConditions : undefined,
    validFrom: String(o.validFrom || ''),
    validTo: String(o.validTo || ''),
    source: o.source as StoreOffer['source'],
  };
}
export async function readArchive(query: ExplorerQuery) {
  const client = marketClient();
  const mode: 'demo' | 'verified' =
    query.mode === 'demo' || !client ? 'demo' : 'verified';
  const key = hash({
    mode,
    zip: query.zip,
    ingredient: query.ingredient,
    start: query.start,
    end: query.end,
    asof: query.asof,
  });
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now())
    return { ...cached, asof: query.asof };
  let archive: Archive;
  if (mode === 'demo') archive = demoArchive(query);
  else {
    const { data, error } = await client!
      .rpc('read_data_explorer', {
        p_zip: query.zip,
        p_ingredient: query.ingredient,
        p_start: query.start,
        p_end: query.end,
        p_asof: query.asof,
      })
      .retry(false);
    if (error && /explorer_(row|report|size)_limit/.test(error.message))
      throw new ExplorerError(
        'This window contains too much stored data. Narrow the date range or select another ingredient.',
        413
      );
    if (error || !data)
      throw new ExplorerError(
        'Stored market data is unavailable. Retry later; synthetic data has not replaced verified history.',
        503
      );
    try {
      const raw = record(data);
      if (
        !Array.isArray(raw.reports) ||
        !Array.isArray(raw.observations) ||
        !Array.isArray(raw.offers)
      )
        throw new Error('invalid_archive');
      const reports: ExplorerReport[] = raw.reports.map((input) => {
        const r = record(input);
        return {
          id: String(r.id),
          slug: String(r.slug),
          title: String(r.title),
          period_start: String(r.period_start),
          period_end: String(r.period_end),
          published_at: String(r.published_at),
          fetched_at: String(r.fetched_at),
          adapter_version: String(r.adapter_version),
          validation: String(r.validation),
          accepted: r.accepted === true,
          active: r.active === true,
          config: publicConfig(validateConfig(r.config)),
        };
      });
      const observations: ExplorerObservation[] = raw.observations.map(
        (input) => {
          const o = record(input);
          if (
            !['NATIONAL', 'MOUNTAIN'].includes(String(o.region)) ||
            !['lb', 'doz'].includes(String(o.unit)) ||
            !Number.isFinite(Number(o.value)) ||
            Number(o.value) <= 0
          )
            throw new Error('invalid_observation');
          return {
            version_id: String(o.version_id),
            row_key: String(o.row_key),
            ingredient_id: String(o.ingredient_id),
            region: o.region as 'NATIONAL' | 'MOUNTAIN',
            value: Number(o.value),
            unit: o.unit as 'lb' | 'doz',
            feature_pct: o.feature_pct === null ? null : Number(o.feature_pct),
            original: publicSourceRow(o.original),
            mapping_version: String(o.mapping_version),
          };
        }
      );
      const offers: ExplorerOffer[] = raw.offers.map((input) => {
        const o = record(input);
        const payload = offerPayload(o.payload);
        return {
          id: Number(o.id),
          zip_code: String(o.zip_code),
          source: String(o.source),
          source_offer_id: String(o.source_offer_id),
          ingredient_id: String(o.ingredient_id),
          store: String(o.store),
          location_label: String(o.location_label),
          source_from: String(o.source_from),
          source_to: String(o.source_to),
          cycle: String(o.cycle),
          unit: String(o.unit) as 'lb' | 'doz',
          normalized_price: Number(o.normalized_price),
          payload,
          retrieved_at: String(o.retrieved_at),
          receipt_id: Number(o.receipt_id),
          receipt_count: Number(o.receipt_count),
          receipts: Array.isArray(o.receipts)
            ? o.receipts.map((r) => {
                const receipt = record(r);
                return {
                  id: Number(receipt.id),
                  retrieved_at: String(receipt.retrieved_at),
                };
              })
            : [],
        };
      });
      archive = { reports, observations, offers };
    } catch {
      throw new ExplorerError(
        'Stored data could not be validated. No estimates have been substituted.',
        503
      );
    }
  }
  // Small bounded process cache. Snapshot token additionally detects changed results across workers.
  if (cache.size >= 24) cache.delete(cache.keys().next().value!);
  cache.set(key, { archive, mode, expires: Date.now() + 60_000 });
  return { archive, mode, asof: query.asof };
}
export async function readReport(version: string) {
  const client = marketClient();
  if (!client)
    throw new ExplorerError(
      'USDA reports are unavailable in demonstration mode.',
      404
    );
  const { data, error } = await client
    .from('usda_report_versions')
    .select(
      'id,slug,period_start,period_end,published_at,fetched_at,adapter_version,config_snapshot,payload,validation'
    )
    .eq('id', version)
    .maybeSingle();
  if (error) throw new ExplorerError('Report storage is unavailable.', 503);
  if (!data) throw new ExplorerError('Report version not found.', 404);
  if (Buffer.byteLength(JSON.stringify(data.payload)) > REPORT_BYTE_LIMIT)
    throw new ExplorerError(
      'Report exceeds the public inspection size limit.',
      413
    );
  return {
    id: data.id,
    slug: data.slug,
    period_start: data.period_start,
    period_end: data.period_end,
    published_at: data.published_at,
    fetched_at: data.fetched_at,
    adapter_version: data.adapter_version,
    validation: data.validation,
    config: publicConfig(validateConfig(data.config_snapshot)),
    representation:
      'Sanitized public projection of the preserved USDA report. Only audited market fields are included. Not the byte-original API response.',
    attribution: 'U.S. Department of Agriculture',
    source: 'https://mymarketnews.ams.usda.gov/mymarketnews-api',
    payload: publicReport(data.payload),
  };
}
