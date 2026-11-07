import { describe, expect, it } from 'vitest';
import cases from '../../../catalog/proposals/2026-11-07-market-produce/behavior-cases.json';
import proposal from '../../../catalog/proposals/2026-11-07-market-produce/recipe-use-proposal.json';
import hashes from '../../../catalog/proposals/2026-11-07-market-produce/decision-hashes.json';
import ledgerData from '../../../catalog/curation-ledger.json';
import previous from '../../../catalog/releases/2026-11-06.5/catalog.json';
import artifact from '../../../catalog/releases/2026-11-07.1/catalog.json';
import approval from '../../../catalog/market-coverage-approvals.json';
import originalScoped from '../../../catalog/scoped-recipe-uses.json';
import runtime from '@/data/cooking-catalog.json';
import { MEAL_PREP_BLUEPRINTS } from '@/data/meal-prep-blueprints';
import { CANONICAL_INGREDIENTS } from '@/data/canonical-ingredients';
import { StoreChain, MatchedSlotIngredient, RecommendedDish, ScoredCommodity } from '@/types/domain';
import { PantryEntry } from '@/types/pantry';
import { ScopedRecipeUse } from '@/types/catalog';
import { decisionHash, parseLedger, parseArtifact, sha256 } from '../../../scripts/lib/catalog-curation';
import { compileMarketCounterparts } from '../../../scripts/lib/market-coverage-approvals';
import { compileScopedRecipeUses } from '../../../scripts/lib/scoped-recipe-uses';
import { cookingCatalogView, availablePantryIngredientIds, canSavePantryIngredient, validatePantryEntry } from '@/lib/pantry/model';
import { marketCounterpartIds } from '@/lib/pantry/market-counterparts';
import { recipeAvailableIngredientIds, recipeUseRequirementId, scopedRecipeUses } from '@/lib/pantry/recipe-identity';
import { recipeOfferAllowed, recipeUseForSlot, scopedRecipeCommodity } from '@/lib/pantry/recipe-use';
import { applyPantryToRecipe } from '@/lib/pantry/recipe';
import { buildShoppingListAndStoreComparison } from '@/lib/shopping-list';
import { cleanSearchQueryForIngredient } from '@/lib/cart-exporter';
import { createMockCommodity, createMockDish, createMockOffer } from 'tests/test-utils';
const current = parseArtifact(artifact);
const groups: Record<string, string> = { potatoes: 'potatoes-russet-gold', apples: 'apples-honeycrisp-gala', 'cremini-mushrooms': 'mushrooms-cremini-white', tomatillos: 'tomatoes-roma-vine', poblano: 'poblano-anaheim-peppers', butternut: 'butternut-acorn-squash', spinach: 'spinach-kale-greens', 'summer-squash': 'zucchini-yellow-squash' };
const titles: Record<string, string> = { potatoes: 'Russet potatoes 5 lb bag', apples: 'Gala apples', poblano: 'Fresh poblano peppers', anaheim: 'Fresh Anaheim peppers', butternut: 'Butternut squash', 'summer-squash': 'Fresh summer squash', zucchini: 'Zucchini', 'yellow-summer-squash': 'Yellow summer squash', 'white-mushrooms': 'White mushrooms', 'cremini-mushrooms': 'Baby bella mushrooms', tomatoes: 'Roma tomatoes', tomatillos: 'Tomatillos', spinach: 'Fresh spinach', kale: 'Fresh kale' };
const entry = (ingredientId: string, available = true): PantryEntry => ({ id: `${available}:${ingredientId}`, ingredientId, displayName: ingredientId, available, revision: 1, updatedAtIso: '' });
function slot(use: ScopedRecipeUse): MatchedSlotIngredient {
  return { slotLabel: use.slotLabel, ingredientId: use.marketIngredientId, ingredientName: use.marketIngredientName, quantityUsed: 2, unit: 'lb', store: 'KING_SOOPERS', rawDealText: 'stale', dealType: 'SHELF_OR_MEMBER', unitCost: 99, slotCost: 198, regularSlotCost: 198, isUserPinned: false };
}
function dish(use: ScopedRecipeUse): RecommendedDish {
  const blueprint = MEAL_PREP_BLUEPRINTS.find((b) => b.id === use.recipeId)!;
  return createMockDish({ id: blueprint.id, title: blueprint.title, steps: [...blueprint.steps], matchedIngredients: [slot(use)], pantryStaples: [], pantryRequirements: [], estimatedPantryCost: 0 });
}
function commodity(use: ScopedRecipeUse, offers: [string, number, StoreChain][], pool: StoreChain[] = ['KING_SOOPERS']): ScoredCommodity {
  const recipeOffers = offers.map(([rawTitle, normalizedPricePerUnit, store]) => createMockOffer({ canonicalIngredientId: use.marketIngredientId, rawTitle, normalizedPricePerUnit, regularPricePerUnit: normalizedPricePerUnit + 1, store }));
  return createMockCommodity({ ingredient: CANONICAL_INGREDIENTS.find((r) => r.id === use.marketIngredientId)!, bestOffer: recipeOffers[0], storeOffers: { [recipeOffers[0].store]: recipeOffers[0] }, recipeOffers, recipeStorePool: pool });
}

