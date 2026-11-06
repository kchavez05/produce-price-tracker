import staplesCatalog from '../../../catalog/releases/2026-11-06.2/catalog.json';
import vegetableCatalog from '../../../catalog/releases/2026-11-06.1/catalog.json';
import firstExpandedCatalog from '../../../catalog/releases/2026-10-31.1/catalog.json';
import previousCatalog from '../../../catalog/releases/2026-10-30.1/catalog.json';
import baseline from '../../../catalog/baseline-1.5.2.json';
import { searchCookingCatalog } from '@/lib/pantry/catalog-search';
import { describe, expect, it } from 'vitest';
import { CANONICAL_INGREDIENTS } from '@/data/canonical-ingredients';
import { MEAL_PREP_BLUEPRINTS } from '@/data/meal-prep-blueprints';
import { RECIPE_STAPLES, selectRecipeStaples } from '@/data/recipe-staples';
import { rankMealPrepDishes } from '@/lib/meal-prep-matcher';
import { availablePantryIngredientIds, pantryCatalog, cookingCatalogView, canSavePantryIngredient } from '@/lib/pantry/model';
import { evaluatePantryRequirementsByIds } from '@/lib/pantry/requirements';
import { PantryEntry } from '@/types/pantry';
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
  it('applies reviewed lentil coverage once, respects No, and keeps missing prices explicit', () => {
    const red = { id: 'red', ingredientId: 'red-lentils-dried', displayName: 'Dried red lentils', available: true, revision: 1, updatedAtIso: '', quantity: 0, useByDate: '2000-01-01' };
    const general = { ...red, id: 'general', ingredientId: 'lentils-dried', displayName: 'Dried lentils' };
    const requirements = [{ ingredientId: 'lentils-dried', quantity: 1, unit: 'cup' }];
    const dish = createMockDish({ pantryStaples: [], pantryRequirements: requirements });
    const before = JSON.stringify([red, general, dish]);
    const covered = availablePantryIngredientIds([red]);
    expect(applyPantryToRecipe(dish, covered, []).pantryCoverage?.availableRequiredCount).toBe(1);
    expect(pantryShoppingNeeds(requirements, covered)).toEqual([]);
    const denied = availablePantryIngredientIds([red, { ...general, available: false }]);
    const result = applyPantryToRecipe(dish, denied, []);
    expect(result.pantryCoverage?.availableRequiredCount).toBe(0);
    expect(result.additionalCostEstimateComplete).toBe(false);
    expect(pantryShoppingNeeds(requirements, denied)[0]).toMatchObject({ priceBasis: 'UNPRICED', estimatedCost: null });
    expect(availablePantryIngredientIds([general])).not.toContain(red.ingredientId);
    expect(availablePantryIngredientIds([{ ...general, ingredientId: 'lentils-canned' }])).not.toContain('lentils-dried');
    expect(JSON.stringify([red, general, dish])).toBe(before);
  });
  it('rolls back presentation while retaining accepted new identities for edits and recipes', () => {
    const rollback = cookingCatalogView('baseline-1.5.2');
    expect(rollback.ingredients).toEqual(baseline.ingredients);
    expect(rollback.compatibility).toEqual([]);
    expect(searchCookingCatalog(rollback.ingredients, 'lentils').map((r) => r.id)).toEqual(['red-lentils-dried']);
    expect(pantryCatalog.has('lentils-dried')).toBe(true);
    const saved = { id: 'general', ingredientId: 'lentils-dried', displayName: 'Dried lentils', available: false, revision: 1, updatedAtIso: '' };
    expect(canSavePantryIngredient(saved, saved, [])).toBe(true);
    expect(() => cookingCatalogView('unreviewed')).toThrow('Unsupported');
  });
  it('restores the exact previous pantry view without losing expanded IDs or creating flour coverage', () => {
    const rollback = cookingCatalogView('2026-10-30.1');
    expect(rollback.ingredients).toEqual(previousCatalog.ingredients);
    expect(rollback.compatibility).toEqual(previousCatalog.compatibility);
    expect(searchCookingCatalog(rollback.ingredients, 'quinoa')).toEqual([]);
    expect(pantryCatalog.has('quinoa-dry')).toBe(true);
    const saved = { id: 'quinoa', ingredientId: 'quinoa-dry', displayName: 'Dry quinoa', available: false, revision: 1, updatedAtIso: '' };
    expect(canSavePantryIngredient(saved, saved, [])).toBe(true);
    const flour = { ...saved, id: 'flour', ingredientId: 'brown-rice-flour', displayName: 'Brown rice flour', available: true };
    expect(availablePantryIngredientIds([flour])).toEqual(['brown-rice-flour']);
    const requirements = [{ ingredientId: 'rice-flour', quantity: 1, unit: 'tbsp' }];
    expect(pantryShoppingNeeds(requirements, availablePantryIngredientIds([flour]))).toHaveLength(1);
  });
  it('retains the 101-ingredient rollback view while preserving exact new herb ownership', () => {
    const rollback = cookingCatalogView('2026-10-31.1');
    expect(rollback.ingredients).toEqual(firstExpandedCatalog.ingredients);
    expect(rollback.compatibility).toEqual(firstExpandedCatalog.compatibility);
    expect(searchCookingCatalog(rollback.ingredients, 'cilantro')).toEqual([]);
    const herb: PantryEntry = { id: 'herb', ingredientId: 'cilantro-fresh', displayName: 'Fresh cilantro', available: true, revision: 1, updatedAtIso: '' };
    expect(canSavePantryIngredient(herb, herb, [])).toBe(true);
    expect(availablePantryIngredientIds([herb])).toEqual(['cilantro-fresh']);
    const requirements = [{ ingredientId: 'cilantro-fresh', quantity: 1, unit: 'bunch' }];
    expect(pantryShoppingNeeds(requirements, availablePantryIngredientIds([herb]))).toEqual([]);
    expect(pantryShoppingNeeds(requirements, [])).toMatchObject([{ priceBasis: 'UNPRICED', estimatedCost: null }]);
    expect(pantryShoppingNeeds(requirements, availablePantryIngredientIds([{ ...herb, available: false }]))).toHaveLength(1);
  });
  it('retains the 111-identity view and keeps milk/yogurt and ground/fresh ginger ownership distinct', () => {
    const rollback = cookingCatalogView('2026-11-06.1');
    expect(rollback.ingredients).toEqual(vegetableCatalog.ingredients);
    expect(rollback.compatibility).toEqual(vegetableCatalog.compatibility);
    expect(searchCookingCatalog(rollback.ingredients, 'plain yogurt')).toEqual([]);
    const milk: PantryEntry = { id: 'milk', ingredientId: 'milk-whole', displayName: 'Whole milk (3.25%)', available: true, quantity: 0, revision: 1, updatedAtIso: '' };
    const yogurt: PantryEntry = { ...milk, id: 'yogurt', ingredientId: 'yogurt-plain-whole-milk', displayName: 'Plain whole-milk yogurt' };
    expect(canSavePantryIngredient(yogurt, yogurt, [])).toBe(true);
    const requirements = [{ ingredientId: milk.ingredientId!, quantity: 1, unit: 'cup' }, { ingredientId: yogurt.ingredientId!, quantity: 1, unit: 'cup' }];
    const dish = createMockDish({ pantryStaples: [], pantryRequirements: requirements });
    const before = JSON.stringify([milk, yogurt, dish]);
    const partial = applyPantryToRecipe(dish, availablePantryIngredientIds([milk]), []);
    expect(partial.pantryCoverage).toMatchObject({ requiredCount: 2, availableRequiredCount: 1 });
    expect(partial.additionalCostEstimateComplete).toBe(false);
    expect(pantryShoppingNeeds(requirements, availablePantryIngredientIds([milk]))).toMatchObject([{ ingredientId: yogurt.ingredientId, priceBasis: 'UNPRICED', estimatedCost: null }]);
    const complete = applyPantryToRecipe(dish, availablePantryIngredientIds([milk, yogurt]), []);
    expect(complete.pantryCoverage?.availableRequiredCount).toBe(2);
    expect(complete.totalBatchCost).toBe(0);
    expect(pantryShoppingNeeds(requirements, availablePantryIngredientIds([milk, yogurt]))).toEqual([]);
    expect(availablePantryIngredientIds([{ ...milk, ingredientId: 'ginger-ground' }])).toEqual(['ginger-ground']);
    expect(JSON.stringify([milk, yogurt, dish])).toBe(before);
  });
  it('shares spice provenance without sharing whole/ground availability and retains the 134-identity view', () => {
    expect(cookingCatalogView('2026-11-06.2').ingredients).toEqual(staplesCatalog.ingredients);
    const whole: PantryEntry = { id: 'whole', ingredientId: 'coriander-seeds-whole', displayName: 'Whole coriander seeds', available: true, revision: 1, updatedAtIso: '' };
    const ground: PantryEntry = { ...whole, id: 'ground', ingredientId: 'coriander-ground', displayName: 'Ground coriander' };
    const requirements = [{ ingredientId: whole.ingredientId!, quantity: 1, unit: 'tsp' }, { ingredientId: ground.ingredientId!, quantity: 1, unit: 'tsp' }];
    expect(availablePantryIngredientIds([whole])).toEqual([whole.ingredientId]);
    expect(pantryShoppingNeeds(requirements, availablePantryIngredientIds([whole]))).toMatchObject([{ ingredientId: ground.ingredientId, priceBasis: 'UNPRICED' }]);
    expect(pantryShoppingNeeds(requirements, availablePantryIngredientIds([whole, ground]))).toEqual([]);
    expect(availablePantryIngredientIds([{ ...whole, ingredientId: 'cardamom-pods' }])).toEqual(['cardamom-pods']);
    expect(availablePantryIngredientIds([whole])).not.toContain('cilantro-fresh');
  });
  it('covers market onion cards, zeroes costs, and omits shopping needs using fresh pantry onions', () => {
    const commodity = commodities.find((r) => r.ingredient.id === 'yellow-white-onions')!;
    const slot = { slotLabel: 'Cooking onions', ingredientId: commodity.ingredient.id, ingredientName: commodity.ingredient.name, quantityUsed: 2, unit: commodity.ingredient.standardUnit,
      store: commodity.bestOffer.store, rawDealText: commodity.bestOffer.rawPriceText, dealType: commodity.bestOffer.dealType,
      unitCost: commodity.bestOffer.normalizedPricePerUnit, slotCost: 4, regularSlotCost: 6, isUserPinned: false, isOnHand: false, fromVirtualFreezer: false };
    const dish = createMockDish({ pantryStaples: [], pantryRequirements: [], matchedIngredients: [slot] });
    const onion: PantryEntry = { id: 'onions', ingredientId: 'onions-fresh', displayName: 'Onions', available: true, quantity: 0, useByDate: '2000-01-01', revision: 1, updatedAtIso: '' };
    const before = JSON.stringify([onion, dish]);
    const ids = availablePantryIngredientIds([onion]);
    expect(ids).toEqual(['onions-fresh']);
    const covered = applyPantryToRecipe(dish, ids, commodities);
    expect(covered.matchedIngredients[0]).toMatchObject({ isOnHand: true, slotCost: 0, regularSlotCost: 0, quantityUsed: 2 });
    expect(covered.pantryCoverage).toMatchObject({ requiredCount: 1, availableRequiredCount: 1 });
    expect(covered.totalBatchCost).toBe(0);
    const structured = applyPantryToRecipe(createMockDish({ pantryStaples: [], pantryRequirements: [{ ingredientId: 'yellow-white-onions', quantity: 2, unit: 'lb' }] }), ids, commodities);
    expect(structured.pantryRequirements?.[0].ingredientId).toBe('onions-fresh');
    expect(structured.pantryCoverage).toMatchObject({ requiredCount: 1, availableRequiredCount: 1 });
    expect(buildShoppingListAndStoreComparison([covered], commodities, ids, '80542', undefined, true).items).toEqual([]);
    for (const entries of [[{ ...onion, available: false }], [{ ...onion, deletedAtIso: '2026-10-30' }], [{ ...onion, ingredientId: undefined }], [{ ...onion, ingredientId: 'onion-powder' }]]) {
      const missingIds = availablePantryIngredientIds(entries);
      const missing = applyPantryToRecipe(covered, missingIds, commodities);
      expect(missing.matchedIngredients[0].isOnHand).toBe(false);
      expect(missing.totalBatchCost).toBeCloseTo(commodity.bestOffer.normalizedPricePerUnit * 2);
      expect(missing.pantryCoverage).toMatchObject({ requiredCount: 1, availableRequiredCount: 0 });
      expect(buildShoppingListAndStoreComparison([missing], commodities, missingIds, '80542', undefined, true).items[0].ingredientId).toBe('yellow-white-onions');
    }
    // Market IDs alone and a matching custom display name never imply ownership.
    expect(applyPantryToRecipe(dish, ['yellow-white-onions'], commodities).matchedIngredients[0].isOnHand).toBe(false);
    expect(JSON.stringify([onion, dish])).toBe(before);
  });
  it.each([
    { fresh: false, powder: false, count: 0 },
    { fresh: true, powder: false, count: 1 },
    { fresh: false, powder: true, count: 1 },
    { fresh: true, powder: true, count: 2 },
  ])('keeps fresh onion main ingredients separate from onion powder staples: $fresh/$powder', ({ fresh, powder, count }) => {
    const commodity = commodities.find((r) => r.ingredient.id === 'yellow-white-onions')!;
    const dish = createMockDish({ pantryStaples: [], pantryRequirements: [{ ingredientId: 'onion-powder', quantity: 2, unit: 'tsp' }], matchedIngredients: [{
      slotLabel: 'Fresh onions', ingredientId: commodity.ingredient.id, ingredientName: commodity.ingredient.name, quantityUsed: 2, unit: 'lb',
      store: commodity.bestOffer.store, rawDealText: commodity.bestOffer.rawPriceText, dealType: commodity.bestOffer.dealType,
      unitCost: commodity.bestOffer.normalizedPricePerUnit, slotCost: 4, regularSlotCost: 6, isUserPinned: false, isOnHand: false, fromVirtualFreezer: false,
    }] });
    // Explicit Yes/No is independent of zero quantity and past dates.
    const entries: PantryEntry[] = [
      { id: 'fresh', ingredientId: 'onions-fresh', displayName: 'Onions', available: fresh, quantity: 0, useByDate: '2000-01-01', revision: 1, updatedAtIso: '' },
      { id: 'powder', ingredientId: 'onion-powder', displayName: 'Onion powder', available: powder, revision: 1, updatedAtIso: '' },
    ];
    const original = JSON.stringify([dish, entries]);
    const available = availablePantryIngredientIds(entries);
    // Reprice a previously covered saved view, rather than trusting its old flags.
    const previouslyCovered = applyPantryToRecipe(dish, ['onions-fresh', 'onion-powder'], commodities);
    const current = applyPantryToRecipe(previouslyCovered, available, commodities);
    const freshCost = fresh ? 0 : Number((2 * commodity.bestOffer.normalizedPricePerUnit).toFixed(2));
    const powderCost = powder ? 0 : 0.12;
    expect(current.matchedIngredients[0]).toMatchObject({ isOnHand: fresh, slotCost: freshCost });
    expect(current.estimatedPantryCost).toBe(powderCost);
    expect(current.totalBatchCost).toBeCloseTo(freshCost + powderCost);
    expect(current.pantryCoverage).toMatchObject({ requiredCount: 2, availableRequiredCount: count });
    const plan = buildShoppingListAndStoreComparison([current], commodities, available, '80542', undefined, true);
    expect(plan.items.some((r) => r.ingredientId === 'yellow-white-onions')).toBe(!fresh);
    expect(plan.pantryNeeds.some((r) => r.ingredientId === 'onion-powder')).toBe(!powder);
    expect(JSON.stringify([dish, entries])).toBe(original);
  });
  it('normalizes reviewed recipe requirements for distinct coverage without inferring unrelated grouped deals', () => {
    const result = evaluatePantryRequirementsByIds([
      { ingredientId: 'yellow-white-onions', quantity: 1, unit: 'lb' }, { ingredientId: 'onions-fresh', quantity: 1, unit: 'lb' },
      { ingredientId: 'yellow-white-onions', quantity: 1, unit: 'lb', optional: true },
    ], ['onions-fresh']);
    expect(result).toMatchObject({ requiredCount: 1, availableRequiredCount: 1, optionalCount: 0, needToBuy: [] });
    const rankedOnions = rankMealPrepDishes(commodities, ['yellow-white-onions'], ['onions-fresh'], 6, { pantryMode: true }).allRankedDishes;
    const cards = rankedOnions.flatMap((dish) => dish.matchedIngredients).filter((r) => r.ingredientId === 'yellow-white-onions');
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.every((r) => r.isOnHand && r.slotCost === 0)).toBe(true);
    expect(evaluatePantryRequirementsByIds([{ ingredientId: 'russet-yukon-potatoes', quantity: 1, unit: 'lb' }], ['onions-fresh']).availableRequiredCount).toBe(0);
    for (const id of ['chicken-thighs-boneless', 'bell-peppers', 'celery-stalks']) {
      const dishes = rankMealPrepDishes(commodities, [id], [id], 6, { pantryMode: true }).allRankedDishes;
      const exactCards = dishes.flatMap((dish) => dish.matchedIngredients).filter((r) => r.ingredientId === id);
      expect(exactCards.length).toBeGreaterThan(0);
      expect(exactCards.every((r) => r.isOnHand && r.slotCost === 0)).toBe(true);
    }
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
