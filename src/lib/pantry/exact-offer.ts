import { hasOfferAlternatives, stripKnownOfferBrand } from './offer-title';

export const EXACT_OFFER_IDS = ['avocados-hass', 'chicken-breast-boneless', 'green-cabbage', 'sweet-potatoes'] as const;
const ids = new Set<string>(EXACT_OFFER_IDS);
export const requiresExactOffer = (id: string): boolean => ids.has(id);
const prepared = /\b(?:not|never|without|canned|tinned|cooked|roasted|grilled|fried|breaded|battered|stuffed|marinated|sauced|seasoned|seasoning|deli|rotisserie|soup|salad|kit|dressing|with|dip|spread|juice|oil|guacamole|toast|pizza|meal|dinner|pie|chips?|fries|mashed|puree|kimchi|sauerkraut|powder|plants?|seeds?)\b/i;
const common = new Set('fresh raw plain organic whole large medium small jumbo head heads bag bagged value family pack package lb lbs pound pounds oz ounce ounces g kg ct count each unprepared'.split(' '));
const words: Readonly<Record<string, ReadonlySet<string>>> = {
  'avocados-hass': new Set('hass avocado avocados'.split(' ')),
  'chicken-breast-boneless': new Set('frozen chilled raw uncooked unprepared boneless skinless chicken breast breasts cook before eating consuming'.split(' ')),
  'green-cabbage': new Set('green cabbage cut shredded sliced chopped diced'.split(' ')),
  'sweet-potatoes': new Set('sweet potato potatoes sweetpotato sweetpotatoes garnet yam yams cut diced sliced chopped'.split(' ')),
};

/** undefined leaves unrelated foods alone. Evidence is the original title, never its group label. */
export function exactOfferAllowed(id: string, rawTitle: string): boolean | undefined {
  if (!requiresExactOffer(id)) return undefined;
  if (typeof rawTitle !== 'string') return false;
  let title = stripKnownOfferBrand(rawTitle).replace(/[‐‑–]/g, '-');
  if (prepared.test(title)) return false;
  if (id === 'chicken-breast-boneless') {
    title = title.replace(/\bboneless\s*(?:and|&)\s*skinless\b/gi, 'boneless skinless');
  } else {
    if (/\bfrozen\b/i.test(title)) return false;
    if (id === 'avocados-hass') title = title.replace(/\blarge\s+or\s+bagged\b/gi, 'large bagged');
    if (id === 'sweet-potatoes' && /\byams?\b/i.test(title)) {
      // One explicit retail label, not an alternative or a true-yam conversion.
      const labeled = /^(?:fresh\s+|organic\s+|raw\s+)*(?:garnet\s+)?yams?\s*\(\s*sweet\s*potatoes?\s*\)(?:\s*\d+\s*(?:lb|oz|ct))?$/i;
      if (!labeled.test(title)) return false;
    }
  }
  if (hasOfferAlternatives(title) || (title.toLowerCase().match(/\p{L}+/gu) ?? []).some((w) => !common.has(w) && !words[id].has(w))) return false;
  if (id === 'avocados-hass') return /\bhass\s+avocados?\b/i.test(title);
  if (id === 'green-cabbage') return /\bgreen\s+cabbage\b/i.test(title);
  if (id === 'sweet-potatoes') return /\bsweet[ -]?potato(?:es)?\b/i.test(title);
  return /\bchicken\s+breasts?\b/i.test(title) && /\bboneless\b/i.test(title) && /\bskinless\b/i.test(title) &&
    /\b(?:raw|uncooked|unprepared)\b|\bcook before (?:eating|consuming)\b/i.test(title);
}

/** Group-derived regular estimates are not same-product price evidence. */
export function exactComparisonOffer<T extends { canonicalIngredientId: string; normalizedPricePerUnit: number; regularPricePerUnit: number; regularPriceEvidence?: string }>(offer: T): T {
  return requiresExactOffer(offer.canonicalIngredientId) && offer.regularPriceEvidence !== 'OBSERVED_SAME_PRODUCT' ? { ...offer, regularPricePerUnit: offer.normalizedPricePerUnit } : offer;
}
