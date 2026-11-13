import { resolveStoreBanner } from '@/data/store-registry';
import { offerFoodSearchTerm } from '@/lib/pantry/offer-food';
import {
  AggregatedShoppingItem,
  CommodityCategory,
  DealType,
  RecommendedDish,
  StoreChain,
  StoreTripComparison,
} from '@/types/domain';

export type CurbsideProvider =
  | StoreChain
  | 'INSTACART';

export interface CurbsideDeepLink {
  provider: CurbsideProvider;
  label: string;
  shortLabel: string;
  url: string;
  brandColor: string;
}

/**
 * Generates clean search terms from a canonical ingredient name
 * (e.g., "Russet or Yukon Gold Potatoes (5 lb Bag)" -> "russet potatoes 5 lb")
 */
export function cleanSearchQueryForIngredient(rawName: string): string {
  const primary = rawName
    .replace(/\([^)]*\)/g, '')
    .replace(/\s+or\s+.*/i, '')
    .replace(/\s*\/\s*.*/g, '')
    .trim();
  // "Kroger Whole or Sliced Baby Bella / White Mushrooms" must not become
  // "Kroger Whole". Preserve legacy queries when they already name the food.
  return offerFoodSearchTerm(primary) ? primary : offerFoodSearchTerm(rawName) ?? primary;
}

/**
 * Resolves the localized Kroger family web domain for a given ZIP code.
 */
function resolveKrogerDomain(zipCode: string = '80542'): string {
  const banner = resolveStoreBanner('KING_SOOPERS', zipCode).toLowerCase();
  if (banner.includes('king soopers')) return 'https://www.kingsoopers.com';
  if (banner.includes('ralphs')) return 'https://www.ralphs.com';
  if (banner.includes('fred meyer')) return 'https://www.fredmeyer.com';
  if (banner.includes('fry')) return 'https://www.frysfood.com';
  if (banner.includes('smith')) return 'https://www.smithsfoodanddrug.com';
  if (banner.includes('dillons')) return 'https://www.dillons.com';
  if (banner.includes('qfc')) return 'https://www.qfc.com';
  if (banner.includes('city market')) return 'https://www.citymarket.com';
  return 'https://www.kroger.com';
}

/**
 * Resolves the localized Albertsons / Safeway family web domain for a given ZIP code.
 */
function resolveAlbertsonsDomain(zipCode: string = '80542'): string {
  const banner = resolveStoreBanner('SAFEWAY', zipCode).toLowerCase();
  if (banner.includes('vons')) return 'https://www.vons.com';
  if (banner.includes('jewel')) return 'https://www.jewelosco.com';
  if (banner.includes('albertsons')) return 'https://www.albertsons.com';
  if (banner.includes('tom thumb')) return 'https://www.tomthumb.com';
  if (banner.includes('randalls')) return 'https://www.randalls.com';
  if (banner.includes('shaw')) return 'https://www.shaws.com';
  if (banner.includes('acme')) return 'https://www.acmemarkets.com';
  return 'https://www.safeway.com';
}

/**
 * Builds a store-specific 1-tap curbside pickup / grocery search URL for an ingredient.
 */
