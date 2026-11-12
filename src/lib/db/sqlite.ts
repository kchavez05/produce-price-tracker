import { withoutDerivedPantryPricing } from '@/lib/pantry/saved-pricing';
import { currentAdCycle } from '@/lib/offer-freshness';
import { createHash, randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { CANONICAL_INGREDIENTS } from '@/data/canonical-ingredients';
import { MEAD_WEEKLY_STORE_OFFERS } from '@/data/mead-baseline-offers';
import {
  AuthProviderType,
  CommodityCategory,
  CookingVesselArchetype,
  DietaryConstraint,
  FreezerItem,
  MacroGoal,
  PriceHistoryPoint,
  RecommendedDish,
  StoreChain,
  StoreOffer,
  SyncRunLogEntry,
  UserPreferences,
  UserProfile,
} from '@/types/domain';
import { ALL_STORE_CHAINS } from '@/data/store-registry';
import { PantryEntry, PantryMutation, PantryMutationResult, PantryOwner } from '@/types/pantry';
import { LegacyPantrySource, migrateLegacyPantry, PantryMigrationSnapshot } from '@/lib/pantry/migration';
import { pantryIdentity, pantryCatalog, validatePantryEntry } from '@/lib/pantry/model';
import { evaluatePantryMutation, mutationFingerprint, PantryError, validatePantryMutation } from '@/lib/pantry/mutations';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE_PATH = path.join(DATA_DIR, 'mead-price-history.sqlite');

const PRIOR_WEEKS: { weekStart: string; label: string; idx: number }[] = [
  { weekStart: '2026-09-09', label: 'Sep 9', idx: 0 },
  { weekStart: '2026-09-16', label: 'Sep 16', idx: 1 },
  { weekStart: '2026-09-23', label: 'Sep 23', idx: 2 },
  { weekStart: '2026-09-30', label: 'Sep 30', idx: 3 },
  { weekStart: '2026-10-07', label: 'Oct 7', idx: 4 },
  { weekStart: '2026-10-14', label: 'Oct 14 (sample)', idx: 5 },
];

let dbInstance: DatabaseSync | null = null;
let dbLocationLabel = DB_FILE_PATH;

export function resetSqliteTestInstance(): void {
  if (dbInstance) {
    try {
      dbInstance.close();
    } catch {
      // ignore
    }
    dbInstance = null;
  }
}

function pantryUserId(owner: PantryOwner): string { return owner.slice(owner.indexOf(':') + 1); }

export function readPantryFromSqlite(owner: PantryOwner): PantryMigrationSnapshot {
  const userId = pantryUserId(owner);
  const rows = getDb().prepare('SELECT entry_json FROM user_pantry_entries WHERE user_id = ? ORDER BY id').all(userId) as { entry_json: string }[];
  const entries = rows.map((row) => JSON.parse(row.entry_json) as PantryEntry);
  const archived = getDb().prepare('SELECT source_json FROM user_pantry_migrations WHERE user_id = ?').get(userId) as { source_json: string } | undefined;
  const legacySource: LegacyPantrySource = archived ? JSON.parse(archived.source_json) : {
    owner, freezerItems: getUserFreezerItemsFromSqlite(userId), onHandIngredientIds: getUserPreferencesFromSqlite(userId).onHandIngredientIds,
  };
  return { owner, entries, legacySource, ...(archived ? { legacyMigrationVersion: 1 as const } : {}),
    needsCatalogMatch: entries.filter((entry) => !entry.ingredientId && !entry.deletedAtIso).map((entry) => entry.id) };
}

export function readAcceptedPantryCatalogFromSqlite(): string[] {
  return (getDb().prepare('SELECT id FROM pantry_catalog ORDER BY id').all() as { id: string }[]).map((row) => row.id);
}

export function hasPantryMigrationInSqlite(userId: string): boolean {
  return Boolean(getDb().prepare('SELECT 1 FROM user_pantry_migrations WHERE user_id = ?').get(userId));
}

function writePantryEntryToSqlite(userId: string, entry: PantryEntry): void {
  getDb().prepare(`INSERT INTO user_pantry_entries(user_id,id,identity_key,entry_json) VALUES(?,?,?,?)
    ON CONFLICT(user_id,id) DO UPDATE SET identity_key=excluded.identity_key, entry_json=excluded.entry_json`)
    .run(userId, entry.id, pantryIdentity(entry), JSON.stringify(entry));
}

export function migratePantryInSqlite(owner: PantryOwner): PantryMigrationSnapshot {
  const db = getDb();
  db.exec('BEGIN IMMEDIATE');
  try {
    const current = readPantryFromSqlite(owner);
    if (!current.legacyMigrationVersion) {
      const prepared = migrateLegacyPantry(current, current.legacySource!, new Date().toISOString());
      for (const entry of prepared.entries) {
        const validated = validatePantryEntry(entry);
        if (!validated.ok) throw new PantryError('invalid_entry', 400, 'Review invalid legacy ingredient details before migrating.');
        writePantryEntryToSqlite(pantryUserId(owner), { ...entry, ...validated.value, revision: Math.max(1, entry.revision) });
      }
      db.prepare('INSERT INTO user_pantry_migrations(user_id,source_json) VALUES(?,?)')
        .run(pantryUserId(owner), JSON.stringify(prepared.legacySource));
    }
    const result = readPantryFromSqlite(owner);
    db.exec('COMMIT');
    return result;
  } catch (error) { db.exec('ROLLBACK'); throw error; }
}

export function mutatePantryInSqlite(owner: PantryOwner, mutation: PantryMutation): PantryMutationResult {
  mutation = validatePantryMutation(mutation, true);
  const db = getDb();
  const userId = pantryUserId(owner);
  const fingerprint = mutationFingerprint(mutation);
  db.exec('BEGIN IMMEDIATE');
  try {
    if (!hasPantryMigrationInSqlite(userId)) throw new PantryError('migration_required', 409, 'Migrate this private inventory before editing the pantry.');
    const prior = db.prepare('SELECT fingerprint,result_json FROM user_pantry_mutations WHERE user_id=? AND mutation_id=?')
      .get(userId, mutation.mutationId) as { fingerprint: string; result_json: string } | undefined;
    let result: PantryMutationResult;
    if (prior) {
      if (prior.fingerprint !== fingerprint) throw new PantryError('mutation_id_reused', 409, 'Use a new mutation ID for a different edit.');
      result = JSON.parse(prior.result_json) as PantryMutationResult;
    } else {
      if (mutation.operation === 'put' && mutation.entry.ingredientId &&
          !db.prepare('SELECT 1 FROM pantry_catalog WHERE id=?').get(mutation.entry.ingredientId) &&
          !readPantryFromSqlite(owner).entries.some((entry) => entry.id === mutation.entryId && entry.ingredientId === mutation.entry.ingredientId)) throw new PantryError('invalid_entry', 400, 'Choose an accepted catalog ingredient.');
      result = evaluatePantryMutation(readPantryFromSqlite(owner).entries, mutation, new Date().toISOString());
      if (result.status === 'applied') {
        writePantryEntryToSqlite(userId, result.entry);
        db.prepare('INSERT INTO user_pantry_mutations(user_id,mutation_id,fingerprint,result_json) VALUES(?,?,?,?)')
          .run(userId, mutation.mutationId, fingerprint, JSON.stringify(result));
      }
    }
    db.exec('COMMIT');
    return result;
  } catch (error) { db.exec('ROLLBACK'); throw error; }
}

function getDb(): DatabaseSync {
  if (dbInstance) return dbInstance;

  const targetPath = process.env.PANTRYBOT_SQLITE_PATH || DB_FILE_PATH;

  if (targetPath === ':memory:') {
    dbInstance = new DatabaseSync(':memory:');
    dbLocationLabel = ':memory: (in-memory SQLite)';
  } else {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      dbInstance = new DatabaseSync(targetPath);
      dbLocationLabel = targetPath;
    } catch {
      dbInstance = new DatabaseSync(':memory:');
      dbLocationLabel = ':memory: (in-memory SQLite)';
    }
  }

  initSchemaAndSeed(dbInstance);
  return dbInstance;
}

