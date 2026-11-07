import cookingData from '@/data/cooking-catalog.json';
import { ScopedRecipeUse } from '@/types/catalog';
import { MatchedSlotIngredient, RecommendedDish, ScoredCommodity, StoreChain, StoreOffer } from '@/types/domain';
import { PantryRequirement } from '@/types/pantry';
import { recipePantryIngredientId, recipeUseRequirementId, scopedRecipeUses } from './recipe-identity';
import { calculateValueScore } from '@/lib/value-score';
import { OFFER_FOOD_TERMS as foodTerms, INCOMPATIBLE_PRODUCE as incompatible, stripProduceOfferBrand as stripOfferBrand, hasUnresolvedProduceAlternatives, hasMultipleProduceFoods } from './offer-food';

const protectedIds = new Set(scopedRecipeUses.map((use) => use.marketIngredientId));
const contexts = new Map(cookingData.scopedRecipeContexts.map((context) => [context.id, context]));
const byRequirement = new Map(scopedRecipeUses.map((use) => [recipeUseRequirementId(use), use]));
export const isProtectedMarketIngredient = (id: string): boolean => protectedIds.has(id);
export function recipeUseForSlot(recipeId: string, slotLabel: string, marketId: string): ScopedRecipeUse | undefined {
  return scopedRecipeUses.find((use) => use.recipeId === recipeId && use.slotLabel === slotLabel && use.marketIngredientId === marketId);
}

function reviewedContext(dish: RecommendedDish): boolean {
  const context = contexts.get(dish.id);
  return Boolean(context && dish.aiGenerated !== true && context.title === dish.title && Array.isArray(dish.steps) &&
    context.steps.length === dish.steps.length && context.steps.every((step, index) => step === dish.steps[index]));
}

export function resolveRecipeUse(dish: RecommendedDish, ingredient: MatchedSlotIngredient): ScopedRecipeUse | undefined {
  if (!reviewedContext(dish)) return;
  const use = recipeUseForSlot(dish.id, ingredient.slotLabel, ingredient.ingredientId);
  // An edited specific ingredient cannot inherit a broader group just by keeping its old ID.
  return use && [use.marketIngredientName, use.displayName].includes(ingredient.ingredientName) ? use : undefined;
}

export function recipeUseRequirementAllowed(dish: RecommendedDish, id: string): boolean {
  const use = byRequirement.get(id);
  return Boolean(use && use.recipeId === dish.id && reviewedContext(dish));
}
export function recipeUseForRequirement(dish: RecommendedDish, id: string): ScopedRecipeUse | undefined {
  return recipeUseRequirementAllowed(dish, id) ? byRequirement.get(id) : undefined;
}

export function matchedRecipeRequirement(dish: RecommendedDish, ingredient: MatchedSlotIngredient): PantryRequirement {
  const use = resolveRecipeUse(dish, ingredient);
  const valid = Number.isFinite(ingredient.quantityUsed) && ingredient.quantityUsed >= 0;
  return { ingredientId: use ? recipeUseRequirementId(use) : protectedIds.has(ingredient.ingredientId)
    ? `unmapped:recipe:${dish.id}:${ingredient.slotLabel}:${ingredient.ingredientId}` : recipePantryIngredientId(ingredient.ingredientId),
  displayName: use?.displayName ?? ingredient.ingredientName, quantity: valid ? ingredient.quantityUsed : 1,
  unit: valid ? ingredient.unit : '', ...(ingredient.optional ? { optional: true } : {}) };
}

