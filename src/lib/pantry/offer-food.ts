import { proteinOfferSearchTerm } from './protein-offer';
import { dairyOfferSearchTerm } from './dairy-offer';
import { stripKnownOfferBrand, hasOfferAlternatives } from './offer-title';
/** Complete food terms shared by price admission and pickup-query normalization. */
export const OFFER_FOOD_TERMS: Readonly<Record<string, RegExp>> = {
  carrots: /\bcarrots?\b/i, broccoli: /\bbroccoli\b/i, cauliflower: /\bcauliflower\b/i,
  spinach: /\bspinach\b/i, kale: /\bkale\b/i, 'white-mushrooms': /\bwhite(?:\s+button)?\s+mushrooms?\b/i,
  'cremini-mushrooms': /\b(?:cremini|crimini|baby\s+bella)(?:\s+mushrooms?)?\b/i,
  tomatoes: /\btomato(?:es)?\b/i, tomatillos: /\btomatillos?\b/i,
  potatoes: /\bpotato(?:es)?\b/i, 'sweet-potatoes': /\bsweet\s+potato(?:es)?\b/i,
  apples: /\bapples?\b/i, poblano: /\bpoblanos?\b(?=\s*(?:peppers?\b|chiles?\b|chilies\b|$|\d))/i, anaheim: /\banaheim(?:\s+(?:green|fresh|organic))*\s+(?:peppers?|chiles?|chilies)\b/i,
  jalapeno: /\bjalape[nñ]os?\b(?=\s*(?:peppers?\b|chiles?\b|chilies\b|$|\d))/i, serrano: /\bserranos?\b(?=\s*(?:peppers?\b|chiles?\b|chilies\b|$|\d))/i,
  hatch: /\bhatch(?:\s+(?:mild|medium|hot|green|fresh|organic))*\s+(?:chiles?|chilies|peppers?)\b/i,
  pasilla: /\bpasillas?\b/i, butternut: /\bbutternut(?:\s+winter)?\s+squash\b/i, acorn: /\bacorn(?:\s+winter)?\s+squash\b/i,
  spaghetti: /\bspaghetti(?:\s+winter)?\s+squash\b/i, kabocha: /\bkabocha(?:\s+winter)?\s+squash\b/i,
  'summer-squash': /\bsummer\s+squash\b/i, zucchini: /\b(?:zucchini|courgettes?)\b/i,
  'yellow-summer-squash': /\byellow(?:\s+summer)?\s+squash\b/i,
  collards: /\bcollards?(?:\s+greens?)?\b/i, chard: /\b(?:swiss\s+)?chard\b/i,
};
const searchTerms: Readonly<Record<string, string>> = {
  carrots: 'carrots', broccoli: 'broccoli', cauliflower: 'cauliflower', spinach: 'spinach', kale: 'kale',
  'white-mushrooms': 'white mushrooms', 'cremini-mushrooms': 'cremini mushrooms', tomatoes: 'tomatoes', tomatillos: 'tomatillos', potatoes: 'potatoes', 'sweet-potatoes': 'sweet potatoes',
  apples: 'apples', poblano: 'poblano peppers', anaheim: 'Anaheim peppers', jalapeno: 'jalapeno peppers', serrano: 'serrano peppers', hatch: 'fresh Hatch green chiles', pasilla: 'pasilla peppers',
  butternut: 'butternut squash', acorn: 'acorn squash', spaghetti: 'spaghetti squash', kabocha: 'kabocha squash',
  'summer-squash': 'summer squash', zucchini: 'zucchini', 'yellow-summer-squash': 'yellow summer squash', collards: 'collard greens', chard: 'Swiss chard',
};

/** Pick a food actually named in the title when trimming shared nouns would lose it. */
export function offerFoodSearchTerm(title: string): string | undefined {
  const matches = Object.entries(OFFER_FOOD_TERMS).flatMap(([id, pattern]) => {
    const match = pattern.exec(title);
    return match ? [{ id, index: match.index, text: match[0] }] : [];
  }).sort((a, b) => a.index - b.index);
  const first = matches[0];
  if (!first) return dairyOfferSearchTerm(title) ?? proteinOfferSearchTerm(title);
  if (first.id === 'potatoes') {
    const variety = /\b(russet|yukon\s+gold|red)(?=\s+or\b|(?:\s+(?:fresh|organic|baking|baker))*\s+potato(?:es)?\b)/i.exec(title);
    if (variety) return `${variety[1]} potatoes`;
  }
  if (first.id === 'apples') {
    const variety = /\b(honeycrisp|gala|fuji|granny\s+smith|cosmic\s+crisp)(?=\s+or\b|(?:\s+(?:fresh|organic))*\s+apples?\b)/i.exec(title);
    if (variety) return `${variety[1]} apples`;
  }
  return first.id === 'cremini-mushrooms' && /baby\s+bella/i.test(first.text) ? 'baby bella mushrooms' : searchTerms[first.id];
}

/** Reject incompatible produce forms before identifying a precise food or recipe quote. */
export const INCOMPATIBLE_PRODUCE = /\b(?:frozen|canned|tinned|dried|dehydrated|powder(?:ed)?|juice[ds]?|cider|soups?|dips?|sauces?|paste|ketchup|crusts?|tots?|riced|rice|slaw|salads?|cooked|roasted|grilled|pickled|cream(?:ed)?|pasta|ravioli|tortellini|gnocchi|lasagna|pizza|smoothies?|chips?|puree|pureed|salsa|stir[ -]?fry|medley|mix(?:ed)?|blend|cakes?|breads?|muffins?|cookies?|bagels?|wraps?|tortillas?|quiche|casserole|hummus|glaz(?:e|ed)|caramelized|saut[eé](?:ed)?|steamable|stuffed|mashed|flakes?|butter|cand(?:y|ied)|caramel(?:ized)?|chocolate|pies?|burgers?|patties|fries|hash[ -]?browns?|latkes?|poppers?|relish|chutney|jams?|jell(?:y|ies)|preserves?|seasoning|extract|concentrate|seeds?|plants?|New Zealand)\b/i;
export const stripProduceOfferBrand = stripKnownOfferBrand;
export const hasUnresolvedProduceAlternatives = hasOfferAlternatives;
export const produceOfferFoods = (title: string): string[] => Object.entries(OFFER_FOOD_TERMS).filter(([, pattern]) => pattern.test(title)).map(([food]) => food);

/** Specific summer-squash terms overlap their generic noun; other food pairs are unresolved. */
export function hasMultipleProduceFoods(title: string): boolean {
  const found = produceOfferFoods(title);
  const precise = found.filter((food) => food !== 'summer-squash' || !found.some((other) => ['zucchini', 'yellow-summer-squash'].includes(other)));
  return precise.length > 1;
}
