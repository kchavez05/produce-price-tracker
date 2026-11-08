import { hasOfferAlternatives, stripKnownOfferBrand } from './offer-title';

export const DAIRY_MARKET_IDS = ['shredded-block-cheese', 'cottage-cheese-sour-cream', 'greek-yogurt-tub'] as const;
export const DAIRY_RECIPE_FOODS = new Set(['cheddar-cheese', 'monterey-jack-cheese', 'mexican-style-cheese-blend', 'cottage-cheese-plain', 'sour-cream-plain', 'sour-cream-full-fat', 'greek-yogurt-plain-whole-milk']);
const markets = new Set<string>(DAIRY_MARKET_IDS);
const incompatible = /\b(?:plant[ -]based|dairy[ -]free|non[ -]dairy|vegan|processed|imitation|alternative|analogue|spread|sauce|dip|soup|meal|dinner|pizza|pasta|macaroni|breaded|battered|sticks?|crackers?|frozen|thawed|drink|smoothie|dessert|ice[ -]cream|dry[ -]curds?|dry\s+curd|with|pepper\s+jack|colby(?:\s+jack)?|jalape[nñ]o|seasoned|flavored|flavoured|fruit|strawberry|blueberry|raspberry|pineapple|peach|cherry|lemon|maple|honey|chocolate|caramel|herbs?|garlic|onion|not|never)\b/i;
const whole = /\b(?:whole[ -]milk|full[ -]fat)\b(?!\s+(?:farms?|brand|company)\b)/i;
const low = /\b(?:low[ -]?fat|reduced[ -]fat|less\s+fat|light)\b(?!\s+(?:farms?|brand|company)\b)/i;
const nonfat = /\b(?:non[ -]?fat|fat[ -]?free)\b|\b0\s*%/i;
const percent = (title: string, n: number) => new RegExp(`\\b${n}\\s*(?:%|percent\\b)`, 'i').test(title);
const titleWords = new Set(('plain whole milk full fat free regular light low lowfat reduced less nonfat non fatfree part skim creamed wet curd large small percent block shredded shredding melting fresh moisture unspecified natural cheddar cheese monterey jack mozzarella mexican style blend greek yogurt vanilla cottage sour cream mild sharp extra organic dairy solid balls package tub bag lb lbs oz ounce ounces pound pounds g kg gram grams pack ct count value family size grade a probiotic live active cultures unsweetened no added sugar zero protein total filtered strained cultured traditional').split(' '));

