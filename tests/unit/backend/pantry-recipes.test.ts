import { describe, expect, it } from 'vitest';
import { CANONICAL_INGREDIENTS } from '@/data/canonical-ingredients';
import { MEAL_PREP_BLUEPRINTS } from '@/data/meal-prep-blueprints';
import { RECIPE_STAPLES, selectRecipeStaples } from '@/data/recipe-staples';
import { rankMealPrepDishes } from '@/lib/meal-prep-matcher';
import { availablePantryIngredientIds, pantryCatalog } from '@/lib/pantry/model';
import { applyPantryToRecipe, pantryShoppingNeeds } from '@/lib/pantry/recipe';
import { buildShoppingListAndStoreComparison } from '@/lib/shopping-list';
import { formatShoppingListForClipboard } from '@/lib/cart-exporter';
import { createMockCommodity, createMockDish } from 'tests/test-utils';

const commodities = CANONICAL_INGREDIENTS.map((ingredient) => createMockCommodity({ ingredient }));
const ranked = (ids: string[] = [], servings = 6) => rankMealPrepDishes(commodities, [], ids, servings, { pantryMode: true }).allRankedDishes;
const oilDish = () => createMockDish({ pantryStaples: [], pantryRequirements: [{ ingredientId: 'olive-oil', quantity: 3, unit: 'tbsp' }] });

