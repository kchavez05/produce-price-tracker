import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import {
  getSqliteDatabaseStats,
  getFreezerItemsFromSqlite,
  upsertFreezerItemToSqlite,
  deleteFreezerItemFromSqlite,
  getSavedRecipesFromSqlite,
  saveRecipeToSqlite,
  deleteSavedRecipeFromSqlite,
  recordSyncRunToSqlite,
  getRecentSyncRunsFromSqlite,
  resetSqliteTestInstance,
} from '@/lib/db/sqlite';
import { FreezerItem } from '@/types/domain';
import { createMockDish } from 'tests/test-utils';

describe('smoke: sqlite-health & schema initialization', () => {
  beforeEach(() => {
    process.env.PANTRYBOT_SQLITE_PATH = ':memory:';
    resetSqliteTestInstance();
  });

  afterAll(() => {
    resetSqliteTestInstance();
  });

  it('initializes schema and populates baseline database stats', () => {
    const stats = getSqliteDatabaseStats();
    expect(stats.totalHistoricalOfferRows).toBeGreaterThan(0);
    expect(stats.totalUsdaSnapshotRows).toBeGreaterThan(0);
    expect(stats.trackedWeeksCount).toBeGreaterThan(0);
    expect(stats.dbPath).toContain(':memory:');
  });

  it('supports freezer items CRUD operations in-memory', () => {
    const testItem: FreezerItem = {
      id: 'test-smoke-chicken-001',
      canonicalIngredientId: 'chicken-thighs-boneless',
      ingredientName: 'Boneless Chicken Thighs',
      category: 'PROTEIN',
      quantityLbOrDoz: 4.5,
      unit: 'lb',
      purchasePricePerUnit: 1.99,
      regularPricePerUnit: 4.49,
      totalCostBasis: 8.96,
      estimatedSavings: 11.25,
      store: 'KING_SOOPERS',
      storeBanner: 'King Soopers',
      purchasedAtIso: new Date().toISOString(),
    };

    upsertFreezerItemToSqlite(testItem);

    const items = getFreezerItemsFromSqlite();
    const found = items.find((f) => f.id === testItem.id);
    expect(found).toBeDefined();
    expect(found?.quantityLbOrDoz).toBe(4.5);

    deleteFreezerItemFromSqlite(testItem.id);
    const afterDelete = getFreezerItemsFromSqlite();
    expect(afterDelete.some((f) => f.id === testItem.id)).toBe(false);
  });

  it('supports saved recipes persistence and deletion in-memory', () => {
    const testDish = createMockDish({
      id: 'smoke-dish-001',
      title: 'Smoke Test Chili',
      style: 'CHILI_SOUP',
      appliance: 'DUTCH_OVEN',
    });

    saveRecipeToSqlite(testDish.id, testDish);
    const recipes = getSavedRecipesFromSqlite() as { id: string }[];
    expect(recipes.some((r) => r.id === testDish.id)).toBe(true);

    deleteSavedRecipeFromSqlite(testDish.id);
    const afterDelete = getSavedRecipesFromSqlite() as { id: string }[];
    expect(afterDelete.some((r) => r.id === testDish.id)).toBe(false);
  });

  it('records and queries sync run audit logs', () => {
    recordSyncRunToSqlite({
      cycle: '2026-10-14-smoke',
      syncedOffersCount: 42,
      flippLive: true,
      krogerLive: false,
      usdaLive: true,
      topDishTitle: 'Smoke Test Braise',
      optimalBasketTotal: 34.5,
    });

    const runs = getRecentSyncRunsFromSqlite(5);
    expect(runs.length).toBeGreaterThan(0);
    expect(runs[0].cycle).toBe('2026-10-14-smoke');
    expect(runs[0].syncedOffersCount).toBe(42);
  });
});