/** Original title evidence only. These possible foods never create pantry ownership. */
export function qualifiedDairyIds(marketId: string, rawTitle: string): string[] | undefined {
  if (!markets.has(marketId)) return undefined;
  if (typeof rawTitle !== 'string') return [];
  const title = stripKnownOfferBrand(rawTitle).replace(/^(?:daisy|lucerne|knudsen|fage|chobani|oikos)\b\s*/i, '').replace(/[‐‑–]/g, '-');
  if (incompatible.test(title) || hasOfferAlternatives(title)) return [];
  // Unknown food/flavor words are uncertain evidence, even beside the word "plain".
  // Keep such offers unpriced instead of trying to enumerate every flavored product.
  if ((title.toLowerCase().match(/\p{L}+/gu) ?? []).some((word) => !titleWords.has(word)) || /\bno\s+(?:whole|full|low|nonfat|plain|vanilla)\b/i.test(title)) return [];
  if (/\b(?:bars?|coated|covered|pretzels?|cookies?|cakes?|frosting|granola|parfait|custard|pudding|ricotta|cream\s+cheese|feta|parmesan|swiss|brie|gouda)\b/i.test(title)) return [];
  // A title naming a second dairy food cannot lend its fat/flavor evidence to the first.
  if (marketId === 'shredded-block-cheese' && /\byogurt\b|\bcottage\s+cheese\b|\bsour\s+cream\b/i.test(title)) return [];
  if (marketId === 'cottage-cheese-sour-cream' && /\byogurt\b|\b(?:cheddar|monterey|mozzarella)\b/i.test(title)) return [];
  if (marketId === 'greek-yogurt-tub' && /\bcheese\b|\bsour\s+cream\b/i.test(title)) return [];
  const full = whole.test(title), reduced = low.test(title), zero = nonfat.test(title);
  if (Number(full) + Number(reduced) + Number(zero) > 1) return [];
  if (marketId === 'shredded-block-cheese') {
    if (!/\bcheese\b/i.test(title) && !/\bmozzarella\b/i.test(title)) return [];
    const cheddar = /\bcheddar\b/i.test(title), jack = /\bmonterey\s+jack\b/i.test(title), mozzarella = /\bmozzarella\b/i.test(title), blend = /\bblend\b/i.test(title);
    if (Number(cheddar) + Number(jack) + Number(mozzarella) + Number(blend) !== 1) return [];
    if (cheddar || jack) return reduced || zero || percent(title, 1) || percent(title, 2) ? [] : [cheddar ? 'cheddar-cheese' : 'monterey-jack-cheese'];
    if (blend) {
      if (reduced || zero) return [];
      if (/\bmexican[ -]?(?:style)?\b/i.test(title)) return ['melting-cheese-blend', 'mexican-style-cheese-blend'];
      return /\b(?:melting|shredding)\b/i.test(title) ? ['melting-cheese-blend'] : [];
    }
    const fresh = /\bfresh\b/i.test(title), lowMoisture = /\blow[ -]moisture\b/i.test(title), skim = /\bpart[ -]skim\b/i.test(title);
    if ((fresh && lowMoisture) || (full && skim) || reduced || zero) return [];
    if (fresh) return ['mozzarella-fresh'];
    if (!lowMoisture) return ['mozzarella-cheese-unspecified'];
    return ['mozzarella-low-moisture', ...(full ? ['mozzarella-low-moisture-whole-milk'] : skim ? ['mozzarella-low-moisture-part-skim'] : [])];
  }
  if (marketId === 'cottage-cheese-sour-cream') {
    const cottage = /\bcottage\s+cheese\b/i.test(title), sour = /\bsour\s+cream\b/i.test(title);
    if (cottage === sour) return [];
    if (sour) {
      const regular = /\bregular\b/i.test(title);
      if (regular && (reduced || zero)) return [];
      return ['sour-cream-plain', ...(full || regular ? ['sour-cream-full-fat'] : reduced ? ['sour-cream-reduced-fat'] : [])];
    }
    if (!/\bplain\b/i.test(title)) return [];
    const percentages = new Set([...title.matchAll(/\b(\d+(?:\.\d+)?)\s*(?:%|percent\b)/gi)].map((m) => Number(m[1])));
    if (percentages.size > 1 || (zero && [...percentages].some((n) => n > 0))) return [];
    const one = percent(title, 1), two = percent(title, 2), creamed = /\b(?:creamed|regular)\b/i.test(title);
    if (Number(one) + Number(two) + Number(creamed) > 1 || ((full || zero) && (one || two)) || (zero && creamed) || (reduced && creamed)) return [];
    return ['cottage-cheese-plain', ...(one ? ['cottage-cheese-plain-1-percent'] : two ? ['cottage-cheese-plain-2-percent'] : creamed ? ['cottage-cheese-creamed'] : [])];
  }
  if (!/\bgreek\s+yogurt\b/i.test(title)) return [];
  if (full && (percent(title, 1) || percent(title, 2))) return [];
  const plain = /\bplain\b/i.test(title), vanilla = /\bvanilla\b/i.test(title);
  if (plain === vanilla) return [];
  const id = plain ? 'greek-yogurt-plain' : 'greek-yogurt-vanilla';
  return [id, ...(full && plain ? [`${id}-whole-milk`] : reduced ? [`${id}-lowfat`] : zero ? [`${id}-nonfat`] : [])];
}

export function dairyRecipeOfferAllowed(marketId: string, foods: readonly string[], title: string): boolean | undefined {
  const ids = qualifiedDairyIds(marketId, title);
  return ids === undefined ? undefined : ids.some((id) => foods.includes(id) && DAIRY_RECIPE_FOODS.has(id));
}

/** Preserve dairy nouns and reviewed qualifiers in pickup searches, never as price proof. */
export function dairyOfferSearchTerm(title: string): string | undefined {
  if (/\bcottage\s+cheese\b/i.test(title)) return `${/\bplain\b/i.test(title) ? 'plain ' : ''}cottage cheese`;
  if (/\bsour\s+cream\b/i.test(title)) return `${whole.test(title) ? 'full-fat ' : ''}sour cream`;
  if (/\bgreek\s+yogurt\b/i.test(title)) return `${/\bvanilla\b/i.test(title) ? 'vanilla ' : /\bplain\b/i.test(title) ? 'plain ' : ''}${whole.test(title) ? 'whole-milk ' : ''}Greek yogurt`;
  if (/\bcheddar\b/i.test(title)) return 'cheddar cheese';
  if (/\bmonterey\s+jack\b/i.test(title)) return 'Monterey Jack cheese';
  if (/\bmexican[ -]?(?:style)?\b/i.test(title) && /\bblend\b/i.test(title)) return 'Mexican-style cheese blend';
  if (/\bmozzarella\b/i.test(title)) return `${/\blow[ -]moisture\b/i.test(title) ? 'low-moisture ' : /\bfresh\b/i.test(title) ? 'fresh ' : ''}mozzarella cheese`;
  return undefined;
}