function initSchemaAndSeed(db: DatabaseSync) {
  db.exec(`
    PRAGMA foreign_keys = ON;

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

    CREATE TABLE IF NOT EXISTS user_accounts (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      display_name TEXT NOT NULL,
      avatar_url TEXT,
      provider TEXT NOT NULL,
      created_at_iso TEXT NOT NULL,
      updated_at_iso TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS local_sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_preferences (
      user_id TEXT PRIMARY KEY REFERENCES user_accounts(id) ON DELETE CASCADE,
      default_zip TEXT NOT NULL,
      favorite_store_ids_json TEXT NOT NULL,
      macro_goal TEXT NOT NULL,
      dietary_constraints_json TEXT NOT NULL,
      vessel_archetype TEXT NOT NULL,
      target_servings INTEGER NOT NULL,
      pinned_ingredient_ids_json TEXT NOT NULL,
      on_hand_ingredient_ids_json TEXT NOT NULL,
      updated_at_iso TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_freezer_items (
      id TEXT NOT NULL,
      user_id TEXT NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
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
      notes TEXT,
      updated_at_iso TEXT NOT NULL,
      PRIMARY KEY (user_id, id)
    );

    CREATE TABLE IF NOT EXISTS user_saved_recipes (
      id TEXT NOT NULL,
      user_id TEXT NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
      dish_json TEXT NOT NULL,
      updated_at_iso TEXT NOT NULL,
      PRIMARY KEY (user_id, id)
    );

    CREATE TABLE IF NOT EXISTS pantry_catalog (id TEXT PRIMARY KEY);
    CREATE TABLE IF NOT EXISTS user_pantry_entries (
      user_id TEXT NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
      id TEXT NOT NULL,
      identity_key TEXT NOT NULL,
      entry_json TEXT NOT NULL,
      PRIMARY KEY (user_id, id), UNIQUE (user_id, identity_key)
    );
    CREATE TABLE IF NOT EXISTS user_pantry_migrations (
      user_id TEXT PRIMARY KEY REFERENCES user_accounts(id) ON DELETE CASCADE,
      source_json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS user_pantry_mutations (
      user_id TEXT NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
      mutation_id TEXT NOT NULL,
      fingerprint TEXT NOT NULL,
      result_json TEXT NOT NULL,
      PRIMARY KEY (user_id, mutation_id)
    );
  `);

  // Append accepted IDs on startup and retain them across presentation/code rollback.
  const acceptIngredient = db.prepare('INSERT OR IGNORE INTO pantry_catalog(id) VALUES(?)');
  for (const id of pantryCatalog.keys()) acceptIngredient.run(id);

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
  adCycleWeek: string = currentAdCycle().start,
  weekLabel: string = currentAdCycle().label
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
    const cheapest = new Map<string, StoreOffer>();
    for (const offer of offers) {
      const key = `${offer.store}:${offer.canonicalIngredientId}`;
      if (!cheapest.has(key) || offer.normalizedPricePerUnit < cheapest.get(key)!.normalizedPricePerUnit) {
        cheapest.set(key, offer);
      }
    }
    for (const o of cheapest.values()) {
      const storeKey = o.store === 'KING_SOOPERS' ? 'ks' : o.store === 'SAFEWAY' ? 'sw' : o.store.toLowerCase();
      const deterministicId = `hist-${storeKey}-${o.canonicalIngredientId}-${adCycleWeek}`;
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
  const currentWeek = currentAdCycle().start;
  const earliest = new Date(`${currentWeek}T12:00:00Z`);
  earliest.setUTCDate(earliest.getUTCDate() - 35);
  const earliestWeek = earliest.toISOString().slice(0, 10);

  const offerRows = db
    .prepare(
      `SELECT ad_cycle_week, week_label, store, normalized_price_per_unit
       FROM weekly_offers
       WHERE canonical_ingredient_id = ? AND ad_cycle_week BETWEEN ? AND ?
       ORDER BY ad_cycle_week ASC`
    )
    .all(ingredientId, earliestWeek, currentWeek) as {
    ad_cycle_week: string;
    week_label: string;
    store: string;
    normalized_price_per_unit: number;
  }[];

  const usdaRows = db
    .prepare(
      `SELECT snapshot_week, weighted_avg_price
       FROM usda_snapshots
       WHERE canonical_ingredient_id = ? AND snapshot_week BETWEEN ? AND ?
       ORDER BY snapshot_week ASC`
    )
    .all(ingredientId, earliestWeek, currentWeek) as {
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
      usdaMountainAvg: vals.usda ?? null,
      bestLocalPrice: Number.isFinite(bestLocalPrice) ? bestLocalPrice : 0,
    });
  }

  const bestPrices = priceHistory
    .map((p) => p.bestLocalPrice)
    .filter((p): p is number => p !== null && p > 0);
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
  const totalCostBasis = existing
    ? Number(
        (
          existing.quantity_lb_or_doz * existing.purchase_price_per_unit +
          item.quantityLbOrDoz * item.purchasePricePerUnit
        ).toFixed(2)
      )
    : Number((item.quantityLbOrDoz * item.purchasePricePerUnit).toFixed(2));
  const unitPrice =
    finalQty > 0 ? Number((totalCostBasis / finalQty).toFixed(2)) : item.purchasePricePerUnit;
  const totalRegCost = existing
    ? Number(
        (
          existing.quantity_lb_or_doz * existing.regular_price_per_unit +
          item.quantityLbOrDoz * item.regularPricePerUnit
        ).toFixed(2)
      )
    : Number((item.quantityLbOrDoz * item.regularPricePerUnit).toFixed(2));
  const regPrice =
    finalQty > 0 ? Number((totalRegCost / finalQty).toFixed(2)) : item.regularPricePerUnit;
  const estimatedSavings = Number(Math.max(0, totalRegCost - totalCostBasis).toFixed(2));

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
    purchasePricePerUnit: unitPrice,
    regularPricePerUnit: regPrice,
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

