import { describe, expect, it } from 'vitest';
import cases from '../../../catalog/proposals/2026-11-06-vegetable-recipe-mappings/behavior-cases.json';
import approval from '../../../catalog/scoped-recipe-uses.json';
import artifact from '../../../catalog/releases/2026-11-07.4/catalog.json';
import coverageApproval from '../../../catalog/market-coverage-approvals.json';
import previous from '../../../catalog/releases/2026-11-06.3/catalog.json';
import proposal from '../../../catalog/proposals/2026-11-06-vegetable-recipe-mappings/recipe-use-proposal.json';
import { compileScopedRecipeUses } from '../../../scripts/lib/scoped-recipe-uses';
import { parseArtifact, sha256 } from '../../../scripts/lib/catalog-curation';
import { MEAL_PREP_BLUEPRINTS } from '@/data/meal-prep-blueprints';
import { CANONICAL_INGREDIENTS } from '@/data/canonical-ingredients';
import { ALL_WEEKLY_BASELINE_OFFERS } from '@/data/mead-baseline-offers';
import { ScopedRecipeUse } from '@/types/catalog';
import { MatchedSlotIngredient, RecommendedDish, StoreChain } from '@/types/domain';
import { PantryEntry } from '@/types/pantry';
import { availablePantryIngredientIds, canSavePantryIngredient, cookingCatalogView, validatePantryEntry } from '@/lib/pantry/model';
import { recipeAvailableIngredientIds, recipeUseRequirementId, scopedRecipeUses } from '@/lib/pantry/recipe-identity';
import { matchedRecipeRequirement, recipeOfferAllowed } from '@/lib/pantry/recipe-use';
import { applyPantryToRecipe } from '@/lib/pantry/recipe';
import { rankMealPrepDishes } from '@/lib/meal-prep-matcher';
import { scoreAllCommodities } from '@/lib/scoring-and-matcher';
import { buildShoppingListAndStoreComparison } from '@/lib/shopping-list';
import { buildStoreSearchUrl, getItemCurbsideLinks } from '@/lib/cart-exporter';
import { createMockCommodity, createMockDish, createMockOffer } from 'tests/test-utils';

const useFor = (policy: string) => scopedRecipeUses.find((use) => use.id === proposal.decisions.find((row) => row.policyId === policy)!.id)!;
function slot(use: ScopedRecipeUse, quantityUsed = 2): MatchedSlotIngredient {
  return { slotLabel: use.slotLabel, ingredientId: use.marketIngredientId, ingredientName: use.marketIngredientName,
    quantityUsed, unit: 'lb', store: 'KING_SOOPERS', rawDealText: 'old price', dealType: 'SHELF_OR_MEMBER',
    unitCost: 99, slotCost: 198, regularSlotCost: 198, isUserPinned: false };
}
function dish(use: ScopedRecipeUse): RecommendedDish {
  const blueprint = MEAL_PREP_BLUEPRINTS.find((b) => b.id === use.recipeId)!;
  return createMockDish({ id: blueprint.id, title: blueprint.title, steps: [...blueprint.steps],
    matchedIngredients: [slot(use)], pantryRequirements: [], pantryStaples: [], estimatedPantryCost: 0 });
}
function market(use: ScopedRecipeUse, titles: [string, number, StoreChain][]) {
  const offers = titles.map(([rawTitle, price, store]) => createMockOffer({ canonicalIngredientId: use.marketIngredientId,
    rawTitle, store, normalizedPricePerUnit: price, regularPricePerUnit: price + 1, source: 'FLIPP_LIVE' }));
  return createMockCommodity({ ingredient: CANONICAL_INGREDIENTS.find((r) => r.id === use.marketIngredientId)!,
    bestOffer: offers[0], storeOffers: Object.fromEntries(offers.map((offer) => [offer.store, offer])),
    recipeOffers: offers, recipeStorePool: [...new Set(offers.map((offer) => offer.store))] });
}