export function buildStoreSearchUrl(
  provider: CurbsideProvider,
  ingredientName: string,
  zipCode: string = '80542'
): CurbsideDeepLink {
  const query = cleanSearchQueryForIngredient(ingredientName);
  const encoded = encodeURIComponent(query);

  switch (provider) {
    case 'WALMART':
      return {
        provider: 'WALMART',
        label: 'Walmart Curbside Pickup',
        shortLabel: 'Walmart Pickup',
        url: `https://www.walmart.com/search?q=${encoded}&facet=fulfillment_method_in_store%3APickup`,
        brandColor: '#0071DC',
      };
    case 'TARGET':
      return {
        provider: 'TARGET',
        label: 'Target Drive Up',
        shortLabel: 'Target Drive Up',
        url: `https://www.target.com/s?searchTerm=${encoded}`,
        brandColor: '#CC0000',
      };
    case 'KING_SOOPERS': {
      const bannerName = resolveStoreBanner('KING_SOOPERS', zipCode);
      const base = resolveKrogerDomain(zipCode);
      return {
        provider: 'KING_SOOPERS',
        label: `${bannerName} Pickup`,
        shortLabel: `${bannerName} Pickup`,
        url: `${base}/search?query=${encoded}&searchType=default_search`,
        brandColor: '#0055A5',
      };
    }
    case 'SAFEWAY': {
      const bannerName = resolveStoreBanner('SAFEWAY', zipCode);
      const base = resolveAlbertsonsDomain(zipCode);
      return {
        provider: 'SAFEWAY',
        label: `${bannerName} DriveUp & Go`,
        shortLabel: `${bannerName} Pickup`,
        url: `${base}/shop/search-results.html?q=${encoded}`,
        brandColor: '#E31837',
      };
    }
    case 'SPROUTS':
      return {
        provider: 'SPROUTS',
        label: 'Sprouts Curbside',
        shortLabel: 'Sprouts Shop',
        url: `https://shop.sprouts.com/search?search_term=${encoded}`,
        brandColor: '#1E5631',
      };
    case 'ALDI':
      return {
        provider: 'ALDI',
        label: 'ALDI Curbside',
        shortLabel: 'ALDI Curbside',
        url: `https://new.aldi.us/results?q=${encoded}`,
        brandColor: '#0A2540',
      };
    case 'INSTACART':
    default:
      return {
        provider: 'INSTACART',
        label: 'Instacart Express',
        shortLabel: 'Instacart',
        url: `https://www.instacart.com/store/s?k=${encoded}`,
        brandColor: '#003D29',
      };
  }
}

/**
 * Returns the primary store curbside link + quick secondary links (Walmart, Target, Kroger, Instacart)
 * for any shopping list row.
 */
export function getItemCurbsideLinks(
  activeStore: StoreChain,
  ingredientName: string,
  zipCode: string = '80542'
): {
  primaryLink: CurbsideDeepLink;
  bridgeLinks: CurbsideDeepLink[];
} {
  const primaryLink = buildStoreSearchUrl(activeStore, ingredientName, zipCode);
  const providers: CurbsideProvider[] = [
    activeStore,
    'KING_SOOPERS',
    'WALMART',
    'TARGET',
    'INSTACART',
  ];
  const seen = new Set<CurbsideProvider>();
  const bridgeLinks: CurbsideDeepLink[] = [];

  for (const p of providers) {
    if (seen.has(p)) continue;
    seen.add(p);
    bridgeLinks.push(buildStoreSearchUrl(p, ingredientName, zipCode));
  }

  return { primaryLink, bridgeLinks };
}

export interface ResolvedExportItem extends AggregatedShoppingItem {
  activeStore: StoreChain;
  activeUnitCost: number;
  activeTotalCost: number;
  activeRawDealText: string;
  activeDealType: DealType;
  activeDealConditions?: string;
}

const AISLE_META: {
  category: CommodityCategory;
  title: string;
  emoji: string;
}[] = [
  { category: 'PRODUCE', title: 'Fresh Produce Aisle', emoji: '🥬' },
  { category: 'PROTEIN', title: 'Meat, Poultry & Seafood Counter', emoji: '🥩' },
  { category: 'DAIRY_EGGS', title: 'Dairy & Eggs Wall', emoji: '🧀' },
];

/**
 * Formats the active shopping list, digital coupon pre-flight checklist, and pantry staples
 * into a clean, checklist-ready plain text / Markdown string for Apple Notes, Google Keep,
 * iOS Reminders, or SMS/Slack (v1.2 Ticket #23).
 */