// =========================================================
// Milestone v1.3 Multi-Tenant User Account & Sync Functions
// =========================================================

export function getDefaultUserPreferences(userId: string): UserPreferences {
  return {
    userId,
    defaultZip: '80542',
    favoriteStoreIds: [...ALL_STORE_CHAINS],
    macroGoal: 'ANY',
    dietaryConstraints: [],
    vesselArchetype: 'ANY',
    targetServings: 6,
    pinnedIngredientIds: [],
    onHandIngredientIds: [],
    updatedAtIso: new Date().toISOString(),
  };
}

export function upsertUserProfileToSqlite(profile: UserProfile): UserProfile {
  const db = getDb();
  const now = new Date().toISOString();
  const existing = db
    .prepare(
      `SELECT id, created_at_iso FROM user_accounts WHERE id = ?`
    )
    .get(profile.id) as { id: string; created_at_iso: string } | undefined;

  const createdAtIso = existing?.created_at_iso || profile.createdAtIso || now;
  const updatedAtIso = now;

  db.prepare(`
    INSERT INTO user_accounts
      (id, email, display_name, avatar_url, provider, created_at_iso, updated_at_iso)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      email = excluded.email, display_name = excluded.display_name,
      avatar_url = excluded.avatar_url, provider = excluded.provider,
      updated_at_iso = excluded.updated_at_iso
  `).run(
    profile.id,
    profile.email,
    profile.displayName,
    profile.avatarUrl || null,
    profile.provider,
    createdAtIso,
    updatedAtIso
  );

  // Ensure default preferences row exists
  const existingPrefs = db
    .prepare(`SELECT user_id FROM user_preferences WHERE user_id = ?`)
    .get(profile.id) as { user_id: string } | undefined;

  if (!existingPrefs) {
    const def = getDefaultUserPreferences(profile.id);
    upsertUserPreferencesToSqlite(def);
  }

  return {
    ...profile,
    createdAtIso,
    updatedAtIso,
  };
}