describe('approved market produce integration', () => {
  it('preserves exact approved curation payloads, old identities and all unmodified fields', () => {
    const ledger = parseLedger(ledgerData);
    expect(artifact.ingredients).toHaveLength(171);
    expect(artifact.decisions).toHaveLength(185);
    expect(artifact.decisions).toEqual(expect.arrayContaining(previous.decisions));
    for (const hash of hashes) {
      const d = ledger.decisions.find((d) => d.id === hash.id && d.revision === hash.revision)!;
      expect(d.status).toBe('approved'); expect(decisionHash(d)).toBe(hash.payloadSha256); expect(d.review?.payloadSha256).toBe(hash.payloadSha256);
    }
    for (const before of previous.ingredients) {
      const expected = { ...before, aliases: [...before.aliases, ...(before.id === 'spinach-fresh' ? ['fresh spinach greens'] : before.id === 'kale-fresh' ? ['fresh kale greens'] : [])] };
      expect(artifact.ingredients.find((r) => r.id === before.id)).toEqual(expected);
    }
    const added = artifact.ingredients.filter((r) => !previous.ingredients.some((p) => p.id === r.id));
    expect(added).toHaveLength(26); expect(added.every((r) => !('staticPrice' in r) && !('recipeIngredientId' in r))).toBe(true);
    expect(artifact.compatibility).toHaveLength(previous.compatibility.length + 10);
  });
  it.each(cases.availabilityCases)('honors exact and directional availability: $positives / No $negatives → $requiredId', (row) => {
    const resolved = availablePantryIngredientIds([...row.positives.map((id) => entry(id)), ...row.negatives.map((id) => entry(id, false))]);
    expect(resolved.includes(row.requiredId)).toBe(row.expected);
    for (const id of row.positives) expect(validatePantryEntry(entry(id)).ok).toBe(true);
  });
  it.each(cases.offerCases)('qualifies original title "$title" separately from recipe use', (row) => {
    const marketId = groups[row.recipeFood];
    expect(marketCounterpartIds(marketId, row.title)).toEqual([...row.counterpartIds].sort());
    const use = scopedRecipeUses.find((r) => r.marketIngredientId === marketId && r.offerFoods.includes(row.recipeFood) && (row.recipeFood !== 'cremini-mushrooms' || r.offerFoods.length === 1))!;
    expect(use).toBeDefined();
    expect(recipeOfferAllowed(use, row.title)).toBe(row.admit);
  });
  it.each(proposal.decisions.filter((r) => r.action === 'allow'))('covers and prices approved scope $id once', (row) => {
    const use = scopedRecipeUses.find((r) => r.id === row.id)!;
    const market = commodity(use, [[titles[row.offerFoods[0]], 2, 'KING_SOOPERS']]);
    const input = dish(use), before = JSON.stringify(input);
    const available = availablePantryIngredientIds([entry(row.pantryIngredientIds[0])]);
    const covered = applyPantryToRecipe(input, available, [market]);
    expect(covered.pantryCoverage).toMatchObject({ requiredCount: 1, availableRequiredCount: 1 });
    expect(covered.totalBatchCost).toBe(0);
    expect(buildShoppingListAndStoreComparison([covered], [market], available, '80542', ['KING_SOOPERS'], true).items).toHaveLength(0);
    const needed = applyPantryToRecipe(input, [], [market]);
    expect(needed.totalBatchCost).toBe(4); expect(needed.pantryCoverage!.availableRequiredCount).toBe(0);
    const denied = applyPantryToRecipe(input, availablePantryIngredientIds([entry(row.pantryIngredientIds[0]), entry(row.pantryIngredientIds[0], false)]), [market]);
    expect(denied.totalBatchCost).toBe(4);
    const unpriced = applyPantryToRecipe(input, [], []);
    expect(unpriced.additionalCostEstimateComplete).toBe(false);
    expect(applyPantryToRecipe(unpriced, [], [market]).totalBatchCost).toBe(4);
    expect(JSON.stringify(input)).toBe(before);
  });
  it.each(proposal.decisions.filter((r) => r.action === 'reject'))('removes unsupported candidate $id', (row) => {
    const s = MEAL_PREP_BLUEPRINTS.find((b) => b.id === row.recipeId)!.slots.find((s) => s.slotKey === row.slotKey)!;
    expect([...s.candidateIngredientIds, ...s.lowCarbCandidateIds ?? []]).not.toContain(row.marketIngredientId);
    expect(recipeUseForSlot(row.recipeId, s.label, row.marketIngredientId)).toBeUndefined();
  });
  it('uses newly owned cremini and tomatillos only within their approved recipe scopes', () => {
    const mushrooms = scopedRecipeUses.filter((r) => r.marketIngredientId === 'mushrooms-cremini-white');
    const owned = recipeAvailableIngredientIds(availablePantryIngredientIds([entry('mushrooms-cremini-fresh'), entry('mushrooms-white-fresh', false)]));
    expect(mushrooms).toHaveLength(4);
    for (const use of mushrooms) expect(owned).toContain(recipeUseRequirementId(use));
    const tomatillos = recipeAvailableIngredientIds(availablePantryIngredientIds([entry('tomatillos-fresh'), entry('tomatoes-fresh', false)]));
    const either = scopedRecipeUses.find((r) => r.marketIngredientId === 'tomatoes-roma-vine' && r.slotKey === 'tomato_acid')!;
    const tomatoOnly = scopedRecipeUses.find((r) => r.marketIngredientId === 'tomatoes-roma-vine' && r.slotKey === 'aromatics_tomato')!;
    expect(tomatillos).toContain(recipeUseRequirementId(either));
    expect(tomatillos).not.toContain(recipeUseRequirementId(tomatoOnly));
  });
  it('applies generic No precedence in the actual scoped recipe and keeps custom/group IDs from ownership', () => {
    const use = scopedRecipeUses.find((r) => r.marketIngredientId === 'potatoes-russet-gold')!;
    const available = availablePantryIngredientIds([entry('russet-potatoes-fresh'), entry('potatoes-fresh', false)]);
    expect(recipeAvailableIngredientIds(available)).not.toContain(recipeUseRequirementId(use));
    expect(recipeAvailableIngredientIds(['potatoes-russet-gold', recipeUseRequirementId(use)])).not.toContain(recipeUseRequirementId(use));
    expect(availablePantryIngredientIds([{ ...entry('potatoes-fresh'), ingredientId: undefined }])).toEqual([]);
    expect(recipeAvailableIngredientIds(['collard-greens-fresh', 'swiss-chard-fresh'])).not.toContain('spinach-kale-greens');
    const priced = commodity(use, [['Russet potatoes', 2, 'KING_SOOPERS']]);
    for (const stale of [{ ...dish(use), aiGenerated: true }, { ...dish(use), title: 'Custom potatoes' }, { ...dish(use), steps: ['Edited directions'] }]) {
      const result = applyPantryToRecipe(stale, ['potatoes-fresh'], [priced]);
      expect(result.pantryCoverage!.availableRequiredCount).toBe(0); expect(result.additionalCostEstimateComplete).toBe(false);
    }
  });
  it.each<StoreChain>(['KING_SOOPERS', 'SAFEWAY', 'WALMART', 'SPROUTS', 'ALDI', 'TARGET'])('filters original offers before per-store selection at %s', (store) => {
    const use = scopedRecipeUses.find((r) => r.marketIngredientId === 'potatoes-russet-gold')!;
    const market = commodity(use, [['Sweet potatoes', 1, store], ['Russet potatoes', 2, store]], [store]);
    const admitted = scopedRecipeCommodity(use, market)!;
    expect(admitted.bestOffer.rawTitle).toBe('Russet potatoes'); expect(admitted.bestOffer.normalizedPricePerUnit).toBe(2);
    const result = applyPantryToRecipe(dish(use), [], [market]);
    const shopping = buildShoppingListAndStoreComparison([result], [market], [], '80542', [store], true);
    expect(shopping.items[0].ingredientName).toContain('potato');
    expect(shopping.items[0].storePricing?.[store]?.ingredientName).toBe('Russet potatoes');
    expect(cleanSearchQueryForIngredient(admitted.bestOffer.rawTitle)).toBe('Russet potatoes');
  });
  it('preserves selected store pools and rejects unqualified/processed foods and misleading brand words', () => {
    const use = scopedRecipeUses.find((r) => r.marketIngredientId === 'potatoes-russet-gold')!;
    const market = commodity(use, [['Sweet potatoes', 1, 'KING_SOOPERS'], ['Russet potatoes', 2, 'SAFEWAY']]);
    expect(scopedRecipeCommodity(use, market)).toBeUndefined();
    expect(scopedRecipeCommodity(use, { ...market, recipeStorePool: ['SAFEWAY'] })!.bestOffer.store).toBe('SAFEWAY');
    for (const title of ['Frozen potatoes', 'Mashed potatoes', 'Potato flakes', 'Potato chips', 'Potato plant seeds', 'Potato hash browns', 'Potato French fries', 'Russet or red potatoes']) expect(recipeOfferAllowed(use, title)).toBe(false);
    expect(recipeOfferAllowed(use, 'Russet potatoes 1/2 lb')).toBe(true);
    expect(marketCounterpartIds('poblano-anaheim-peppers', 'Serrano ham')).toEqual([]);
    expect(marketCounterpartIds('apples-honeycrisp-gala', 'Caramel apples')).toEqual([]);
    expect(marketCounterpartIds('tomatoes-roma-vine', 'Tomatillo relish')).toEqual([]);
    expect(marketCounterpartIds('zucchini-yellow-squash', 'Zucchini yellow summer squash')).toEqual([]);
    expect(marketCounterpartIds('spinach-kale-greens', 'Spinach kale')).toEqual([]);
    expect(marketCounterpartIds('poblano-anaheim-peppers', 'Hatch Farms')).toEqual([]);
    expect(marketCounterpartIds('potatoes-russet-gold', 'Russet Farms red potatoes')).toEqual(['potatoes-fresh', 'red-potatoes-fresh']);
    expect(marketCounterpartIds('apples-honeycrisp-gala', 'Gala Farms Granny Smith apples')).toEqual(['apples-fresh', 'granny-smith-apples-fresh']);
    expect(cleanSearchQueryForIngredient('Russet Farms red potatoes')).toContain('red potatoes');
    expect(cleanSearchQueryForIngredient('Gala Farms Granny Smith apples')).toContain('Granny Smith apples');
  });
  it('binds independent counterpart approval and append-only scoped revisions to exact package hashes', () => {
    const compiled = () => compileScopedRecipeUses(originalScoped, current.ingredients, CANONICAL_INGREDIENTS, MEAL_PREP_BLUEPRINTS, approval);
    expect(compiled().uses).toEqual(scopedRecipeUses); expect(scopedRecipeUses).toHaveLength(41);
    expect(compileMarketCounterparts(approval, current.ingredients, CANONICAL_INGREDIENTS)).toEqual(runtime.marketCounterparts);
    expect(runtime.marketCounterparts).toHaveLength(30);
    const changed = structuredClone(approval); changed.approvals[0].recipeUses.decisions[0].pantryIngredientIds = ['collard-greens-fresh'];
    expect(() => compileScopedRecipeUses(originalScoped, current.ingredients, CANONICAL_INGREDIENTS, MEAL_PREP_BLUEPRINTS, changed)).toThrow('stale');
    const bad = structuredClone(approval); bad.approvals[0].review.payloadSha256 = 'bad';
    expect(() => compileMarketCounterparts(bad, current.ingredients, CANONICAL_INGREDIENTS)).toThrow('stale');
    expect(approval.approvals[0].review.payloadSha256).toBe(sha256(approval.approvals[0].envelope));
  });
  it('retains exact previous presentation and account readiness while preserving unknown saved IDs', () => {
    expect(cookingCatalogView(previous.catalogVersion).ingredients).toEqual(previous.ingredients);
    expect(cookingCatalogView(previous.catalogVersion).compatibility).toEqual(previous.compatibility);
    const saved = entry('russet-potatoes-fresh');
    expect(canSavePantryIngredient(saved, undefined, previous.ingredients.map((r) => r.id))).toBe(false);
    expect(canSavePantryIngredient(saved, undefined, artifact.ingredients.map((r) => r.id))).toBe(true);
    expect(canSavePantryIngredient(saved, saved, [])).toBe(true);
  });
});