describe('pantry recipe and shopping integration', () => {
  it('maps every deterministic blueprint to priced kitchen units and scales use amounts', () => {
    expect(Object.keys(RECIPE_STAPLES).sort()).toEqual(MEAL_PREP_BLUEPRINTS.map((dish) => dish.id).sort());
    for (const blueprint of MEAL_PREP_BLUEPRINTS) {
      const requirements = selectRecipeStaples(blueprint.id, [], 6);
      expect(requirements.length).toBeGreaterThan(0);
      for (const requirement of requirements) expect(pantryCatalog.get(requirement.ingredientId)?.staticPrice?.unit).toBe(requirement.unit);
      const scaled = selectRecipeStaples(blueprint.id, [], 8);
      expect(scaled[0].quantity).toBeCloseTo(requirements[0].quantity * 8 / 6, 3);
    }
    expect(ranked().every((dish) => dish.additionalCostEstimateComplete)).toBe(true);
  });
  it('uses boolean availability even for zero quantities or past dates, and does not count custom names', () => {
    const ids = availablePantryIngredientIds([
      { id: 'oil', ingredientId: 'olive-oil', displayName: 'Olive oil', available: true, quantity: 0, useByDate: '2000-01-01', revision: 1, updatedAtIso: '' },
      { id: 'no', ingredientId: 'chicken-broth', displayName: 'Broth', available: false, quantity: 100, revision: 1, updatedAtIso: '' },
      { id: 'custom', displayName: 'Salt', available: true, revision: 1, updatedAtIso: '' },
    ]);
    expect(ids).toEqual(['olive-oil']);
    const before = oilDish();
    const after = applyPantryToRecipe(before, ids, commodities);
    expect(after.pantryCoverage).toMatchObject({ requiredCount: 1, availableRequiredCount: 1 });
    expect(after.totalBatchCost).toBe(0);
    expect(after.totalBatchSavings).toBe(0);
    expect(before.pantryRequirements?.[0].quantity).toBe(3);
    expect(applyPantryToRecipe(before, [], commodities).totalBatchCost).toBe(.6);
  });
  it('uses reviewed alternatives, respects explicit pins and gluten-free constraints', () => {
    const id = 'dutch-oven-beef-chuck-pot-roast-stew';
    const selected = selectRecipeStaples(id, ['all-purpose-flour', 'worcestershire-sauce'], 6, ['GLUTEN_FREE']);
    expect(selected.map((r) => r.ingredientId)).toContain('worcestershire-sauce-gluten-free');
    expect(selected.map((r) => r.ingredientId)).not.toContain('all-purpose-flour');
    expect(selectRecipeStaples(id, ['all-purpose-flour'], 6, [], ['cornstarch']).map((r) => r.ingredientId)).toContain('cornstarch');
    expect(pantryShoppingNeeds([{ ingredientId: 'basmati-rice-dry', quantity: 1, unit: 'cup' }], ['jasmine-rice-dry'])).toHaveLength(1);
    expect(pantryShoppingNeeds([{ ingredientId: 'black-beans-canned', quantity: 15, unit: 'oz' }], ['black-beans-dry'])).toHaveLength(1);
  });
  it('deduplicates required coverage and counts optional ingredients separately', () => {
    const dish = applyPantryToRecipe(createMockDish({ pantryStaples: [], pantryRequirements: [
      { ingredientId: 'olive-oil', quantity: 1, unit: 'tbsp' }, { ingredientId: 'olive-oil', quantity: 1, unit: 'tbsp', optional: true },
      { ingredientId: 'salt', quantity: 1, unit: 'tsp', optional: true },
    ] }), ['olive-oil'], commodities);
    expect(dish.pantryCoverage).toEqual({ requiredCount: 1, availableRequiredCount: 1, optionalCount: 1, availableOptionalCount: 0 });
    expect(dish.totalBatchCost).toBe(0);
  });
  it('reprices saved recipes from current pantry without modifying the saved document or inventing ownership savings', () => {
    const saved = ranked(['chicken-thighs-boneless']).find((dish) => dish.matchedIngredients.some((m) => m.ingredientId === 'chicken-thighs-boneless'))!;
    const snapshot = JSON.stringify(saved);
    const current = applyPantryToRecipe(saved, [], commodities);
    expect(current.matchedIngredients.find((m) => m.ingredientId === 'chicken-thighs-boneless')?.isOnHand).toBe(false);
    expect(current.totalBatchCost).toBeGreaterThan(saved.totalBatchCost);
    expect(JSON.stringify(saved)).toBe(snapshot);
    expect(applyPantryToRecipe(current, current.matchedIngredients.map((m) => m.ingredientId), commodities).totalBatchSavings).toBeLessThanOrEqual(current.totalBatchSavings);
    const old = createMockDish({ id: 'old', pantryStaples: ['My private seasoning'], dietaryTags: [] });
    const savedRank = rankMealPrepDishes(commodities, [], [], 8, { pantryMode: true, savedRecipes: [old] }).allRankedDishes.find((dish) => dish.id === 'old')!;
    const structuredSaved = { ...applyPantryToRecipe(oilDish(), [], commodities), id: 'structured-saved' };
    const scaledSaved = rankMealPrepDishes(commodities, [], [], 8, { pantryMode: true, savedRecipes: [structuredSaved] }).allRankedDishes.find((dish) => dish.id === 'structured-saved')!;
    expect(scaledSaved.pantryRequirements).toHaveLength(1);
    expect(scaledSaved.pantryRequirements![0].quantity).toBe(4);
    expect(scaledSaved.additionalCostEstimateComplete).toBe(true);
    expect(savedRank.additionalCostEstimateComplete).toBe(false);
    expect(savedRank.pantryCoverage?.availableRequiredCount).toBe(0);
    expect(rankMealPrepDishes(commodities, [], [], 6, { pantryMode: true, dietaryConstraints: ['GLUTEN_FREE'], savedRecipes: [old] }).allRankedDishes.some((dish) => dish.id === 'old')).toBe(false);
  });
  it('omits available market/staple needs, aggregates amounts, and exports unpriced uncertainty', () => {
    const dish = ranked().find((d) => d.matchedIngredients.some((m) => m.ingredientId === 'chicken-thighs-boneless'))!;
    const plan = buildShoppingListAndStoreComparison([dish, oilDish(), oilDish()], commodities, ['chicken-thighs-boneless'], '80542', undefined, true);
    expect(plan.items.some((item) => item.ingredientId === 'chicken-thighs-boneless')).toBe(false);
    expect(plan.pantryNeeds.find((need) => need.ingredientId === 'olive-oil')!.quantity).toBeGreaterThanOrEqual(6);
    const unknown = applyPantryToRecipe(createMockDish({ pantryStaples: ['Unmapped spice'] }), [], commodities);
    const uncertain = buildShoppingListAndStoreComparison([unknown], commodities, [], '80542', undefined, true);
    expect(uncertain.tripComparison.additionalCostEstimateComplete).toBe(false);
    expect(uncertain.pantryNeeds[0].estimatedCost).toBeNull();
    const text = formatShoppingListForClipboard({ ...uncertain, items: [], activeTrio: [unknown], zipCode: '80542', cityLabel: 'Test', tripMode: 'SPLIT' });
    expect(text).toContain('Estimated additional grocery cost');
    expect(text).toContain('known subtotal');
    expect(text).toContain('price unavailable');
    expect(text).not.toContain('FREEZER');
    const owned = buildShoppingListAndStoreComparison([oilDish()], commodities, ['olive-oil']);
    expect(owned.pantryNeeds).toEqual([]);
    expect(owned.tripComparison.optimalSplitTotal).toBe(0);
  });
  it('does not hide missing market slots or unsupported units behind a complete estimate', () => {
    expect(rankMealPrepDishes([], [], [], 6, { pantryMode: true }).allRankedDishes.every((dish) => !dish.additionalCostEstimateComplete)).toBe(true);
    const dish = applyPantryToRecipe(createMockDish({ pantryRequirements: [{ ingredientId: 'olive-oil', quantity: 2, unit: 'bottle' }] }), [], commodities);
    expect(dish.additionalCostEstimateComplete).toBe(false);
    expect(dish.totalBatchCost).toBe(0);
  });
});