export function formatShoppingListForClipboard(options: {
  items: ResolvedExportItem[];
  pantryChecklist: string[];
  tripComparison: StoreTripComparison;
  activeTrio: RecommendedDish[];
  zipCode: string;
  cityLabel: string;
  tripMode: 'SPLIT' | StoreChain;
  checkedItems?: Record<string, boolean>;
}): string {
  const {
    items,
    pantryChecklist,
    tripComparison,
    activeTrio,
    zipCode,
    cityLabel,
    tripMode,
    checkedItems = {},
  } = options;

  const lines: string[] = [];
  const modeLabel =
    tripMode === 'SPLIT'
      ? `Optimal Split (${tripComparison.bestTwoStoreSplit?.storeNames.join(' + ') || 'Multi-Store'})`
      : `1-Stop at ${resolveStoreBanner(tripMode, zipCode)}`;

  const activeTotal =
    tripMode === 'SPLIT'
      ? tripComparison.bestTwoStoreSplit?.total ?? tripComparison.optimalSplitTotal
      : tripComparison.storeTotals?.[tripMode] ?? tripComparison.bestSingleStoreTotal;

  lines.push(`🛒 PANTRYBOT WEEKEND SHOPPING CHECKLIST`);
  lines.push(`📍 ${cityLabel} (${zipCode}) • Strategy: ${modeLabel}`);
  lines.push(`Estimated additional grocery cost: $${activeTotal.toFixed(2)}${tripComparison.additionalCostEstimateComplete !== true ? ' known subtotal — plus unpriced ingredients' : ''}`);
  lines.push('Assumes ingredients marked Yes are on hand. Staple rows identify the price basis; package checkout totals may differ.');
  lines.push('');

  lines.push(`🍲 3-DISH WEEKEND MEAL PREP TRIO:`);
  activeTrio.forEach((d, idx) => {
    lines.push(
      `  ${idx + 1}. ${d.title} (${d.servings} srv • $${d.costPerServing.toFixed(2)}/srv • ${d.macrosPerServing?.proteinGrams || 40}g Protein)`
    );
  });
  lines.push('');

  const coupons = items.filter(
    (i) =>
      !i.isOnHand &&
      (i.activeDealType === 'DIGITAL_COUPON' || i.activeDealType === 'MULTI_BUY')
  );
  if (coupons.length > 0) {
    lines.push(`📱 PRE-FLIGHT DIGITAL COUPONS TO CLIP (${coupons.length}):`);
    for (const c of coupons) {
      const storeName = resolveStoreBanner(c.activeStore, zipCode);
      lines.push(
        `- [ ] [${storeName}] ${c.ingredientName}: ${c.activeRawDealText}${c.activeDealConditions ? ` (${c.activeDealConditions})` : ''}`
      );
    }
    lines.push('');
  }

  for (const aisle of AISLE_META) {
    const aisleItems = items.filter(
      (i) => i.category === aisle.category && !i.isOnHand
    );
    if (aisleItems.length === 0) continue;

    lines.push(`${aisle.emoji} ${aisle.title.toUpperCase()} (${aisleItems.length}):`);
    for (const item of aisleItems) {
      const box = checkedItems[item.ingredientId] ? '[x]' : '[ ]';
      const storeName = resolveStoreBanner(item.activeStore, zipCode);
      const couponTag =
        item.activeDealType === 'DIGITAL_COUPON'
          ? ' 📱[CLIP APP COUPON]'
          : item.activeDealType === 'MULTI_BUY'
            ? ' 🔢[MULTI-BUY]'
            : '';
      lines.push(
        `- ${box} ${item.ingredientName} — ${item.totalQuantityNeeded} ${item.unit} @ ${storeName} ($${item.activeTotalCost.toFixed(2)} | ${item.activeRawDealText})${couponTag}`
      );
    }
    lines.push('');
  }

  const onHandItems = items.filter((i) => i.isOnHand);
  if (onHandItems.length > 0) {
    lines.push('ALREADY HAVE (omitted from shopping needs):');
    for (const item of onHandItems) {
      lines.push(
        `- [x] ${item.ingredientName} (${item.totalQuantityNeeded} ${item.unit} — Already On-Hand)`
      );
    }
    lines.push('');
  }

  if (pantryChecklist.length > 0) {
    lines.push(
      `STAPLES TO BUY (recipe-use estimates: $${tripComparison.estimatedPantryTotal.toFixed(2)}):`
    );
    for (const p of pantryChecklist) {
      const box = checkedItems[`pantry-${p}`] ? '[x]' : '[ ]';
      lines.push(`- ${box} ${p}`);
    }
  }

  return lines.join('\n');
}
