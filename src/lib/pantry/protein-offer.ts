import { stripKnownOfferBrand, hasOfferAlternatives } from './offer-title';

export const PROTEIN_MARKET_IDS = ['chicken-thighs-bone-in', 'pork-loin-roast-chops', 'beef-chuck-roast', 'italian-pork-sausage', 'smoked-sausage-kielbasa', 'sirloin-strip-steak', 'salmon-fillets'] as const;
export const PROTEIN_RECIPE_FOODS: Readonly<Record<string, readonly string[]>> = {
  'boneless-beef-chuck-roast-raw': ['beef-chuck-roast-boneless-raw'],
  'italian-pork-sausage-raw': ['italian-pork-sausage-raw'], 'ground-pork-raw': ['ground-pork-raw'],
  'pork-chorizo-raw': ['pork-chorizo-raw'], 'pork-sausage-raw': ['pork-sausage-raw'],
  'smoked-sausage-fully-cooked': ['smoked-sausage-fully-cooked'], 'kielbasa-fully-cooked': ['kielbasa-fully-cooked'],
  'andouille-fully-cooked': ['andouille-fully-cooked'], 'salmon-fillets-raw': ['salmon-fillets-raw'],
};
const markets = new Set<string>(PROTEIN_MARKET_IDS);
const prepared = /\b(?:breaded|battered|marinated|sauced|stuffed|canned|tinned|dried|dry|cured|jerky|salami|pepperoni|meatballs?|burgers?|sandwich(?:es)?|pizza|pasta|ravioli|tortellini|gnocchi|lasagna|soup|broth|salad|meal|dinner|kit|bowl|dip|spread|nuggets?|sticks?|glazed|teriyaki|seasoned|seasoning|salsa|partially[ -]cooked|par[ -]?cooked|half[ -]?cooked)\b/i;
const raw = /\b(?:raw|uncooked|unprepared)\b(?!\s+(?:farms?|brand|company|co\b))|\bcook before (?:eating|consuming)\b/i;
const fullyCooked = /\b(?:fully[ -]cooked|ready[ -]to[ -]eat)\b(?!\s+(?:farms?|brand|company|co\b))/i;
const cookedWord = /\b(?:cooked|roasted|grilled|rotisserie|poached|baked|fried)\b/i;
const negatedState = /\b(?:not|never)\s+(?:a\s+)?(?:fully[ -]cooked|ready[ -]to[ -]eat|raw)\b/i;
const boneIn = /\bbone[ -]in\b|\bwith\s+(?:the\s+)?bones?\b/i;
const boneless = /\bboneless\b/i;
const beef = /\bbeef\b/i, pork = /\bpork\b/i, chicken = /\bchicken\b/i;
const otherMeat = /\b(?:chicken|turkey|beef|lamb|veal|bison|venison|plant[ -]based|meatless|vegan|vegetarian)\b/i;