// Complete food terms and incompatible forms are checked against the original title only.
const foodDescriptors: Readonly<Record<string, readonly string[]>> = {
  carrots: ['whole', 'peeled', 'unpeeled', 'baby', 'sliced', 'chopped', 'diced'],
  broccoli: ['whole', 'crowns', 'florets', 'chopped'], cauliflower: ['whole', 'florets', 'chopped'],
  spinach: ['baby', 'leaves'], kale: ['baby', 'leaves', 'chopped'],
  'white-mushrooms': ['whole', 'sliced', 'chopped'], 'cremini-mushrooms': ['whole', 'sliced', 'chopped'],
  tomatoes: ['whole', 'sliced', 'diced', 'roma', 'vine-ripened'], tomatillos: ['whole'],
};
function sharedFoodDescriptor(part: string, namedFoods: string[]): boolean {
  let words = stripOfferBrand(part).toLowerCase().trim();
  const prefix = /^(?:fresh|organic)\s+/;
  while (prefix.test(words)) words = words.replace(prefix, '');
  // Reviewed cuts and tomato aliases may share an explicitly named food noun.
  // Unknown nouns cannot: "Whole parsnips or baby carrots" still fails admission.
  return Boolean(words) && namedFoods.some((food) => words.split(/\s+/).every((word) => foodDescriptors[food]?.includes(word)));
}
export function recipeOfferAllowed(use: ScopedRecipeUse, rawTitle: string): boolean {
  if (typeof rawTitle !== 'string' || incompatible.test(rawTitle)) return false;
  if (['potatoes-russet-gold', 'poblano-anaheim-peppers', 'butternut-acorn-squash', 'zucchini-yellow-squash', 'apples-honeycrisp-gala'].includes(use.marketIngredientId) && (hasUnresolvedProduceAlternatives(rawTitle) || hasMultipleProduceFoods(rawTitle))) return false;
  const found = Object.entries(foodTerms).filter(([, terms]) => terms.test(rawTitle)).map(([food]) => food);
  // Strip only known leading brands before interpreting punctuation as food alternatives.
  const alternatives = stripOfferBrand(rawTitle).replace(/\b\d+\s*\/\s*\d+\b/g, '').split(/\bor\b|\band\b|&|\//i);
  return found.length > 0 && found.every((food) => use.offerFoods.includes(food)) &&
    alternatives.every((part) => Object.entries(foodTerms).some(([food, term]) => use.offerFoods.includes(food) && term.test(part)) || sharedFoodDescriptor(part, found));
}

/** Filter each actual offer separately; never relabel the original commodity or its history. */
export function recipeCommodity(dish: RecommendedDish, ingredient: MatchedSlotIngredient, commodity: ScoredCommodity | undefined): ScoredCommodity | undefined {
  if (!commodity || !protectedIds.has(ingredient.ingredientId)) return commodity;
  const use = resolveRecipeUse(dish, ingredient);
  if (!use) return;
  return scopedRecipeCommodity(use, commodity);
}

export function scopedRecipeCommodity(use: ScopedRecipeUse, commodity: ScoredCommodity): ScoredCommodity | undefined {
  const compare = (a: StoreOffer, b: StoreOffer) => Number(a.source === 'CURATED_FALLBACK') - Number(b.source === 'CURATED_FALLBACK') || a.normalizedPricePerUnit - b.normalizedPricePerUnit;
  // Production scoring collapses the market board per store; admission must see the
  // original offers first, so a cheap sibling cannot discard this recipe's food.
  const offers = (commodity.recipeOffers ?? [commodity.bestOffer, commodity.runnerUpOffer, commodity.kingSoopersOffer, commodity.safewayOffer, ...Object.values(commodity.storeOffers ?? {})])
    .filter((offer): offer is StoreOffer => Boolean(offer && offer.canonicalIngredientId === use.marketIngredientId &&
      Number.isFinite(offer.normalizedPricePerUnit) && offer.normalizedPricePerUnit >= 0 && recipeOfferAllowed(use, offer.rawTitle))).sort(compare);
  const storeOffers: Partial<Record<StoreChain, StoreOffer>> = {};
  for (const offer of offers) if (!storeOffers[offer.store]) storeOffers[offer.store] = offer;
  // Keep admissible comparison offers, but choose card/ranking prices only from
  // the selected pool. A rejected selected-store offer does not authorize another store.
  // Older cached payloads do not expose the chosen pool; preserve their chosen
  // store instead of interpreting missing metadata as permission to expand it.
  const eligibleStores = commodity.recipeStorePool ?? [commodity.bestOffer.store];
  const pool = Object.values(storeOffers).filter((offer): offer is StoreOffer => Boolean(offer && eligibleStores.includes(offer.store))).sort(compare);
  if (!pool.length) return;
  return { ...commodity, ...calculateValueScore(commodity.ingredient, pool[0].normalizedPricePerUnit, pool[0].regularPricePerUnit),
    bestOffer: pool[0], runnerUpOffer: pool[1], storeOffers,
    kingSoopersOffer: storeOffers.KING_SOOPERS, safewayOffer: storeOffers.SAFEWAY };
}
