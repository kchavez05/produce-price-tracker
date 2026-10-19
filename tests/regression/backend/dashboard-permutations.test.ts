import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { buildDashboardPayload } from '@/lib/scoring-and-matcher';
import { resetSqliteTestInstance } from '@/lib/db/sqlite';

describe('regression: dashboard-permutations', () => {
  beforeEach(() => {
    process.env.PANTRYBOT_SQLITE_PATH = ':memory:';
    resetSqliteTestInstance();
  });

  afterAll(() => {
    resetSqliteTestInstance();
  });

  it('generates valid trio across dietary constraints (GLUTEN_FREE & DAIRY_FREE)', async () => {
    const payload = await buildDashboardPayload({
      zipCode: '80542',
      storeFilter: 'ALL',
      dietaryConstraints: ['GLUTEN_FREE', 'DAIRY_FREE'],
      targetServings: 6,
      macroGoal: 'ANY',
      applianceFilter: 'ANY',
    });

    expect(payload.recommendedTrio.length).toBe(3);
    for (const dish of payload.recommendedTrio) {
      expect(dish.dietaryTags).toContain('GLUTEN_FREE');
      expect(dish.dietaryTags).toContain('DAIRY_FREE');
    }
  });

  it('respects appliance filter when specified (DUTCH_OVEN_BRAISE)', async () => {
    const payload = await buildDashboardPayload({
      zipCode: '80542',
      storeFilter: 'ALL',
      dietaryConstraints: [],
      targetServings: 6,
      macroGoal: 'ANY',
      applianceFilter: 'DUTCH_OVEN_BRAISE',
    });

    expect(payload.recommendedTrio.length).toBe(3);
    // At least one top dish or primary match should be DUTCH_OVEN_BRAISE
    const braiseCount = payload.recommendedTrio.filter(
      (d) => d.vesselArchetype === 'DUTCH_OVEN_BRAISE'
    ).length;
    expect(braiseCount).toBeGreaterThan(0);
  });

  it('incorporates pinned and on-hand ingredients in recommended trio', async () => {
    const pinnedIngredientId = 'chicken-thighs-boneless';
    const onHandIngredientId = 'russet-potatoes';

    const payload = await buildDashboardPayload({
      zipCode: '80542',
      storeFilter: 'ALL',
      pinnedIngredientIds: [pinnedIngredientId],
      onHandIngredientIds: [onHandIngredientId],
      targetServings: 6,
      macroGoal: 'HIGH_PROTEIN',
    });

    expect(payload.recommendedTrio.length).toBe(3);
    const usesPinnedOrOnHand = payload.recommendedTrio.some((dish) =>
      dish.matchedIngredients.some(
        (slot) =>
          slot.ingredientId === pinnedIngredientId ||
          slot.ingredientId === onHandIngredientId
      )
    );
    expect(usesPinnedOrOnHand).toBe(true);
  });

  it('scales servings correctly (4, 6, 8 servings)', async () => {
    for (const servings of [4, 6, 8]) {
      const payload = await buildDashboardPayload({
        zipCode: '80542',
        storeFilter: 'ALL',
        targetServings: servings,
      });

      expect(payload.recommendedTrio.length).toBe(3);
      for (const dish of payload.recommendedTrio) {
        expect(dish.servings).toBe(servings);
        expect(dish.costPerServing).toBeGreaterThan(0);
        expect(
          Math.abs(dish.totalBatchCost - dish.costPerServing * servings)
        ).toBeLessThanOrEqual(0.1);
      }
    }
  });
});
