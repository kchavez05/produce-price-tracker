import { qualifiedProteinIds } from './protein-offer';
import { qualifiedDairyIds } from './dairy-offer';
import cookingData from '@/data/cooking-catalog.json';
import { hasUnresolvedProduceAlternatives, hasMultipleProduceFoods, INCOMPATIBLE_PRODUCE, produceOfferFoods, OFFER_FOOD_TERMS } from './offer-food';

const foodKeys: Readonly<Record<string, string[]>> = {
  'potatoes-russet-gold': ['potatoes'], 'apples-honeycrisp-gala': ['apples'],
  'poblano-anaheim-peppers': ['poblano', 'anaheim', 'jalapeno', 'serrano', 'hatch'],
  'butternut-acorn-squash': ['butternut', 'acorn', 'spaghetti', 'kabocha'],
  'zucchini-yellow-squash': ['summer-squash', 'zucchini', 'yellow-summer-squash'],
  'mushrooms-cremini-white': ['white-mushrooms', 'cremini-mushrooms'],
  'tomatoes-roma-vine': ['tomatoes', 'tomatillos'], 'spinach-kale-greens': ['spinach', 'kale', 'collards', 'chard'],
};
const identityTerms: Readonly<Record<string, RegExp>> = {
  'potatoes-fresh': /\bpotato(?:es)?\b/i, 'russet-potatoes-fresh': /\brussets?(?:\s+(?:organic|fresh|baking|baker))*\s+potato(?:es)?\b/i,
  'yukon-gold-potatoes-fresh': /\byukon\s+gold(?:\s+(?:organic|fresh))*\s+potato(?:es)?\b/i, 'red-potatoes-fresh': /\bred(?:\s+(?:organic|fresh))*\s+potato(?:es)?\b/i,
  'apples-fresh': /\bapples?\b/i, 'honeycrisp-apples-fresh': /\bhoneycrisp(?:\s+(?:organic|fresh))*\s+apples?\b/i, 'gala-apples-fresh': /\bgala(?:\s+(?:organic|fresh))*\s+apples?\b/i,
  'fuji-apples-fresh': /\bfuji(?:\s+(?:organic|fresh))*\s+apples?\b/i, 'granny-smith-apples-fresh': /\bgranny\s+smith(?:\s+(?:organic|fresh))*\s+apples?\b/i, 'cosmic-crisp-apples-fresh': /\bcosmic\s+crisp(?:\s+(?:organic|fresh))*\s+apples?\b/i,
  'summer-squash-fresh': /\b(?:summer\s+squash|zucchini|courgettes?|yellow\s+squash)\b/i,
  'zucchini-fresh': /\b(?:zucchini|courgettes?)\b/i, 'yellow-summer-squash-fresh': /\byellow(?:\s+summer)?\s+squash\b/i,
  'butternut-squash-fresh': OFFER_FOOD_TERMS.butternut, 'acorn-squash-fresh': OFFER_FOOD_TERMS.acorn,
  'spaghetti-squash-fresh': OFFER_FOOD_TERMS.spaghetti, 'kabocha-squash-fresh': OFFER_FOOD_TERMS.kabocha,
  'poblano-peppers-fresh': OFFER_FOOD_TERMS.poblano, 'anaheim-peppers-fresh': OFFER_FOOD_TERMS.anaheim,
  'jalapeno-peppers-fresh': OFFER_FOOD_TERMS.jalapeno, 'serrano-peppers-fresh': OFFER_FOOD_TERMS.serrano,
  'hatch-green-chiles-fresh': /\bhatch(?:\s+(?:mild|medium|hot|green|fresh|organic))*\s+(?:chiles?|chilies|peppers?)\b/i,
  'mushrooms-white-fresh': /\bwhite(?:\s+button)?\s+mushrooms?\b/i,
  'mushrooms-cremini-fresh': /\b(?:cremini|crimini|baby\s+bella)(?:\s+mushrooms?)?\b/i,
  'tomatoes-fresh': /\btomato(?:es)?\b/i, 'tomatillos-fresh': /\btomatillos?\b/i,
  'spinach-fresh': /\bspinach\b/i, 'kale-fresh': /\bkale\b/i, 'collard-greens-fresh': /\bcollards?(?:\s+greens?)?\b/i, 'swiss-chard-fresh': /\b(?:swiss\s+)?chard\b/i,
};

/** Qualify possible observed foods only. Never convert this result into pantry ownership. */
export function marketCounterpartIds(marketId: string, rawTitle: string): string[] {
  const dairy = qualifiedDairyIds(marketId, rawTitle);
  if (dairy !== undefined) return dairy.filter((id) => cookingData.marketCounterparts.some((r) => r.marketIngredientId === marketId && r.pantryIngredientId === id)).sort();
  const protein = qualifiedProteinIds(marketId, rawTitle);
  if (protein !== undefined) return protein.filter((id) => cookingData.marketCounterparts.some((r) => r.marketIngredientId === marketId && r.pantryIngredientId === id)).sort();
  if (typeof rawTitle !== 'string' || INCOMPATIBLE_PRODUCE.test(rawTitle) || hasUnresolvedProduceAlternatives(rawTitle) || hasMultipleProduceFoods(rawTitle)) return [];
  const allowed = foodKeys[marketId];
  const found = produceOfferFoods(rawTitle);
  if (!allowed || !found.length || found.some((food) => !allowed.includes(food))) return [];
  return cookingData.marketCounterparts.filter((row) => row.marketIngredientId === marketId && identityTerms[row.pantryIngredientId]?.test(rawTitle)).map((row) => row.pantryIngredientId).sort();
}
