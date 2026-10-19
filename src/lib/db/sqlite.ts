import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { CANONICAL_INGREDIENTS } from '@/data/canonical-ingredients';
import { MEAD_WEEKLY_STORE_OFFERS } from '@/data/mead-baseline-offers';
import {
  CommodityCategory,
  FreezerItem,
  PriceHistoryPoint,
  StoreChain,
  StoreOffer,
  SyncRunLogEntry,
} from '@/types/domain';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE_PATH = path.join(DATA_DIR, 'mead-price-history.sqlite');

const PRIOR_WEEKS: { weekStart: string; label: string; idx: number }[] = [
  { weekStart: '2026-09-09', label: 'Sep 9', idx: 0 },
  { weekStart: '2026-09-16', label: 'Sep 16', idx: 1 },
  { weekStart: '2026-09-23', label: 'Sep 23', idx: 2 },
  { weekStart: '2026-09-30', label: 'Sep 30', idx: 3 },
  { weekStart: '2026-10-07', label: 'Oct 7', idx: 4 },
  { weekStart: '2026-10-14', label: 'Oct 14 (Now)', idx: 5 },
];

let dbInstance: DatabaseSync | null = null;
let dbLocationLabel = DB_FILE_PATH;

function getDb(): DatabaseSync {
  if (dbInstance) return dbInstance;

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    dbInstance = new DatabaseSync(DB_FILE_PATH);
    dbLocationLabel = 'data/mead-price-history.sqlite';
  } catch {
    dbInstance = new DatabaseSync(':memory:');
    dbLocationLabel = ':memory: (in-memory SQLite)';
  }

  initSchemaAndSeed(dbInstance);
  return dbInstance;
}

