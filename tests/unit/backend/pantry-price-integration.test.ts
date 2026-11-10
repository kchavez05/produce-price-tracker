import { describe, expect, it } from 'vitest';
import { CANONICAL_INGREDIENTS } from '@/data/canonical-ingredients';
import { CANNED_NET_CONTENTS_VERSION, selectRecipeStaples } from '@/data/recipe-staples';
import { createPantryPriceContext, PantryPriceContext, pantryPriceLabel } from '@/lib/pantry/pricing';
import { StaplePriceAdmission, StaplePriceQuote } from '@/lib/pantry/price-evaluator';
import { applyPantryToRecipe, aggregatePantryPriceDetails } from '@/lib/pantry/recipe';
import { withoutDerivedPantryPricing } from '@/lib/pantry/saved-pricing';
import { rankMealPrepDishes } from '@/lib/meal-prep-matcher';
import { buildShoppingListAndStoreComparison } from '@/lib/shopping-list';
import { formatShoppingListForClipboard } from '@/lib/cart-exporter';
import { availablePantryIngredientIds } from '@/lib/pantry/model';
import { createMockCommodity, createMockDish } from 'tests/test-utils';

// Entirely synthetic evidence; no real source admission or provider permissions.
const admission: StaplePriceAdmission = { ingredientId: 'olive-oil', productId: 'SYNTH_PRODUCT', itemId: 'SYNTH_ITEM',
  productRevision: 'package-v1', ruleVersion: 'rule-v1', sourceSizeLabel: '16 fl oz', packageAmount: '16', packageUnit: 'fl oz' };
const quote: StaplePriceQuote = { id: 'SYNTH_QUOTE', source: 'KROGER_PRODUCTION', productId: admission.productId,
  itemId: admission.itemId, productRevision: admission.productRevision, sourceSizeLabel: admission.sourceSizeLabel,
  marketId: 'SYNTH_MARKET', locationId: 'SYNTH_STORE', observedAtIso: '2026-11-09T18:00:00Z',
  expiresAtIso: '2026-11-09T21:00:00Z', priceKind: 'REGULAR', packagePriceCents: 480, currency: 'USD',
  conditions: 'UNCONDITIONAL', sourceContractVersion: 'SYNTH_CONTRACT', inStore: true };
const context = (overrides: Partial<PantryPriceContext> = {}) => createPantryPriceContext({
  nowIso: '2026-11-09T20:00:00Z', marketId: 'SYNTH_MARKET', selectedLocationIds: ['SYNTH_STORE'],
  observedPricingEnabled: true, sourceContract: { version: 'SYNTH_CONTRACT', unconditionalUsdVerified: true, useAndRetentionVerified: true },
  admissions: [admission], quotes: [quote], ...overrides,
});
const oilDish = (quantity = 2) => createMockDish({ id: 'saved-synthetic-oil', matchedIngredients: [], pantryStaples: [],
  pantryRequirements: [{ ingredientId: 'olive-oil', quantity, unit: 'tbsp' }] });
const commodities = CANONICAL_INGREDIENTS.map((ingredient) => createMockCommodity({ ingredient }));
const shopping = (dishes: ReturnType<typeof oilDish>[], snapshot = context(), ids: string[] = []) =>
  buildShoppingListAndStoreComparison(dishes, [], ids, '80542', ['KING_SOOPERS'], true, snapshot);