export function getUserProfileFromSqlite(userId: string): UserProfile | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT id, email, display_name, avatar_url, provider, created_at_iso, updated_at_iso
       FROM user_accounts
       WHERE id = ?`
    )
    .get(userId) as
    | {
        id: string;
        email: string;
        display_name: string;
        avatar_url: string | null;
        provider: string;
        created_at_iso: string;
        updated_at_iso: string;
      }
    | undefined;

  if (!row) return null;

  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    avatarUrl: row.avatar_url || undefined,
    provider: (row.provider === 'apple' ? 'apple' : 'google') as AuthProviderType,
    createdAtIso: row.created_at_iso,
    updatedAtIso: row.updated_at_iso,
    isCloudBacked: false,
  };
}

export function getUserPreferencesFromSqlite(userId: string): UserPreferences {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT user_id, default_zip, favorite_store_ids_json, macro_goal,
              dietary_constraints_json, vessel_archetype, target_servings,
              pinned_ingredient_ids_json, on_hand_ingredient_ids_json, updated_at_iso
       FROM user_preferences
       WHERE user_id = ?`
    )
    .get(userId) as
    | {
        user_id: string;
        default_zip: string;
        favorite_store_ids_json: string;
        macro_goal: string;
        dietary_constraints_json: string;
        vessel_archetype: string;
        target_servings: number;
        pinned_ingredient_ids_json: string;
        on_hand_ingredient_ids_json: string;
        updated_at_iso: string;
      }
    | undefined;

  if (!row) {
    return getDefaultUserPreferences(userId);
  }

  let favoriteStoreIds: StoreChain[] = [...ALL_STORE_CHAINS];
  let dietaryConstraints: DietaryConstraint[] = [];
  let pinnedIngredientIds: string[] = [];
  let onHandIngredientIds: string[] = [];

  try {
    const parsedStores = JSON.parse(row.favorite_store_ids_json);
    if (Array.isArray(parsedStores) && parsedStores.length > 0) {
      favoriteStoreIds = parsedStores as StoreChain[];
    }
  } catch {
    // Fallback
  }

  try {
    const parsedDiet = JSON.parse(row.dietary_constraints_json);
    if (Array.isArray(parsedDiet)) {
      dietaryConstraints = parsedDiet as DietaryConstraint[];
    }
  } catch {
    // Fallback
  }

  try {
    const parsedPinned = JSON.parse(row.pinned_ingredient_ids_json);
    if (Array.isArray(parsedPinned)) {
      pinnedIngredientIds = parsedPinned as string[];
    }
  } catch {
    // Fallback
  }

  try {
    const parsedOnHand = JSON.parse(row.on_hand_ingredient_ids_json);
    if (Array.isArray(parsedOnHand)) {
      onHandIngredientIds = parsedOnHand as string[];
    }
  } catch {
    // Fallback
  }

  const servings =
    row.target_servings === 4 || row.target_servings === 8 ? row.target_servings : 6;

  return {
    userId: row.user_id,
    defaultZip: row.default_zip || '80542',
    favoriteStoreIds,
    macroGoal: (row.macro_goal || 'ANY') as MacroGoal,
    dietaryConstraints,
    vesselArchetype: (row.vessel_archetype || 'ANY') as CookingVesselArchetype,
    targetServings: servings,
    pinnedIngredientIds,
    onHandIngredientIds,
    updatedAtIso: row.updated_at_iso,
  };
}