function initSchemaAndSeed(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS canonical_ingredients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      subcategory TEXT NOT NULL,
      standard_unit TEXT NOT NULL,
      mountain_baseline REAL NOT NULL,
      regular_price REAL NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS weekly_offers (
      id TEXT PRIMARY KEY,
      canonical_ingredient_id TEXT NOT NULL,
      store TEXT NOT NULL,
      ad_cycle_week TEXT NOT NULL,
      week_label TEXT NOT NULL,
      raw_title TEXT NOT NULL,
      raw_price_text TEXT NOT NULL,
      sale_price REAL NOT NULL,
      sale_unit TEXT NOT NULL,
      normalized_price_per_unit REAL NOT NULL,
      regular_price_per_unit REAL NOT NULL,
      deal_type TEXT NOT NULL,
      deal_conditions TEXT,
      source TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_weekly_offers_ing_week
      ON weekly_offers(canonical_ingredient_id, ad_cycle_week);

    CREATE TABLE IF NOT EXISTS usda_snapshots (
      id TEXT PRIMARY KEY,
      canonical_ingredient_id TEXT NOT NULL,
      report_slug TEXT NOT NULL,
      snapshot_week TEXT NOT NULL,
      region TEXT NOT NULL,
      weighted_avg_price REAL NOT NULL,
      wholesale_change_pct REAL NOT NULL,
      ad_feature_pct REAL NOT NULL,
      trend TEXT NOT NULL,
      note TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_usda_snapshots_ing_week
      ON usda_snapshots(canonical_ingredient_id, snapshot_week);

    CREATE TABLE IF NOT EXISTS saved_recipes (
      id TEXT PRIMARY KEY,
      dish_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_runs (
      id TEXT PRIMARY KEY,
      cycle TEXT NOT NULL,
      synced_offers_count INTEGER NOT NULL,
      flipp_live INTEGER NOT NULL,
      kroger_live INTEGER NOT NULL,
      usda_live INTEGER NOT NULL,
      top_dish_title TEXT NOT NULL,
      optimal_basket_total REAL NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS freezer_inventory (
      id TEXT PRIMARY KEY,
      canonical_ingredient_id TEXT NOT NULL,
      ingredient_name TEXT NOT NULL,
      category TEXT NOT NULL,
      quantity_lb_or_doz REAL NOT NULL,
      unit TEXT NOT NULL,
      purchase_price_per_unit REAL NOT NULL,
      regular_price_per_unit REAL NOT NULL,
      total_cost_basis REAL NOT NULL,
      estimated_savings REAL NOT NULL,
      store TEXT NOT NULL,
      store_banner TEXT NOT NULL,
      purchased_at_iso TEXT NOT NULL,
      notes TEXT
    );
  `);

  // Check if weekly_offers already seeded
  const countRow = db
    .prepare('SELECT COUNT(*) as cnt FROM weekly_offers')
    .get() as { cnt: number } | undefined;

  if (countRow && countRow.cnt > 0) {
    return;
  }

  const nowIso = new Date().toISOString();

  const insertIngredient = db.prepare(`
    INSERT OR REPLACE INTO canonical_ingredients
      (id, name, category, subcategory, standard_unit, mountain_baseline, regular_price, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertOffer = db.prepare(`
    INSERT OR REPLACE INTO weekly_offers
      (id, canonical_ingredient_id, store, ad_cycle_week, week_label, raw_title, raw_price_text,
       sale_price, sale_unit, normalized_price_per_unit, regular_price_per_unit, deal_type, deal_conditions, source, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertUsda = db.prepare(`
    INSERT OR REPLACE INTO usda_snapshots
      (id, canonical_ingredient_id, report_slug, snapshot_week, region, weighted_avg_price,
       wholesale_change_pct, ad_feature_pct, trend, note, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  db.exec('BEGIN TRANSACTION');
  try {
    for (let i = 0; i < CANONICAL_INGREDIENTS.length; i++) {
      const ing = CANONICAL_INGREDIENTS[i];
      insertIngredient.run(
        ing.id,
        ing.name,
        ing.category,
        ing.subcategory,
        ing.standardUnit,
        ing.mountainBaselinePerUnit,
        ing.typicalRegularPerUnit,
        nowIso
      );

      const currentKs = MEAD_WEEKLY_STORE_OFFERS.find(
        (o) => o.canonicalIngredientId === ing.id && o.store === 'KING_SOOPERS'
      );
      const currentSw = MEAD_WEEKLY_STORE_OFFERS.find(
        (o) => o.canonicalIngredientId === ing.id && o.store === 'SAFEWAY'
      );

      // Seed 5 prior weeks + current week (2026-10-14) to model realistic 4-week promotional cycles
      for (const wk of PRIOR_WEEKS) {
        const isCurrentWeek = wk.weekStart === '2026-10-14';

        // Deterministic store ad-rotation wave so historical prices show realistic 3-4 week promos vs shelf weeks
        const ksCycleFactor = ((i + wk.idx) % 3 === 0) ? 0.72 : ((i + wk.idx) % 3 === 1) ? 0.92 : 0.84;
        const swCycleFactor = ((i + wk.idx + 1) % 3 === 0) ? 0.70 : ((i + wk.idx + 1) % 3 === 1) ? 0.94 : 0.85;

        const ksPrice = isCurrentWeek && currentKs
          ? currentKs.normalizedPricePerUnit
          : Number((ing.typicalRegularPerUnit * ksCycleFactor).toFixed(2));

        const swPrice = isCurrentWeek && currentSw
          ? currentSw.normalizedPricePerUnit
          : Number((ing.typicalRegularPerUnit * swCycleFactor).toFixed(2));

        const usdaWeekAvg = Number(
          (
            ing.mountainBaselinePerUnit *
            (1 + ((wk.idx - 3) * (ing.usdaSignal.wholesaleChangePct / 100)) * 0.12)
          ).toFixed(2)
        );

        insertOffer.run(
          `hist-ks-${ing.id}-${wk.weekStart}`,
          ing.id,
          'KING_SOOPERS',
          wk.weekStart,
          wk.label,
          currentKs?.rawTitle || `${ing.name} (King Soopers)`,
          isCurrentWeek && currentKs ? currentKs.rawPriceText : `$${ksPrice.toFixed(2)}/${ing.standardUnit}`,
          ksPrice,
          ing.standardUnit,
          ksPrice,
          ing.typicalRegularPerUnit,
          isCurrentWeek && currentKs ? currentKs.dealType : 'SHELF_OR_MEMBER',
          isCurrentWeek && currentKs ? currentKs.dealConditions || null : null,
          isCurrentWeek ? 'CURATED_FALLBACK' : 'SQLITE_HISTORICAL',
          nowIso
        );

        insertOffer.run(
          `hist-sw-${ing.id}-${wk.weekStart}`,
          ing.id,
          'SAFEWAY',
          wk.weekStart,
          wk.label,
          currentSw?.rawTitle || `${ing.name} (Safeway)`,
          isCurrentWeek && currentSw ? currentSw.rawPriceText : `$${swPrice.toFixed(2)}/${ing.standardUnit}`,
          swPrice,
          ing.standardUnit,
          swPrice,
          ing.typicalRegularPerUnit,
          isCurrentWeek && currentSw ? currentSw.dealType : 'SHELF_OR_MEMBER',
          isCurrentWeek && currentSw ? currentSw.dealConditions || null : null,
          isCurrentWeek ? 'CURATED_FALLBACK' : 'SQLITE_HISTORICAL',
          nowIso
        );

        insertUsda.run(
          `usda-${ing.id}-${wk.weekStart}`,
          ing.id,
          ing.usdaSignal.usdaReportSlug,
          wk.weekStart,
          'Mountain',
          usdaWeekAvg,
          ing.usdaSignal.wholesaleChangePct,
          ing.usdaSignal.mountainAdFeaturePct,
          ing.usdaSignal.trend,
          ing.usdaSignal.note,
          nowIso
        );
      }
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

/**
 * Persists any live-fetched Flipp or Kroger offers for the current ad cycle week into SQLite.
 */
export function persistLiveOffersToSqlite(
  offers: StoreOffer[],
  adCycleWeek: string = '2026-10-14',
  weekLabel: string = 'Oct 14 (Now)'
): void {
  if (offers.length === 0) return;
  const db = getDb();
  const nowIso = new Date().toISOString();

  const upsert = db.prepare(`
    INSERT OR REPLACE INTO weekly_offers
      (id, canonical_ingredient_id, store, ad_cycle_week, week_label, raw_title, raw_price_text,
       sale_price, sale_unit, normalized_price_per_unit, regular_price_per_unit, deal_type, deal_conditions, source, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  db.exec('BEGIN TRANSACTION');
  try {
    for (const o of offers) {
      const deterministicId = `hist-${o.store === 'KING_SOOPERS' ? 'ks' : 'sw'}-${o.canonicalIngredientId}-${adCycleWeek}`;
      upsert.run(
        deterministicId,
        o.canonicalIngredientId,
        o.store,
        adCycleWeek,
        weekLabel,
        o.rawTitle,
        o.rawPriceText,
        o.salePrice,
        o.saleUnit,
        o.normalizedPricePerUnit,
        o.regularPricePerUnit,
        o.dealType,
        o.dealConditions || null,
        o.source,
        nowIso
      );
    }
    db.exec('COMMIT');
  } catch {
    db.exec('ROLLBACK');
  }
}

/**
 * Queries SQLite for the 6-week price history series of a canonical ingredient,
 * including min (low), max (high), median, and mean (Ticket #24).
 */
export function getIngredientHistoryFromSqlite(ingredientId: string): {
  priceHistory: PriceHistoryPoint[];
  sixWeekLocalAvg: number;
  sixWeekLow: number;
  sixWeekHigh: number;
  sixWeekMedian: number;
} {
  const db = getDb();

  const offerRows = db
    .prepare(
      `SELECT ad_cycle_week, week_label, store, normalized_price_per_unit
       FROM weekly_offers
       WHERE canonical_ingredient_id = ?
       ORDER BY ad_cycle_week ASC`
    )
    .all(ingredientId) as {
    ad_cycle_week: string;
    week_label: string;
    store: string;
    normalized_price_per_unit: number;
  }[];

  const usdaRows = db
    .prepare(
      `SELECT snapshot_week, weighted_avg_price
       FROM usda_snapshots
       WHERE canonical_ingredient_id = ?
       ORDER BY snapshot_week ASC`
    )
    .all(ingredientId) as {
    snapshot_week: string;
    weighted_avg_price: number;
  }[];

  const usdaMap = new Map<string, number>();
  for (const u of usdaRows) {
    usdaMap.set(u.snapshot_week, u.weighted_avg_price);
  }

  const weekMap = new Map<
    string,
    { label: string; ks?: number; sw?: number; usda?: number }
  >();

  for (const row of offerRows) {
    const existing = weekMap.get(row.ad_cycle_week) || {
      label: row.week_label,
      usda: usdaMap.get(row.ad_cycle_week),
    };
    if (row.store === 'KING_SOOPERS') {
      existing.ks = row.normalized_price_per_unit;
    } else if (row.store === 'SAFEWAY') {
      existing.sw = row.normalized_price_per_unit;
    }
    weekMap.set(row.ad_cycle_week, existing);
  }

  const priceHistory: PriceHistoryPoint[] = [];
  for (const [weekStart, vals] of weekMap.entries()) {
    const ks = vals.ks ?? vals.sw ?? 0;
    const sw = vals.sw ?? vals.ks ?? 0;
    const bestLocalPrice = Math.min(ks || Infinity, sw || Infinity);
    priceHistory.push({
      weekStart,
      label: vals.label,
      kingSoopersPrice: ks,
      safewayPrice: sw,
      usdaMountainAvg: vals.usda ?? ks,
      bestLocalPrice: Number.isFinite(bestLocalPrice) ? bestLocalPrice : 0,
    });
  }

  const bestPrices = priceHistory
    .map((p) => p.bestLocalPrice)
    .filter((p) => p > 0);
  const sixWeekLocalAvg =
    bestPrices.length > 0
      ? Number(
          (
            bestPrices.reduce((a, b) => a + b, 0) / bestPrices.length
          ).toFixed(2)
        )
      : 0;
  const sixWeekLow =
    bestPrices.length > 0 ? Number(Math.min(...bestPrices).toFixed(2)) : 0;
  const sixWeekHigh =
    bestPrices.length > 0 ? Number(Math.max(...bestPrices).toFixed(2)) : 0;

  let sixWeekMedian = sixWeekLocalAvg;
  if (bestPrices.length > 0) {
    const sorted = [...bestPrices].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    sixWeekMedian =
      sorted.length % 2 === 0
        ? Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2))
        : Number(sorted[mid].toFixed(2));
  }

  return {
    priceHistory,
    sixWeekLocalAvg,
    sixWeekLow,
    sixWeekHigh,
    sixWeekMedian,
  };
}

export function getSqliteDatabaseStats(): {
  dbPath: string;
  totalHistoricalOfferRows: number;
  totalUsdaSnapshotRows: number;
  trackedWeeksCount: number;
} {
  const db = getDb();
  const offerCnt = (
    db.prepare('SELECT COUNT(*) as cnt FROM weekly_offers').get() as {
      cnt: number;
    }
  ).cnt;
  const usdaCnt = (
    db.prepare('SELECT COUNT(*) as cnt FROM usda_snapshots').get() as {
      cnt: number;
    }
  ).cnt;
  const weeksCnt = (
    db
      .prepare('SELECT COUNT(DISTINCT ad_cycle_week) as cnt FROM weekly_offers')
      .get() as { cnt: number }
  ).cnt;

  return {
    dbPath: dbLocationLabel,
    totalHistoricalOfferRows: offerCnt,
    totalUsdaSnapshotRows: usdaCnt,
    trackedWeeksCount: weeksCnt,
  };
}

export function getSavedRecipesFromSqlite(): unknown[] {
  const db = getDb();
  const rows = db
    .prepare('SELECT dish_json FROM saved_recipes ORDER BY created_at DESC')
    .all() as { dish_json: string }[];

  const list: unknown[] = [];
  for (const r of rows) {
    try {
      list.push(JSON.parse(r.dish_json));
    } catch {
      // Ignore malformed row
    }
  }
  return list;
}

export function saveRecipeToSqlite(id: string, dishPayload: unknown): void {
  const db = getDb();
  const stmt = db.prepare(
    'INSERT OR REPLACE INTO saved_recipes (id, dish_json, created_at) VALUES (?, ?, ?)'
  );
  stmt.run(id, JSON.stringify(dishPayload), new Date().toISOString());
}

export function deleteSavedRecipeFromSqlite(id: string): void {
  const db = getDb();
  const stmt = db.prepare('DELETE FROM saved_recipes WHERE id = ?');
  stmt.run(id);
}

// =========================================================
// Virtual Freezer SQLite Persistence (v1.2 Ticket #21)
// =========================================================

export function getFreezerItemsFromSqlite(): FreezerItem[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, canonical_ingredient_id, ingredient_name, category,
              quantity_lb_or_doz, unit, purchase_price_per_unit, regular_price_per_unit,
              total_cost_basis, estimated_savings, store, store_banner, purchased_at_iso, notes
       FROM freezer_inventory
       ORDER BY purchased_at_iso DESC`
    )
    .all() as {
    id: string;
    canonical_ingredient_id: string;
    ingredient_name: string;
    category: string;
    quantity_lb_or_doz: number;
    unit: string;
    purchase_price_per_unit: number;
    regular_price_per_unit: number;
    total_cost_basis: number;
    estimated_savings: number;
    store: string;
    store_banner: string;
    purchased_at_iso: string;
    notes: string | null;
  }[];

  return rows.map((r) => ({
    id: r.id,
    canonicalIngredientId: r.canonical_ingredient_id,
    ingredientName: r.ingredient_name,
    category: r.category as CommodityCategory,
    quantityLbOrDoz: r.quantity_lb_or_doz,
    unit: (r.unit === 'doz' ? 'doz' : 'lb') as 'lb' | 'doz',
    purchasePricePerUnit: r.purchase_price_per_unit,
    regularPricePerUnit: r.regular_price_per_unit,
    totalCostBasis: r.total_cost_basis,
    estimatedSavings: r.estimated_savings,
    store: r.store as StoreChain,
    storeBanner: r.store_banner,
    purchasedAtIso: r.purchased_at_iso,
    notes: r.notes || undefined,
  }));
}

export function upsertFreezerItemToSqlite(item: FreezerItem): FreezerItem {
  const db = getDb();
  const existing = db
    .prepare(
      `SELECT id, quantity_lb_or_doz, purchase_price_per_unit, regular_price_per_unit
       FROM freezer_inventory
       WHERE canonical_ingredient_id = ?`
    )
    .get(item.canonicalIngredientId) as
    | {
        id: string;
        quantity_lb_or_doz: number;
        purchase_price_per_unit: number;
        regular_price_per_unit: number;
      }
    | undefined;

  const finalId = existing?.id || item.id || `frz-${item.canonicalIngredientId}-${Date.now()}`;
  const finalQty = existing
    ? Number((existing.quantity_lb_or_doz + item.quantityLbOrDoz).toFixed(2))
    : Number(item.quantityLbOrDoz.toFixed(2));
  const unitPrice = item.purchasePricePerUnit;
  const regPrice = item.regularPricePerUnit;
  const totalCostBasis = Number((finalQty * unitPrice).toFixed(2));
  const estimatedSavings = Number(
    Math.max(0, finalQty * (regPrice - unitPrice)).toFixed(2)
  );

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO freezer_inventory
      (id, canonical_ingredient_id, ingredient_name, category, quantity_lb_or_doz, unit,
       purchase_price_per_unit, regular_price_per_unit, total_cost_basis, estimated_savings,
       store, store_banner, purchased_at_iso, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const saved: FreezerItem = {
    ...item,
    id: finalId,
    quantityLbOrDoz: finalQty,
    totalCostBasis,
    estimatedSavings,
  };

  stmt.run(
    saved.id,
    saved.canonicalIngredientId,
    saved.ingredientName,
    saved.category,
    saved.quantityLbOrDoz,
    saved.unit,
    saved.purchasePricePerUnit,
    saved.regularPricePerUnit,
    saved.totalCostBasis,
    saved.estimatedSavings,
    saved.store,
    saved.storeBanner,
    saved.purchasedAtIso,
    saved.notes || null
  );

  return saved;
}

export function updateFreezerItemQuantityInSqlite(
  id: string,
  quantityLbOrDoz: number
): FreezerItem | null {
  const db = getDb();
  if (quantityLbOrDoz <= 0) {
    deleteFreezerItemFromSqlite(id);
    return null;
  }

  const existing = db
    .prepare(
      `SELECT id, canonical_ingredient_id, ingredient_name, category,
              quantity_lb_or_doz, unit, purchase_price_per_unit, regular_price_per_unit,
              store, store_banner, purchased_at_iso, notes
       FROM freezer_inventory
       WHERE id = ?`
    )
    .get(id) as
    | {
        id: string;
        canonical_ingredient_id: string;
        ingredient_name: string;
        category: string;
        quantity_lb_or_doz: number;
        unit: string;
        purchase_price_per_unit: number;
        regular_price_per_unit: number;
        store: string;
        store_banner: string;
        purchased_at_iso: string;
        notes: string | null;
      }
    | undefined;

  if (!existing) return null;

  const qty = Number(quantityLbOrDoz.toFixed(2));
  const totalCostBasis = Number((qty * existing.purchase_price_per_unit).toFixed(2));
  const estimatedSavings = Number(
    Math.max(
      0,
      qty * (existing.regular_price_per_unit - existing.purchase_price_per_unit)
    ).toFixed(2)
  );

  db.prepare(
    `UPDATE freezer_inventory
     SET quantity_lb_or_doz = ?, total_cost_basis = ?, estimated_savings = ?
     WHERE id = ?`
  ).run(qty, totalCostBasis, estimatedSavings, id);

  return {
    id: existing.id,
    canonicalIngredientId: existing.canonical_ingredient_id,
    ingredientName: existing.ingredient_name,
    category: existing.category as CommodityCategory,
    quantityLbOrDoz: qty,
    unit: (existing.unit === 'doz' ? 'doz' : 'lb') as 'lb' | 'doz',
    purchasePricePerUnit: existing.purchase_price_per_unit,
    regularPricePerUnit: existing.regular_price_per_unit,
    totalCostBasis,
    estimatedSavings,
    store: existing.store as StoreChain,
    storeBanner: existing.store_banner,
    purchasedAtIso: existing.purchased_at_iso,
    notes: existing.notes || undefined,
  };
}

export function deleteFreezerItemFromSqlite(id: string): void {
  const db = getDb();
  db.prepare('DELETE FROM freezer_inventory WHERE id = ? OR canonical_ingredient_id = ?').run(
    id,
    id
  );
}

export function recordSyncRunToSqlite(
  entry: Omit<SyncRunLogEntry, 'id' | 'createdAt'>
): SyncRunLogEntry {
  const db = getDb();
  const id = `sync-${Date.now()}`;
  const createdAt = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO sync_runs
      (id, cycle, synced_offers_count, flipp_live, kroger_live, usda_live, top_dish_title, optimal_basket_total, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    id,
    entry.cycle,
    entry.syncedOffersCount,
    entry.flippLive ? 1 : 0,
    entry.krogerLive ? 1 : 0,
    entry.usdaLive ? 1 : 0,
    entry.topDishTitle,
    entry.optimalBasketTotal,
    createdAt
  );
  return {
    id,
    ...entry,
    createdAt,
  };
}

export function getRecentSyncRunsFromSqlite(limit = 6): SyncRunLogEntry[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, cycle, synced_offers_count, flipp_live, kroger_live, usda_live, top_dish_title, optimal_basket_total, created_at
       FROM sync_runs
       ORDER BY created_at DESC
       LIMIT ?`
    )
    .all(limit) as {
    id: string;
    cycle: string;
    synced_offers_count: number;
    flipp_live: number;
    kroger_live: number;
    usda_live: number;
    top_dish_title: string;
    optimal_basket_total: number;
    created_at: string;
  }[];

  return rows.map((r) => ({
    id: r.id,
    cycle: r.cycle,
    syncedOffersCount: r.synced_offers_count,
    flippLive: Boolean(r.flipp_live),
    krogerLive: Boolean(r.kroger_live),
    usdaLive: Boolean(r.usda_live),
    topDishTitle: r.top_dish_title,
    optimalBasketTotal: r.optimal_basket_total,
    createdAt: r.created_at,
  }));
}