describe('approved vegetable recipe-use integration', () => {
  it.each(cases.cases)('$policyId: pantry $positivePantryIds and offer "$rawTitle"', (example) => {
    const use = useFor(example.policyId);
    expect(recipeOfferAllowed(use, example.rawTitle)).toBe(example.priceAdmissible);
    const input = dish(use), commodity = market(use, [[example.rawTitle, 2, 'KING_SOOPERS']]);
    const before = JSON.stringify({ input, commodity, ids: example.positivePantryIds });
    const result = applyPantryToRecipe(input, example.positivePantryIds, [commodity]);
    expect(result.pantryCoverage).toMatchObject({ requiredCount: 1, availableRequiredCount: example.covered ? 1 : 0 });
    expect(result.totalBatchCost).toBe(example.covered || !example.priceAdmissible ? 0 : 4);
    expect(result.additionalCostEstimateComplete).toBe(example.covered || example.priceAdmissible);
    const shopping = buildShoppingListAndStoreComparison([result], [commodity], example.positivePantryIds, '80542', ['KING_SOOPERS']);
    expect(shopping.items.length).toBe(!example.covered && example.priceAdmissible ? 1 : 0);
    expect(shopping.pantryNeeds.length).toBe(!example.covered && !example.priceAdmissible ? 1 : 0);
    expect(shopping.tripComparison.additionalCostEstimateComplete).toBe(example.covered || example.priceAdmissible);
    expect(JSON.stringify({ input, commodity, ids: example.positivePantryIds })).toBe(before);
  });

  it('counts either choice once, respects exact No, and never saves a synthetic requirement as inventory', () => {
    const use = useFor('crucifers');
    const entries: PantryEntry[] = ['broccoli-fresh', 'cauliflower-fresh'].map((ingredientId) => ({ id: ingredientId, ingredientId,
      displayName: ingredientId, available: true, quantity: 0, useByDate: '2000-01-01', revision: 1, updatedAtIso: '' }));
    for (const available of [availablePantryIngredientIds(entries), availablePantryIngredientIds([entries[0], { ...entries[1], available: false }])]) {
      const result = applyPantryToRecipe(dish(use), available, []);
      expect(result.pantryCoverage).toMatchObject({ requiredCount: 1, availableRequiredCount: 1 });
      expect(result.additionalCostEstimateComplete).toBe(true);
      expect(buildShoppingListAndStoreComparison([result], [], available, '80542', undefined).pantryNeeds).toEqual([]);
    }
    expect(applyPantryToRecipe(dish(useFor('cauliflower')), ['broccoli-fresh'], []).pantryCoverage?.availableRequiredCount).toBe(0);
    const synthetic = recipeUseRequirementId(use);
    expect(recipeAvailableIngredientIds([synthetic, 'broccoli-cauliflower'])).not.toContain(synthetic);
    expect(applyPantryToRecipe(dish(use), [synthetic], []).pantryCoverage?.availableRequiredCount).toBe(0);
    expect(validatePantryEntry({ ingredientId: synthetic, displayName: 'Broccoli', available: true }).ok).toBe(false);
  });

  it('uses a different qualifying store offer after rejecting the cheapest sibling, without making missing-store prices verified', () => {
    const use = useFor('spinach'), input = dish(use);
    const commodity = market(use, [['Fresh kale', 1, 'KING_SOOPERS'], ['Fresh baby spinach', 3, 'SAFEWAY']]);
    commodity.kingSoopersOffer = commodity.bestOffer;
    const result = applyPantryToRecipe(input, [], [commodity]);
    expect(result.matchedIngredients[0]).toMatchObject({ store: 'SAFEWAY', unitCost: 3, slotCost: 6, ingredientName: 'Fresh spinach' });
    const shopping = buildShoppingListAndStoreComparison([result], [commodity], [], '80542', ['KING_SOOPERS', 'SAFEWAY']);
    expect(shopping.items[0]).toMatchObject({ optimalStore: 'SAFEWAY', optimalTotalCost: 6 });
    expect(shopping.items[0].storePricing?.KING_SOOPERS?.rawDealText).toContain('Price unavailable');
    expect(shopping.tripComparison.singleStoreRankings?.find((r) => r.store === 'KING_SOOPERS')?.verifiedItemCount).toBe(0);
    expect(shopping.tripComparison.singleStoreRankings?.find((r) => r.store === 'SAFEWAY')?.verifiedItemCount).toBe(1);
    expect(shopping.tripComparison.additionalCostEstimateComplete).toBe(false);
  });

  it.each<['ALL' | StoreChain, StoreChain[], StoreChain, number]>([
    ['KING_SOOPERS', ['KING_SOOPERS', 'SAFEWAY'], 'KING_SOOPERS', 4],
    ['ALL', ['KING_SOOPERS'], 'KING_SOOPERS', 4],
    ['ALL', ['SAFEWAY'], 'SAFEWAY', 2],
    ['ALL', ['KING_SOOPERS', 'SAFEWAY'], 'SAFEWAY', 2],
  ])('preserves the production store pool %s / %j while recovering a same-store offer', (filter, stores, expectedStore, expectedPrice) => {
    const use = useFor('spinach');
    const offers = [createMockOffer({ canonicalIngredientId: use.marketIngredientId, store: 'KING_SOOPERS', rawTitle: 'Fresh kale', normalizedPricePerUnit: 1, source: 'FLIPP_LIVE' }),
      createMockOffer({ canonicalIngredientId: use.marketIngredientId, store: 'KING_SOOPERS', rawTitle: 'Fresh spinach', normalizedPricePerUnit: 4, source: 'FLIPP_LIVE' }),
      createMockOffer({ canonicalIngredientId: use.marketIngredientId, store: 'SAFEWAY', rawTitle: 'Fresh spinach', normalizedPricePerUnit: 2, source: 'FLIPP_LIVE' })];
    const commodities = scoreAllCommodities(offers, filter, {}, stores, {});
    expect(commodities[0].recipeOffers).toHaveLength(3);
    expect(commodities[0].storeOffers?.KING_SOOPERS?.rawTitle).toBe('Fresh kale');
    const result = applyPantryToRecipe(dish(use), [], commodities);
    expect(result.matchedIngredients[0]).toMatchObject({ store: expectedStore, unitCost: expectedPrice, slotCost: 2 * expectedPrice });
    const ranked = rankMealPrepDishes(commodities, [], [], 6, {}).allRankedDishes.find((r) => r.id === use.recipeId)!;
    expect(ranked.matchedIngredients.find((r) => r.ingredientId === use.marketIngredientId)?.store).toBe(expectedStore);
  });

  it('keeps a selected-store recipe unpriced when only an excluded store has the required food', () => {
    const use = useFor('spinach');
    const offers = [createMockOffer({ canonicalIngredientId: use.marketIngredientId, store: 'KING_SOOPERS', rawTitle: 'Fresh kale', source: 'FLIPP_LIVE' }),
      createMockOffer({ canonicalIngredientId: use.marketIngredientId, store: 'SAFEWAY', rawTitle: 'Fresh spinach', source: 'FLIPP_LIVE' })];
    for (const filter of ['ALL', 'KING_SOOPERS'] as const) {
      const commodities = scoreAllCommodities(offers, filter, {}, ['KING_SOOPERS'], {});
      const result = applyPantryToRecipe(dish(use), [], commodities);
      expect(result.matchedIngredients).toEqual([]);
      expect(result.additionalCostEstimateComplete).toBe(false);
      const shopping = buildShoppingListAndStoreComparison([result], commodities, [], '80542', ['KING_SOOPERS']);
      expect(shopping.items).toEqual([]);
      expect(shopping.pantryNeeds).toHaveLength(1);
      // Old cached commodities retain their selected best-offer store, even if
      // the newly added selection metadata is absent.
      delete commodities[0].recipeStorePool;
      expect(applyPantryToRecipe(dish(use), [], commodities).additionalCostEstimateComplete).toBe(false);
    }
  });

  it('does not aggregate broad and exact uses of the same market group or copy tomato/tomatillo prices', () => {
    const either = useFor('greens'), exact = useFor('spinach');
    const commodity = market(either, [['Fresh kale', 1, 'KING_SOOPERS'], ['Fresh spinach', 3, 'SAFEWAY']]);
    const shopping = buildShoppingListAndStoreComparison([dish(either), dish(exact)], [commodity], [], '80542', ['KING_SOOPERS', 'SAFEWAY']);
    expect(shopping.items).toHaveLength(2);
    expect(new Set(shopping.items.map((r) => r.ingredientId)).size).toBe(2);
    expect(shopping.tripComparison.optimalSplitTotal).toBe(8);
    const eitherItem = shopping.items.find((r) => r.ingredientId === recipeUseRequirementId(either))!;
    expect(eitherItem.storePricing?.KING_SOOPERS?.ingredientName).toBe('Fresh kale');
    expect(eitherItem.storePricing?.SAFEWAY?.ingredientName).toBe('Fresh spinach');
    const kaleLink = buildStoreSearchUrl('KING_SOOPERS', eitherItem.storePricing!.KING_SOOPERS!.ingredientName!);
    expect(new URL(kaleLink.url).searchParams.get('query')).toBe('Fresh kale');
    const tomatoes = useFor('tomatoes'), tomatoOrTomatillo = useFor('tomatoOrTomatillo');
    const ad = market(tomatoes, [['Fresh Roma Tomatoes or Husks Tomatillos', 1, 'KING_SOOPERS']]);
    expect(applyPantryToRecipe(dish(tomatoes), [], [ad]).additionalCostEstimateComplete).toBe(false);
    expect(applyPantryToRecipe(dish(tomatoOrTomatillo), [], [ad]).totalBatchCost).toBe(2);
  });

  it('re-evaluates formerly unpriced saved recipes on price arrival/removal and pantry Yes/No without duplicating needs', () => {
    const use = useFor('spinach');
    const empty = applyPantryToRecipe(dish(use), [], []);
    expect(empty.matchedIngredients).toEqual([]);
    expect(empty.pantryRequirements).toHaveLength(1);
    const commodity = market(use, [['Fresh spinach', 2, 'KING_SOOPERS']]);
    const repriced = applyPantryToRecipe(empty, [], [commodity]);
    expect(repriced.totalBatchCost).toBe(4);
    expect(repriced.pantryRequirements).toEqual([]);
    const repeated = applyPantryToRecipe({ ...empty, pantryRequirements: [empty.pantryRequirements![0], { ...empty.pantryRequirements![0], quantity: 3 }] }, [], [commodity]);
    expect(repeated.totalBatchCost).toBe(10);
    expect(repeated.pantryCoverage).toMatchObject({ requiredCount: 1, availableRequiredCount: 0 });
    expect(buildShoppingListAndStoreComparison([repeated], [commodity], [], '80542', ['KING_SOOPERS']).items[0].totalQuantityNeeded).toBe(5);
    const removed = applyPantryToRecipe(repriced, [], []);
    expect(removed.missingPriceIngredientIds).toEqual([recipeUseRequirementId(use)]);
    const owned = applyPantryToRecipe(removed, ['spinach-fresh'], []);
    expect(owned.additionalCostEstimateComplete).toBe(true);
    expect(owned.pantryCoverage?.availableRequiredCount).toBe(1);
    const shopping = buildShoppingListAndStoreComparison([owned], [], [], '80542', ['KING_SOOPERS']);
    expect(shopping.pantryNeeds).toHaveLength(1);
    expect(shopping.tripComparison.additionalCostEstimateComplete).toBe(false);
  });

  it('fails closed for edited, custom and stale saved contexts, including injected synthetic requirements', () => {
    const use = useFor('greens'), canonical = dish(use), commodity = market(use, [['Fresh spinach', 2, 'KING_SOOPERS']]);
    const changes: Partial<RecommendedDish>[] = [{ id: 'custom-recipe' }, { steps: ['Use only spinach'] }, { title: 'Spinach only' },
      { aiGenerated: true }, { matchedIngredients: [{ ...slot(use), ingredientName: 'Fresh spinach' }] },
      { matchedIngredients: [{ ...slot(use), slotLabel: 'Spinach only' }] }];
    for (const change of changes) {
      const edited = { ...canonical, ...change };
      const result = applyPantryToRecipe(edited, ['spinach-fresh', 'kale-fresh'], [commodity]);
      expect(result.pantryCoverage?.availableRequiredCount).toBe(0);
      expect(result.additionalCostEstimateComplete).toBe(false);
    }
    const custom = createMockDish({ pantryStaples: [], pantryRequirements: [{ ingredientId: recipeUseRequirementId(use), displayName: 'Greens', quantity: 1, unit: 'lb' }] });
    expect(applyPantryToRecipe(custom, ['kale-fresh'], [commodity]).pantryCoverage?.availableRequiredCount).toBe(0);
  });

  it('rejects ambiguous alternatives, hidden preparations and substring names', () => {
    for (const title of ['White or Baby Bella Mushrooms', 'Baby bella mushrooms or assorted vegetables', 'Babybella mushroom powder', 'White mushrooms / sliced mushrooms'])
      expect(recipeOfferAllowed(useFor('cremini'), title), title).toBe(false);
    for (const title of ['Spinach or cooking greens', 'Spinachland greens', 'Spinach sauce', 'Spinach and cheese', 'Spinach / assorted greens',
      'Fresh spinach/arugula', 'Fresh spinach /arugula', 'Fresh spinach/ arugula', 'Fresh spinach / arugula', 'Fresh spinach/kale'])
      expect(recipeOfferAllowed(useFor('spinach'), title), title).toBe(false);
    for (const [policy, title] of [['carrots', 'Carrot cake'], ['broccoli', 'Fresh broccoli slaw'], ['spinach', 'Spinach tortellini'], ['carrots', 'Honey glazed carrots']])
      expect(recipeOfferAllowed(useFor(policy), title), title).toBe(false);
    for (const title of ['Whole parsnips or peeled baby carrots', 'Kroger Whole Vegetables or Peeled Baby Carrots'])
      expect(recipeOfferAllowed(useFor('carrots'), title), title).toBe(false);
    expect(recipeOfferAllowed(useFor('mushrooms'), 'Whole or Sliced White Mushrooms')).toBe(true);
    expect(recipeOfferAllowed(useFor('broccoli'), 'Fresh Broccoli Crowns or Florets')).toBe(true);
    expect(recipeOfferAllowed(useFor('greens'), 'Fresh spinach/kale')).toBe(true);
    expect(recipeOfferAllowed(useFor('crucifers'), 'Broccoli/Cauliflower')).toBe(true);
    expect(recipeOfferAllowed(useFor('carrots'), 'Whole/Peeled Baby Carrots')).toBe(true);
    expect(recipeOfferAllowed(useFor('mushrooms'), 'Fresh white mushrooms/sliced mushrooms')).toBe(false);
  });

  it('retains the real keyless whole-or-peeled carrot offer through scoring, recipe pricing and shopping', () => {
    const use = useFor('carrots');
    const commodities = scoreAllCommodities(ALL_WEEKLY_BASELINE_OFFERS, 'KING_SOOPERS', {}, ['KING_SOOPERS'], {});
    const result = applyPantryToRecipe(dish(use), [], commodities);
    expect(result.matchedIngredients[0]).toMatchObject({ ingredientId: 'carrots-whole-baby', store: 'KING_SOOPERS', unitCost: 0.75, slotCost: 1.5 });
    expect(result.matchedIngredients[0].rawDealText).toContain('Kroger Whole or Peeled Baby Carrots');
    expect(result.additionalCostEstimateComplete).toBe(true);
    const shopping = buildShoppingListAndStoreComparison([result], commodities, [], '80542', ['KING_SOOPERS']);
    expect(shopping.items[0]).toMatchObject({ optimalStore: 'KING_SOOPERS', optimalUnitCost: 0.75, optimalTotalCost: 1.5 });
    expect(shopping.pantryNeeds).toEqual([]);
  });

  it('admits every six-store fallback title whose named foods fit the reviewed alternatives', () => {
    for (const policy of ['carrots', 'crucifers', 'mushrooms', 'tomatoOrTomatillo']) {
      const use = useFor(policy);
      const offers = ALL_WEEKLY_BASELINE_OFFERS.filter((offer) => offer.canonicalIngredientId === use.marketIngredientId);
      expect(offers).toHaveLength(6);
      for (const offer of offers) expect(recipeOfferAllowed(use, offer.rawTitle), `${policy}: ${offer.rawTitle}`).toBe(true);
    }
    expect(recipeOfferAllowed(useFor('carrots'), 'Good & Gather Whole or Baby Carrots')).toBe(true);
    expect(recipeOfferAllowed(useFor('tomatoes'), 'Good & Gather Roma or Vine-Ripened Tomatoes')).toBe(true);
    expect(recipeOfferAllowed(useFor('spinach'), 'Good & Gather Fresh spinach/arugula')).toBe(false);
  });

  it('preserves a concrete food in pickup queries derived from shared-noun offer titles', () => {
    const use = useFor('mushrooms');
    const commodities = scoreAllCommodities(ALL_WEEKLY_BASELINE_OFFERS, 'KING_SOOPERS', {}, ['KING_SOOPERS'], {});
    const result = applyPantryToRecipe(dish(use), [], commodities);
    const shopping = buildShoppingListAndStoreComparison([result], commodities, [], '80542', ['KING_SOOPERS']);
    const title = shopping.items[0].storePricing!.KING_SOOPERS!.ingredientName!;
    expect(title).toContain('Kroger Whole or Sliced Baby Bella / White Mushrooms');
    const links = getItemCurbsideLinks('KING_SOOPERS', title, '80542');
    expect(new URL(links.primaryLink.url).searchParams.get('query')).toBe('baby bella mushrooms');
    for (const link of links.bridgeLinks) expect(decodeURIComponent(link.url)).toContain('mushrooms');
    const carrot = getItemCurbsideLinks('KING_SOOPERS', 'Kroger Whole or Peeled Baby Carrots (2 lb Bag)', '80542');
    expect(new URL(carrot.primaryLink.url).searchParams.get('query')).toBe('carrots');
  });

  it('applies exact availability during ranking, including when no market commodity exists', () => {
    const either = useFor('greens'), commodity = market(either, [['Fresh spinach', 2, 'KING_SOOPERS']]);
    const all = CANONICAL_INGREDIENTS.map((ingredient) => ingredient.id === commodity.ingredient.id ? commodity : createMockCommodity({ ingredient }));
    const ids = ['kale-fresh'];
    const ranked = rankMealPrepDishes(all, [], ids, 6, {}).allRankedDishes;
    const tuscan = ranked.find((r) => r.id === either.recipeId)!;
    expect(tuscan.matchedIngredients.find((r) => r.ingredientId === either.marketIngredientId)?.isOnHand).toBe(true);
    const curry = ranked.find((r) => r.id === useFor('spinach').recipeId)!;
    expect(curry.matchedIngredients.find((r) => r.ingredientId === either.marketIngredientId)?.isOnHand).not.toBe(true);
    const without = rankMealPrepDishes([], [], ids, 6, {}).allRankedDishes.find((r) => r.id === either.recipeId)!;
    expect(without.pantryRequirements?.find((r) => r.ingredientId === recipeUseRequirementId(either))).toBeDefined();
    expect(without.pantryCoverage!.availableRequiredCount).toBeGreaterThan(0);
  });

  it('retains exact 138-identity presentation and account installation guards while preserving known new entries', () => {
    expect(cookingCatalogView('2026-11-06.3').ingredients).toEqual(previous.ingredients);
    const entry: PantryEntry = { id: 'broccoli', revision: 1, updatedAtIso: '', ingredientId: 'broccoli-fresh', displayName: 'Broccoli', available: true };
    expect(canSavePantryIngredient(entry, undefined, previous.ingredients.map((r) => r.id))).toBe(false);
    expect(canSavePantryIngredient(entry, undefined, artifact.ingredients.map((r) => r.id))).toBe(true);
    expect(canSavePantryIngredient(entry, entry, [])).toBe(true);
    expect(matchedRecipeRequirement(dish(useFor('broccoli')), slot(useFor('broccoli'))).displayName).toBe('Broccoli');
  });

  it('keeps an owned unquoted vegetable ahead of a priced alternative while preserving an explicit pin', () => {
    const use = scopedRecipeUses.find((r) => r.recipeId === 'sheet-pan-salmon-asparagus-brussels-potato-roast' && r.slotKey === 'green_veg' && r.marketIngredientId === 'broccoli-cauliflower')!;
    const brussels = createMockCommodity({ ingredient: CANONICAL_INGREDIENTS.find((r) => r.id === 'brussels-sprouts')!,
      bestOffer: createMockOffer({ canonicalIngredientId: 'brussels-sprouts', normalizedPricePerUnit: 3 }) });
    const rank = (priced: boolean, pinned: string[] = []) => rankMealPrepDishes(priced ? [brussels] : [], pinned, ['broccoli-fresh'], 6, {})
      .allRankedDishes.find((r) => r.id === use.recipeId)!;
    const result = rank(true);
    expect(result.totalBatchCost).toBe(rank(false).totalBatchCost);
    expect(result.matchedIngredients.some((r) => r.ingredientId === 'brussels-sprouts')).toBe(false);
    expect(result.pantryRequirements?.find((r) => r.ingredientId === recipeUseRequirementId(use))).toBeDefined();
    const shopping = buildShoppingListAndStoreComparison([result], [brussels], ['broccoli-fresh'], '80542', ['KING_SOOPERS']);
    expect(shopping.items.some((r) => r.ingredientId === 'brussels-sprouts')).toBe(false);
    expect(shopping.pantryNeeds.some((r) => r.ingredientId === recipeUseRequirementId(use))).toBe(false);
    expect(rank(true, ['brussels-sprouts']).matchedIngredients.find((r) => r.ingredientId === 'brussels-sprouts')?.slotCost).toBe(5.25);
  });

  it('binds original approval and all 63 current slot uses to reviewed revisions and implemented directions', () => {
    const compile = (raw: unknown) => compileScopedRecipeUses(raw, parseArtifact(artifact).ingredients, CANONICAL_INGREDIENTS, MEAL_PREP_BLUEPRINTS, coverageApproval);
    expect(compile(approval).uses).toEqual(scopedRecipeUses);
    expect(compile(approval).uses).toHaveLength(63);
    expect(approval.review.payloadSha256).toBe(sha256(proposal));
    expect(() => compile({ ...approval, review: { ...approval.review, payloadSha256: 'changed' } })).toThrow('stale');
    expect(() => compile({ ...approval, integrationBlueprintHash: 'changed' })).toThrow('stale');
    const missing = { ...proposal, decisions: proposal.decisions.slice(1) };
    expect(() => compile({ ...approval, proposal: missing, review: { ...approval.review, payloadSha256: sha256(missing) } })).toThrow(/history|Every protected|stale/);
  });
});