describe('shared current / saved / shopping price context', () => {
  it('uses the same observation, allocated rows and labels across all current recipe paths', () => {
    const snapshot = context();
    const ranked = rankMealPrepDishes(commodities, [], [], 6, { pantryMode: true, pantryPriceContext: snapshot });
    const dishes = ranked.allRankedDishes.filter((dish) => dish.pantryRequirements?.some((r) => r.ingredientId === 'olive-oil'));
    expect(dishes.length).toBeGreaterThan(1);
    for (const dish of dishes) {
      const rows = dish.pantryPricing!.rows;
      expect(rows.find((r) => r.ingredientId === 'olive-oil')).toMatchObject({ priceBasis: 'OBSERVED', observation: {
        quoteId: quote.id, packagePrice: 4.8, locationId: 'SYNTH_STORE', stockUnconfirmed: true,
      } });
      expect(Math.round(dish.estimatedPantryCost * 100)).toBe(rows.reduce((sum, r) => sum + Math.round((r.estimatedCost ?? 0) * 100), 0));
      const plan = buildShoppingListAndStoreComparison([dish], commodities, [], '80542', ['KING_SOOPERS'], true, snapshot);
      expect(plan.tripComparison.estimatedPantryTotal).toBe(dish.estimatedPantryCost);
      expect(plan.pantryChecklist.join(' ')).toContain('Observed recipe-use estimate');
      expect(plan.pantryChecklist.join(' ')).toContain('Stock unconfirmed');
      expect(plan.pantryChecklist.join(' ')).toContain('$4.80 / 16 fl oz');
    }
  });

  it.each([1 / 3, 0.1 + 0.2, 1e-7, Number.MIN_VALUE])('prices ordinary numeric quantities without dropping fractional precision: %s', (quantity) => {
    const dish = oilDish(quantity);
    const current = applyPantryToRecipe(dish, [], []);
    expect(current.additionalCostEstimateComplete).toBe(true);
    expect(current.pantryPricing!.rows[0]).toMatchObject({ priceBasis: 'STATIC_ESTIMATE', allocatedCents: Math.round(quantity * .2 * 100) });
    expect(shopping([dish], context({ observedPricingEnabled: false })).tripComparison.estimatedPantryTotal).toBe(current.estimatedPantryCost);
    const observed = applyPantryToRecipe(dish, [], [], undefined, context());
    expect(observed.pantryPricing!.rows[0].priceBasis).toBe('OBSERVED');
    expect(observed.pantryPricing!.rows[0].allocatedCents).toBe(Math.round(quantity * .15 * 100));
    expect(observed.pantryPricing!.rows[0].quantity).toBe(quantity);
  });

  it('keeps same-size canned basis groups distinct in dashboard and clipboard checklists', () => {
    const requirement = { ingredientId: 'black-beans-canned', quantity: 30, unit: 'oz' };
    const dishes = [createMockDish({ id: 'current-beans', matchedIngredients: [], pantryStaples: [], pantryRequirements: [{ ...requirement, quantityBasisVersion: CANNED_NET_CONTENTS_VERSION }] }),
      createMockDish({ id: 'old-beans', matchedIngredients: [], pantryStaples: [], pantryRequirements: [requirement] })];
    const plan = shopping(dishes, context({ observedPricingEnabled: false }));
    expect(plan.tripComparison.estimatedPantryTotal).toBe(3.6);
    expect(plan.pantryChecklist).toHaveLength(2);
    expect(plan.pantryChecklist[0]).toContain('Unopened can contents');
    expect(plan.pantryChecklist[1]).toContain('Quantity basis not recorded');
    expect(plan.pantryChecklist.every((line) => line.includes('(30 oz)') && line.includes('$1.80 Static estimate'))).toBe(true);
    const text = formatShoppingListForClipboard({ ...plan, items: [], activeTrio: dishes, zipCode: '80542', cityLabel: 'Synthetic', tripMode: 'SPLIT' });
    expect(text).toContain('Unopened can contents');
    expect(text).toContain('Quantity basis not recorded');
    expect(text).toContain('$3.60');
  });

  it('reselects pinned alternatives and dietary-safe requirements before pricing', () => {
    const ranked = (pins: string[], dietaryConstraints: ('GLUTEN_FREE')[] = []) => rankMealPrepDishes(commodities, pins, [], 6,
      { pantryMode: true, dietaryConstraints, pantryPriceContext: context() }).allRankedDishes;
    const id = 'sheet-pan-fajita-chicken-thighs-peppers-sweet-potato';
    const ordinary = ranked([]).find((dish) => dish.id === id)!;
    const pinned = ranked(['avocado-oil']).find((dish) => dish.id === id)!;
    expect(ordinary.pantryPricing!.rows.some((row) => row.ingredientId === 'olive-oil' && row.priceBasis === 'OBSERVED')).toBe(true);
    expect(pinned.pantryPricing!.rows.some((row) => row.ingredientId === 'olive-oil')).toBe(false);
    expect(pinned.pantryPricing!.rows.some((row) => row.ingredientId === 'avocado-oil' && row.priceBasis === 'STATIC_ESTIMATE')).toBe(true);
    expect(ranked([], ['GLUTEN_FREE']).flatMap((dish) => dish.pantryPricing!.rows).some((row) => row.ingredientId === 'worcestershire-sauce')).toBe(false);
  });

  it('sums recipe allocations rather than rounding the aggregated shopping quantity again', () => {
    const snapshot = context({ quotes: [{ ...quote, packagePriceCents: 16 }] });
    const input = [oilDish(1), { ...oilDish(1), id: 'second' }]; // 0.5 cents each -> one cent per recipe
    const recipes = input.map((dish) => applyPantryToRecipe(dish, [], [], undefined, snapshot));
    expect(recipes.map((dish) => dish.estimatedPantryCost)).toEqual([.01, .01]);
    const plan = shopping(recipes, snapshot);
    expect(plan.tripComparison.estimatedPantryTotal).toBe(.02);
    expect(plan.pantryNeeds[0]).toMatchObject({ quantity: 2, estimatedCost: .02 });
    expect(plan.pantryNeeds[0].priceDetails?.map((row) => row.estimatedCost)).toEqual([.01, .01]);
  });

  it('reevaluates saved recipes at the new serving size and ignores stale saved prices', () => {
    const saved = applyPantryToRecipe(oilDish(), [], [], undefined, context());
    const frozen = JSON.stringify(saved);
    saved.estimatedPantryCost = 999; saved.totalBatchCost = 999;
    saved.pantryPricing!.rows[0].estimatedCost = 999;
    const before = JSON.stringify(saved);
    const ranked = rankMealPrepDishes([], [], [], 8, { pantryMode: true, savedRecipes: [saved], pantryPriceContext: context() });
    const current = ranked.allRankedDishes.find((dish) => dish.id === saved.id)!;
    expect(current.servings).toBe(8);
    expect(current.pantryRequirements![0].quantity).toBe(2.6667);
    expect(current.estimatedPantryCost).toBe(.4);
    expect(shopping([current]).tripComparison.estimatedPantryTotal).toBe(.4);
    expect(JSON.stringify(saved)).toBe(before);
    expect(frozen).not.toBe(before);
  });

  it.each<Partial<PantryPriceContext>>([
    { observedPricingEnabled: false }, { sourceContract: undefined }, { marketId: 'OTHER' },
    { selectedLocationIds: ['OTHER'] }, { nowIso: '2026-11-09T21:00:00Z' },
    { nowIso: '2026-11-10T07:00:00Z' },
    { admissions: [{ ...admission, productRevision: 'new-revision' }] },
  ])('reevaluates previously observed dishes after context changes: %j', (change) => {
    const old = applyPantryToRecipe(oilDish(), [], [], undefined, context());
    const next = context(change);
    const current = applyPantryToRecipe(old, [], [], undefined, next);
    expect(current.estimatedPantryCost).toBe(.4);
    expect(current.pantryPricing!.rows[0].priceBasis).toBe('STATIC_ESTIMATE');
    expect(current.pantryPricing!.rows[0].observation).toBeUndefined();
    const plan = shopping([old], next);
    expect(plan.tripComparison.estimatedPantryTotal).toBe(.4);
    expect(plan.pantryChecklist.join(' ')).not.toContain('Observed');
    expect(plan.tripComparison.includesStaticPantryEstimates).toBe(true);
  });

  it('rejects source prices when King Soopers leaves the shopping store pool', () => {
    const plan = buildShoppingListAndStoreComparison([oilDish()], [], [], '80542', ['SAFEWAY'], true, context());
    expect(plan.pantryNeeds[0].priceBasis).toBe('STATIC_ESTIMATE');
  });

  it('honors explicit No and Yes without changing optional quantities or inventory', () => {
    const entry = { id: 'oil', ingredientId: 'olive-oil', displayName: 'Olive oil', available: true, quantity: 0,
      revision: 1, updatedAtIso: '', useByDate: '2000-01-01' };
    const before = JSON.stringify(entry);
    const ids = availablePantryIngredientIds([entry]);
    expect(shopping([oilDish()], context(), ids).pantryNeeds).toEqual([]);
    expect(applyPantryToRecipe(oilDish(), ids, [], undefined, context()).pantryPricing!.rows[0].priceBasis).toBe('ON_HAND');
    expect(shopping([oilDish()], context(), availablePantryIngredientIds([{ ...entry, available: false }])).tripComparison.estimatedPantryTotal).toBe(.3);
    expect(JSON.stringify(entry)).toBe(before);
  });

  it('retains a known subtotal when an unknown-basis quantity shares the same ingredient', () => {
    const beanAdmission = { ...admission, ingredientId: 'black-beans-canned', sourceSizeLabel: '15 oz', packageAmount: '15', packageUnit: 'oz', quantityBasisVersion: CANNED_NET_CONTENTS_VERSION };
    const snapshot = context({ admissions: [beanAdmission], quotes: [{ ...quote, sourceSizeLabel: '15 oz' }] });
    const dish = createMockDish({ matchedIngredients: [], pantryStaples: [], pantryRequirements: [
      { ingredientId: 'black-beans-canned', quantity: 15, unit: 'oz', quantityBasisVersion: CANNED_NET_CONTENTS_VERSION },
      { ingredientId: 'black-beans-canned', quantity: 15, unit: 'unknown' },
    ] });
    const plan = shopping([dish], snapshot);
    expect(plan.tripComparison.estimatedPantryTotal).toBe(4.8);
    expect(plan.tripComparison.additionalCostEstimateComplete).toBe(false);
    expect(plan.pantryNeeds.map((need) => need.estimatedCost)).toEqual([4.8, null]);
  });

  it('never backfills canned basis on older saved requirements', () => {
    const requirement = selectRecipeStaples('southwest-sweet-potato-ground-beef-chili-bake', [], 6).find((r) => r.ingredientId === 'black-beans-canned')!;
    expect(requirement.quantityBasisVersion).toBe(CANNED_NET_CONTENTS_VERSION);
    const a = { ...admission, ingredientId: requirement.ingredientId, sourceSizeLabel: '15 oz', packageAmount: '15', packageUnit: 'oz', quantityBasisVersion: CANNED_NET_CONTENTS_VERSION };
    const snapshot = context({ admissions: [a], quotes: [{ ...quote, sourceSizeLabel: a.sourceSizeLabel }] });
    const old = { ...requirement }; delete old.quantityBasisVersion;
    const dish = createMockDish({ matchedIngredients: [], pantryStaples: [], pantryRequirements: [old] });
    expect(applyPantryToRecipe(dish, [], [], undefined, snapshot).pantryPricing!.rows[0].priceBasis).toBe('STATIC_ESTIMATE');
    expect(applyPantryToRecipe(dish, [], [], [requirement], snapshot).pantryPricing!.rows[0].priceBasis).toBe('OBSERVED');
  });

  it('preserves mixed basis labels and excludes optional quantities from additional need', () => {
    const observed = applyPantryToRecipe(oilDish(1), [], [], undefined, context()).pantryPricing!.rows;
    const staticRows = applyPantryToRecipe(oilDish(1), [], []).pantryPricing!.rows;
    expect(aggregatePantryPriceDetails([...observed, ...staticRows])[0]).toMatchObject({ priceBasis: 'MIXED', estimatedCost: .35 });
    const optional = { ...observed[0], priceBasis: 'OPTIONAL' as const, optional: true, estimatedCost: 0 };
    expect(aggregatePantryPriceDetails([optional])).toEqual([]);
    expect(pantryPriceLabel(staticRows[0])).toBe('Static estimate');
  });

  it('copies and freezes context evidence, strips derived pricing without changing saved requirements', () => {
    const input = { ...quote }; const snapshot = context({ quotes: [input] });
    input.packagePriceCents = 999;
    expect(snapshot.quotes[0].packagePriceCents).toBe(480);
    expect(Object.isFrozen(snapshot.quotes[0])).toBe(true);
    const priced = applyPantryToRecipe(oilDish(), [], [], undefined, snapshot);
    const saved = withoutDerivedPantryPricing(priced);
    expect(saved.pantryPricing).toBeUndefined();
    expect(saved.pantryRequirements).toEqual(priced.pantryRequirements);
    expect(priced.pantryPricing).toBeDefined();
    const defaults = applyPantryToRecipe(priced, [], []);
    expect(defaults.pantryPricing!.rows[0].priceBasis).toBe('STATIC_ESTIMATE');
  });
});
