import cookingData from '@/data/cooking-catalog.json';
import { ScopedRecipeUse } from '@/types/catalog';
import { MatchedSlotIngredient, RecommendedDish, ScoredCommodity, StoreChain, StoreOffer } from '@/types/domain';
import { PantryRequirement } from '@/types/pantry';
import { recipePantryIngredientId, recipeUseRequirementId, scopedRecipeUses } from './recipe-identity';
import { calculateValueScore } from '@/lib/value-score';

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
const foodTerms: Readonly<Record<string, RegExp>> = {
  carrots: /\bcarrots?\b/i, broccoli: /\bbroccoli\b/i, cauliflower: /\bcauliflower\b/i,
  spinach: /\bspinach\b/i, kale: /\bkale\b/i, 'white-mushrooms': /\bwhite(?:\s+button)?\s+mushrooms?\b/i,
  'cremini-mushrooms': /\b(?:cremini|crimini|baby\s+bella)(?:\s+mushrooms?)?\b/i,
  tomatoes: /\btomato(?:es)?\b/i, tomatillos: /\btomatillos?\b/i,
};
const incompatible = /\b(?:frozen|canned|tinned|dried|dehydrated|powder(?:ed)?|juice[ds]?|soups?|dips?|sauces?|paste|ketchup|crusts?|tots?|riced|rice|slaw|salads?|cooked|roasted|grilled|pickled|cream(?:ed)?|pasta|ravioli|tortellini|gnocchi|lasagna|pizza|smoothies?|chips?|puree|pureed|salsa|stir[ -]?fry|medley|mix(?:ed)?|blend|cakes?|breads?|muffins?|cookies?|bagels?|wraps?|tortillas?|quiche|casserole|hummus|glaz(?:e|ed)|caramelized|saut[eé](?:ed)?|steamable|New Zealand|collard|chard)\b/i;
export function recipeOfferAllowed(use: ScopedRecipeUse, rawTitle: string): boolean {
  if (typeof rawTitle !== 'string' || incompatible.test(rawTitle)) return false;
  const found = Object.entries(foodTerms).filter(([, terms]) => terms.test(rawTitle)).map(([food]) => food);
  const alternatives = rawTitle.split(/\bor\b|\band\b|&|\s+\/\s+/i);
  return found.length > 0 && found.every((food) => use.offerFoods.includes(food)) &&
    alternatives.every((part) => Object.entries(foodTerms).some(([food, term]) => use.offerFoods.includes(food) && term.test(part)));
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