export function upsertUserPreferencesToSqlite(prefs: UserPreferences): UserPreferences {
  const db = getDb();
  if (hasPantryMigrationInSqlite(prefs.userId) &&
      JSON.stringify(prefs.onHandIngredientIds) !== JSON.stringify(getUserPreferencesFromSqlite(prefs.userId).onHandIngredientIds)) {
    throw new PantryError('pantry_upgrade_required', 426, 'Reload to manage inventory in Virtual Pantry.');
  }
  const updatedAtIso = new Date().toISOString();
  const nextPrefs: UserPreferences = {
    ...prefs,
    updatedAtIso,
  };

  db.prepare(`
    INSERT OR REPLACE INTO user_preferences
      (user_id, default_zip, favorite_store_ids_json, macro_goal,
       dietary_constraints_json, vessel_archetype, target_servings,
       pinned_ingredient_ids_json, on_hand_ingredient_ids_json, updated_at_iso)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    nextPrefs.userId,
    nextPrefs.defaultZip || '80542',
    JSON.stringify(nextPrefs.favoriteStoreIds || ALL_STORE_CHAINS),
    nextPrefs.macroGoal || 'ANY',
    JSON.stringify(nextPrefs.dietaryConstraints || []),
    nextPrefs.vesselArchetype || 'ANY',
    nextPrefs.targetServings || 6,
    JSON.stringify(nextPrefs.pinnedIngredientIds || []),
    JSON.stringify(nextPrefs.onHandIngredientIds || []),
    updatedAtIso
  );

  return nextPrefs;
}

export function getUserFreezerItemsFromSqlite(userId: string): FreezerItem[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, canonical_ingredient_id, ingredient_name, category,
              quantity_lb_or_doz, unit, purchase_price_per_unit, regular_price_per_unit,
              total_cost_basis, estimated_savings, store, store_banner, purchased_at_iso, notes
       FROM user_freezer_items
       WHERE user_id = ?
       ORDER BY purchased_at_iso DESC`
    )
    .all(userId) as {
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

export function replaceUserFreezerItemsInSqlite(
  userId: string,
  items: FreezerItem[]
): FreezerItem[] {
  if (hasPantryMigrationInSqlite(userId)) throw new PantryError('pantry_upgrade_required', 426, 'Reload to manage inventory in Virtual Pantry.');
  const db = getDb();
  const now = new Date().toISOString();

  db.exec('BEGIN TRANSACTION');
  try {
    db.prepare(`DELETE FROM user_freezer_items WHERE user_id = ?`).run(userId);

    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO user_freezer_items
        (id, user_id, canonical_ingredient_id, ingredient_name, category,
         quantity_lb_or_doz, unit, purchase_price_per_unit, regular_price_per_unit,
         total_cost_basis, estimated_savings, store, store_banner,
         purchased_at_iso, notes, updated_at_iso)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let idx = 0;
    for (const item of items) {
      if (item.quantityLbOrDoz <= 0) continue;
      idx++;
      insertStmt.run(
        item.id || `frz-${item.canonicalIngredientId}-${Date.now()}-${idx}`,
        userId,
        item.canonicalIngredientId,
        item.ingredientName,
        item.category,
        item.quantityLbOrDoz,
        item.unit === 'doz' ? 'doz' : 'lb',
        item.purchasePricePerUnit,
        item.regularPricePerUnit,
        item.totalCostBasis,
        item.estimatedSavings,
        item.store,
        item.storeBanner,
        item.purchasedAtIso || now,
        item.notes || null,
        now
      );
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  return getUserFreezerItemsFromSqlite(userId);
}

export function getUserSavedRecipesFromSqlite(userId: string): RecommendedDish[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT dish_json FROM user_saved_recipes WHERE user_id = ? ORDER BY updated_at_iso DESC`
    )
    .all(userId) as { dish_json: string }[];

  const results: RecommendedDish[] = [];
  for (const row of rows) {
    try {
      results.push(JSON.parse(row.dish_json) as RecommendedDish);
    } catch {
      // Ignore malformed JSON
    }
  }
  return results;
}

export function replaceUserSavedRecipesInSqlite(
  userId: string,
  dishes: RecommendedDish[]
): RecommendedDish[] {
  const db = getDb();
  const now = new Date().toISOString();

  db.exec('BEGIN TRANSACTION');
  try {
    db.prepare(`DELETE FROM user_saved_recipes WHERE user_id = ?`).run(userId);

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO user_saved_recipes (id, user_id, dish_json, updated_at_iso)
      VALUES (?, ?, ?, ?)
    `);

    for (const dish of dishes) {
      if (!dish.id) continue;
      stmt.run(dish.id, userId, JSON.stringify({ ...withoutDerivedPantryPricing(dish), savedInLibrary: true }), now);
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  return getUserSavedRecipesFromSqlite(userId);
}

export function deleteUserAccountFromSqlite(userId: string): void {
  const db = getDb();
  db.exec('BEGIN TRANSACTION');
  try {
    db.prepare('DELETE FROM user_pantry_mutations WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM user_pantry_entries WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM user_pantry_migrations WHERE user_id = ?').run(userId);
    db.prepare(`DELETE FROM user_saved_recipes WHERE user_id = ?`).run(userId);
    db.prepare(`DELETE FROM user_freezer_items WHERE user_id = ?`).run(userId);
    db.prepare(`DELETE FROM user_preferences WHERE user_id = ?`).run(userId);
    db.prepare(`DELETE FROM user_accounts WHERE id = ?`).run(userId);
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}


// Only server-minted opaque credentials can select a local account. Store hashes
// so a database snapshot does not expose reusable bearer tokens.
export function createLocalSession(userId: string): string {
  const db = getDb();
  db.prepare('DELETE FROM local_sessions WHERE expires_at <= ?').run(Date.now());
  const token = randomBytes(32).toString('hex');
  db.prepare('INSERT INTO local_sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
    .run(createHash('sha256').update(token).digest('hex'), userId, Date.now() + 30 * 86400_000);
  return token;
}

export function getLocalSessionProfile(token: string | undefined): UserProfile | null {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const row = getDb().prepare('SELECT user_id FROM local_sessions WHERE token_hash = ? AND expires_at > ?')
    .get(createHash('sha256').update(token).digest('hex'), Date.now()) as { user_id: string } | undefined;
  return row ? getUserProfileFromSqlite(row.user_id) : null;
}

export function revokeLocalSession(token: string | undefined): void {
  if (!token) return;
  getDb().prepare('DELETE FROM local_sessions WHERE token_hash = ?')
    .run(createHash('sha256').update(token).digest('hex'));
}

function ensureRefreshAuditTable() {
  const db = getDb();
  db.exec(`CREATE TABLE IF NOT EXISTS refresh_audit (
    id TEXT PRIMARY KEY, zip_code TEXT NOT NULL, completed_at TEXT NOT NULL,
    status TEXT NOT NULL, payload TEXT NOT NULL
  ); CREATE INDEX IF NOT EXISTS refresh_audit_zip_time ON refresh_audit(zip_code, completed_at DESC)`);
  return db;
}

export function recordRefreshAuditToSqlite(row: {
  id: string; zip_code: string; completed_at: string; status: string;
}): void {
  ensureRefreshAuditTable().prepare(
    'INSERT INTO refresh_audit (id, zip_code, completed_at, status, payload) VALUES (?, ?, ?, ?, ?)'
  ).run(row.id, row.zip_code, row.completed_at, row.status, JSON.stringify(row));
}

export function getRefreshAuditFromSqlite(zip: string): string | null {
  const row = ensureRefreshAuditTable().prepare(
    "SELECT completed_at FROM refresh_audit WHERE zip_code = ? AND status = 'live' ORDER BY completed_at DESC LIMIT 1"
  ).get(zip) as { completed_at: string } | undefined;
  return row?.completed_at ?? null;
}