/** Pure title evidence only; undefined means the group is outside this reviewed protein batch. */
export function qualifiedProteinIds(marketId: string, rawTitle: string): string[] | undefined {
  if (!markets.has(marketId)) return undefined;
  if (typeof rawTitle !== 'string') return [];
  const title = stripKnownOfferBrand(rawTitle);
  // A single fully cooked sausage can contain several named meats. This is not
  // permission for unresolved alternatives between products or for pork-only raw identities.
  const alternatives = title.replace(/\b(?:pork|beef|chicken|turkey)(?:\s+(?:and|&|\+)\s+(?:pork|beef|chicken|turkey))+\b/gi, 'meat');
  const preparationTitle = ['italian-pork-sausage', 'smoked-sausage-kielbasa'].includes(marketId) && /\b(?:sausage|chorizo|kielbasa|andouille)\b/i.test(title) ? title.replace(/\bseasoned\b/gi, '') : title;
  if (prepared.test(preparationTitle) || hasOfferAlternatives(alternatives) || negatedState.test(title) || (boneIn.test(title) && boneless.test(title))) return [];
  if (/\bwith\b/i.test(title) && !/\bwith\s+(?:the\s+)?(?:skin|bones?|fat)(?:\s*(?:$|[.,()]|\d))/i.test(title)) return [];
  const isRaw = raw.test(title), isCooked = fullyCooked.test(title);
  if (isRaw === isCooked || (isRaw && cookedWord.test(title))) return [];
  if (marketId === 'chicken-thighs-bone-in') {
    if (!isRaw || !chicken.test(title) || boneless.test(title) || /\b(?:pork|beef|turkey|sausage)\b/i.test(title)) return [];
    const ids = [boneIn.test(title) && /\bthighs?\b/i.test(title) ? 'chicken-thighs-bone-in-raw' : '', /\bdrumsticks?\b/i.test(title) ? 'chicken-drumsticks-raw' : '', /\bleg\s+quarters?\b/i.test(title) ? 'chicken-leg-quarters-raw' : ''].filter(Boolean);
    return ids.length === 1 ? ids : [];
  }
  if (marketId === 'pork-loin-roast-chops') {
    if (!isRaw || !pork.test(title) || /\b(?:beef|chicken|turkey|sausage)\b/i.test(title)) return [];
    if (/\btenderloins?\b/i.test(title)) return /\b(?:chops?|roast|half\s+loin)\b/i.test(title) ? [] : ['pork-tenderloin-raw'];
    if (!boneless.test(title) || !/\bloin\b/i.test(title)) return [];
    return /\bchops?\b/i.test(title) ? ['pork-loin-chops-boneless-raw'] : /\broast\b|\bhalf\s+loin\b/i.test(title) ? ['pork-loin-roast-boneless-raw'] : [];
  }
  if (marketId === 'beef-chuck-roast') {
    if (!isRaw || !beef.test(title) || /\b(?:pork|chicken|turkey|sausage|ground|steak)\b/i.test(title)) return [];
    const arm = /\barm(?:\s+pot)?\s+roast\b/i.test(title);
    const stew = /\bstew(?:ing)?\s+meat\b|\bbeef\s+for\s+stew\b/i.test(title);
    const roast = /\broast\b/i.test(title);
    if (stew) return roast || arm ? [] : ['beef-stew-meat-raw'];
    if (!roast) return [];
    if (arm) return ['beef-arm-pot-roast-raw', 'beef-pot-roast-cut-raw'];
    if (/\bchuck\b/i.test(title)) return boneless.test(title) ? ['beef-chuck-roast-boneless-raw', 'beef-pot-roast-cut-raw'] : ['beef-pot-roast-cut-raw'];
    return /\bpot[ -]roast\b/i.test(title) ? ['beef-pot-roast-cut-raw'] : [];
  }
  if (marketId === 'italian-pork-sausage') {
    if (!isRaw || !pork.test(title) || otherMeat.test(title) || /\b(?:smoked|kielbasa|andouille)\b/i.test(title)) return [];
    const italian = /\bitalian\b/i.test(title), chorizo = /\bchorizo\b/i.test(title);
    if (italian && chorizo) return [];
    if (italian) return /\bsausage\b/i.test(title) ? ['italian-pork-sausage-raw'] : [];
    if (chorizo) return ['pork-chorizo-raw'];
    if (/\bsausage\b/i.test(title)) return ['pork-sausage-raw'];
    return /\b(?:ground|minced)\s+pork\b|\bpork\s+(?:ground|mince)\b/i.test(title) ? ['ground-pork-raw'] : [];
  }
  if (marketId === 'smoked-sausage-kielbasa') {
    const kielbasa = /\bkielbasa\b/i.test(title), andouille = /\bandouille\b/i.test(title);
    if (kielbasa && andouille) return [];
    if (kielbasa) return [isRaw ? 'kielbasa-raw' : 'kielbasa-fully-cooked'];
    if (andouille) return /\bsausage\b/i.test(title) ? [isRaw ? 'andouille-raw' : 'andouille-fully-cooked'] : [];
    return /\bsmoked\s+(?:(?:pork|beef|chicken|turkey|link)\s+)*sausage\b/i.test(title) ? [isRaw ? 'smoked-sausage-raw' : 'smoked-sausage-fully-cooked'] : [];
  }
  if (marketId === 'sirloin-strip-steak') {
    if (!isRaw || !beef.test(title) || /\b(?:pork|chicken|turkey|sausage|ground|roast)\b/i.test(title)) return [];
    const found = [ /\b(?:new\s+york|ny)\s+strip(?:\s+steak)?\b|\bstrip\s+steak\b/i.test(title) ? 'beef-new-york-strip-steak-raw' : '', /\btop\s+sirloin(?:\s+steak)?\b/i.test(title) ? 'beef-top-sirloin-steak-raw' : '', /\brib[ -]?eye(?:\s+steak)?\b/i.test(title) ? 'beef-ribeye-steak-raw' : '', /\bt[ -]bone(?:\s+steak)?\b/i.test(title) ? 'beef-t-bone-steak-raw' : '' ].filter(Boolean);
    return found.length === 1 ? found : [];
  }
  if (!isRaw || !/\bsalmon\b/i.test(title) || !/\bfilets?\b|\bfillets?\b/i.test(title) || /\b(?:smoked|whole|steaks?|pork|beef|chicken|turkey|sausage)\b/i.test(title)) return [];
  const species = ['atlantic', 'sockeye', 'coho', 'chinook', 'king', 'pink', 'chum'].filter((s) => new RegExp(`\\b${s}\\b`, 'i').test(title));
  if (species.length > 1) return [];
  return ['salmon-fillets-raw', ...species.filter((s) => ['atlantic', 'sockeye', 'coho'].includes(s)).map((s) => `${s}-salmon-fillets-raw`)];
}

export function proteinRecipeOfferAllowed(marketId: string, foods: readonly string[], title: string): boolean | undefined {
  const ids = qualifiedProteinIds(marketId, title);
  return ids === undefined ? undefined : ids.some((id) => foods.some((food) => PROTEIN_RECIPE_FOODS[food]?.includes(id)));
}

/** Search terms retain a food/cut noun; this supplies no price or ownership evidence. */
export function proteinOfferSearchTerm(title: string): string | undefined {
  if (/\bsalmon\b/i.test(title) && /\bfillets?\b|\bfilets?\b/i.test(title)) {
    const species = /\b(atlantic|sockeye|coho)(?=\s+or\b|(?:\s+salmon)?\s+(?:fillets?|filets?)\b)/i.exec(title);
    return `${species ? `${species[1]} ` : ''}salmon fillets`;
  }
  if (/\bsteak\b/i.test(title)) {
    const cut = /\b(new\s+york\s+strip|ny\s+strip|top\s+sirloin|rib[ -]?eye|t[ -]bone|strip)(?=\s+or\b|\s+steak\b)/i.exec(title);
    if (cut) return `${cut[1]} steak`;
  }
  if (/\b(?:smoked\s+sausage|kielbasa|andouille)\b/i.test(title)) return /\bkielbasa\b/i.test(title) ? 'kielbasa sausage' : /\bandouille\b/i.test(title) ? 'andouille sausage' : 'smoked sausage';
  return undefined;
}
