import { sourceDate } from '@/lib/offer-freshness';
import { CANONICAL_INGREDIENTS } from '@/data/canonical-ingredients';
import { resolveStoreBanner } from '@/data/store-registry';
import { CanonicalIngredient, DealType, StoreChain, StoreOffer } from '@/types/domain';

interface FlippSearchItem {
  id?: number | string;
  name?: string;
  description?: string;
  merchant_name?: string;
  current_price?: number | string | null;
  pre_price_text?: string | null;
  price_text?: string | null;
  sale_story?: string | null;
  valid_from?: string;
  valid_to?: string;
  clean_image_url?: string;
}

/**
 * Extracts effective single-package/single-item price from multi-buy or BOGO text
 * if rawPrice reflects a bundle total, or when "N for $M" is present.
 */
export function resolveEffectiveUnitPrice(
  rawPrice: number,
  combinedText: string,
  typicalRegularPrice: number
): { effectiveItemPrice: number; multiBuyQty?: number } {
  const lower = combinedText.toLowerCase();

  // Check BOGO ("buy 1 get 1 free" or "bogo")
  if (lower.includes('buy 1 get 1 free') || lower.includes('buy one get one free') || /\bbogo\b/.test(lower)) {
    const base = rawPrice > 0 ? rawPrice : typicalRegularPrice;
    return {
      effectiveItemPrice: Number((base / 2).toFixed(2)),
      multiBuyQty: 2,
    };
  }

  // Check "N for $M" or "N/$M" pattern (e.g. "4 for $5", "2 for $3.00", "3/$6")
  const nForM = lower.match(/\b(\d+)\s*(?:for|\/)\s*\$?(\d+(?:\.\d+)?)\b/);
  if (nForM) {
    const qty = parseInt(nForM[1], 10);
    const bundleTotal = parseFloat(nForM[2]);
    if (qty >= 2 && qty <= 20 && bundleTotal > 0) {
      const perItem = Number((bundleTotal / qty).toFixed(2));
      // If Flipp passed bundleTotal as rawPrice (e.g. 5.00 for "4 for $5"), use perItem
      if (Math.abs(rawPrice - bundleTotal) < 0.05 || Math.abs(rawPrice - perItem) < 0.05) {
        return {
          effectiveItemPrice: perItem,
          multiBuyQty: qty,
        };
      }
    }
  }

  return { effectiveItemPrice: rawPrice };
}

/**
 * Normalizes a raw flyer price and title/story into a per-unit ($/lb or $/doz) figure.
 */
export function normalizeFlyerPrice(
  rawPrice: number,
  combinedText: string,
  ingredient: CanonicalIngredient
): { normalizedPricePerUnit: number; saleUnit: string; effectiveSalePrice: number } {
  const lower = combinedText.toLowerCase();
  const { effectiveItemPrice } = resolveEffectiveUnitPrice(
    rawPrice,
    lower,
    ingredient.typicalRegularPerUnit
  );

  if (ingredient.standardUnit === 'doz') {
    if (lower.includes('18 ct') || lower.includes('18 count')) {
      return {
        normalizedPricePerUnit: Number(((effectiveItemPrice / 18) * 12).toFixed(2)),
        saleUnit: '18 ct',
        effectiveSalePrice: effectiveItemPrice,
      };
    }
    return {
      normalizedPricePerUnit: Number(effectiveItemPrice.toFixed(2)),
      saleUnit: 'doz',
      effectiveSalePrice: effectiveItemPrice,
    };
  }

  // Check explicit bag weight e.g. "5 lb", "3 lb", "2 lb", "10 lb"
  const lbBagMatch = lower.match(
    /(?<![\d.\$])(\d+(?:\.\d+)?)\s*(?:lb\.?|pound)s?\s*(?:bag|pack|roll|box|chub)?/
  );
  const isExplicitPerLb =
    lower.includes('/lb') ||
    lower.includes('per lb') ||
    /\/\s*lb\b/.test(lower) ||
    /\$\d+(?:\.\d+)?\s*lb\.?\b/.test(lower);

  if (lbBagMatch && !isExplicitPerLb) {
    const lbs = parseFloat(lbBagMatch[1]);
    if (lbs > 1 && lbs <= 15) {
      return {
        normalizedPricePerUnit: Number((effectiveItemPrice / lbs).toFixed(2)),
        saleUnit: `${lbs} lb bag`,
        effectiveSalePrice: effectiveItemPrice,
      };
    }
  }

  // Check ounce package e.g. "8 oz", "16 oz", "14 oz", "32 oz", "10 oz"
  const ozMatch = lower.match(/(\d+(?:\.\d+)?)\s*oz/);
  if (ozMatch && !isExplicitPerLb) {
    const oz = parseFloat(ozMatch[1]);
    if (oz >= 4 && oz <= 64) {
      const lbs = oz / 16;
      return {
        normalizedPricePerUnit: Number((effectiveItemPrice / lbs).toFixed(2)),
        saleUnit: `${oz} oz`,
        effectiveSalePrice: effectiveItemPrice,
      };
    }
  }

  // Check if explicitly per lb
  if (isExplicitPerLb) {
    return {
      normalizedPricePerUnit: Number(effectiveItemPrice.toFixed(2)),
      saleUnit: 'lb',
      effectiveSalePrice: effectiveItemPrice,
    };
  }

  // Check if sold by each/count
  if (
    lower.includes('/ea') ||
    lower.includes('each') ||
    /\b\d+\s*(?:for|\/)\s*\$?\d+/.test(lower) ||
    ingredient.avgEachWeightLb < 0.8
  ) {
    const estLb = Math.max(0.2, ingredient.avgEachWeightLb);
    return {
      normalizedPricePerUnit: Number((effectiveItemPrice / estLb).toFixed(2)),
      saleUnit: 'ea',
      effectiveSalePrice: effectiveItemPrice,
    };
  }

  return {
    normalizedPricePerUnit: Number(effectiveItemPrice.toFixed(2)),
    saleUnit: ingredient.standardUnit,
    effectiveSalePrice: effectiveItemPrice,
  };
}

/**
 * Classifies the deal type and extracts coupon/quantity limit strings (e.g. "Limit 5", "Must buy 3").
 */
export function detectDealType(
  combinedText: string,
  store?: StoreChain
): {
  dealType: DealType;
  dealConditions?: string;
} {
  const lower = combinedText.toLowerCase();

  // Extract explicit limit if present (e.g., "limit 5", "up to 2")
  const limitMatch = lower.match(/\b(?:limit|up to)\s+(\d+)\b/);
  const limitSuffix = limitMatch ? ` (Limit ${limitMatch[1]})` : '';

  // 1. Digital Coupon check
  if (
    lower.includes('digital') ||
    lower.includes('clip') ||
    lower.includes('for u') ||
    lower.includes('coupon') ||
    lower.includes('circle')
  ) {
    const couponApp =
      store === 'TARGET'
        ? 'Target Circle in app'
        : store === 'SAFEWAY'
          ? 'Safeway for U in app'
          : store === 'SPROUTS'
            ? 'Sprouts App coupon'
            : 'store app';
    return {
      dealType: 'DIGITAL_COUPON',
      dealConditions: `Clip Digital Coupon in ${couponApp}${limitSuffix}`,
    };
  }

  // 2. Mandatory Multi-Buy check ("must buy 3", "when you buy 4", "buy 1 get 1 free")
  const mandatoryBuyMatch = lower.match(/\b(?:must buy|when you buy)\s+(\d+)\b/);
  if (
    mandatoryBuyMatch ||
    lower.includes('buy 1 get 1 free') ||
    lower.includes('buy one get one free') ||
    /\bbogo\b/.test(lower)
  ) {
    const minQty = mandatoryBuyMatch ? mandatoryBuyMatch[1] : '2';
    return {
      dealType: 'MULTI_BUY',
      dealConditions: `Must buy ${minQty} or more to get unit promo price${limitSuffix}`,
    };
  }

  // 3. Store-specific Everyday Low Price (ALDI & Walmart)
  if (store === 'ALDI') {
    return {
      dealType: 'EVERYDAY_LOW',
      dealConditions: `Everyday ALDI Low Price${limitSuffix}`,
    };
  }
  if (store === 'WALMART' || lower.includes('rollback') || lower.includes('great value')) {
    return {
      dealType: 'EVERYDAY_LOW',
      dealConditions: `Walmart Rollback / Everyday Low Price${limitSuffix}`,
    };
  }

  // 4. Standard Shelf / Loyalty Card Member Sale (including pro-rated "2 for $5 with Card")
  return {
    dealType: 'SHELF_OR_MEMBER',
    dealConditions: `With Store Loyalty Card at Checkout${limitSuffix}`,
  };
}

/**
 * Queries the public Flipp circular endpoint for a given postal_code
 * across national and regional chains (Kroger, Safeway, ALDI, Walmart, Target, Sprouts)
 * and maps matches to CanonicalIngredients.
 */
export async function fetchLiveFlippOffers(
  zipCode: string = '80542'
): Promise<{ offers: StoreOffer[]; liveSuccess: boolean }> {
  // The visual snapshot server sets PANTRYBOT_LIVE_OFFERS=off so every render uses the curated weekly baseline, with no
  // network and no refreshed circular data (#796). Unset (the default, and all of production), live offers are fetched.
  if (process.env.PANTRYBOT_LIVE_OFFERS === 'off') return { offers: [], liveSuccess: false };
  const matchedOffers: StoreOffer[] = [];
  let liveSuccess = false;

  try {
    const queries = [
      'King Soopers',
      'Kroger',
      'Safeway',
      'Albertsons',
      'Aldi',
      'Walmart',
      'Target',
      'Sprouts',
    ];
    const responses = await Promise.allSettled(
      queries.map(async (merchantQuery) => {
        const url = `https://backflipp.wishabi.com/flipp/items/search?locale=en-us&postal_code=${encodeURIComponent(
          zipCode
        )}&q=${encodeURIComponent(merchantQuery)}`;
        const res = await fetch(url, {
          headers: {
            Accept: 'application/json',
            'User-Agent': 'PantryBot/1.1 (Commodity-MealPrep-Tracker)',
          },
          cache: 'no-store',
          signal: AbortSignal.timeout(3500),
        });
        if (!res.ok) return [];
        const data = await res.json();
        return (data?.items || []) as FlippSearchItem[];
      })
    );

    const allItems = responses.flatMap((result) => result.status === 'fulfilled' ? result.value : []);
    if (allItems.length > 0) {
      liveSuccess = true;
    }

    for (const item of allItems) {
      const merchant = (item.merchant_name || '').toLowerCase();
      let store: StoreChain | null = null;

      if (merchant.includes('aldi')) {
        store = 'ALDI';
      } else if (merchant.includes('walmart')) {
        store = 'WALMART';
      } else if (merchant.includes('target')) {
        store = 'TARGET';
      } else if (merchant.includes('sprouts')) {
        store = 'SPROUTS';
      } else if (
        merchant.includes('king soopers') ||
        merchant.includes('kroger') ||
        merchant.includes('ralphs') ||
        merchant.includes('fred meyer') ||
        merchant.includes("fry's") ||
        merchant.includes('smith') ||
        merchant.includes('dillons') ||
        merchant.includes('qfc') ||
        merchant.includes('city market')
      ) {
        store = 'KING_SOOPERS';
      } else if (
        merchant.includes('safeway') ||
        merchant.includes('albertsons') ||
        merchant.includes('vons') ||
        merchant.includes('jewel') ||
        merchant.includes('tom thumb') ||
        merchant.includes('randalls') ||
        merchant.includes('shaw') ||
        merchant.includes('acme')
      ) {
        store = 'SAFEWAY';
      }
      if (!store) continue;

      const rawPrice =
        typeof item.current_price === 'number'
          ? item.current_price
          : typeof item.current_price === 'string'
            ? parseFloat(item.current_price)
            : NaN;

      if (isNaN(rawPrice) || rawPrice <= 0.15 || rawPrice > 35) continue;

      const title = (item.name || '').trim();
      const story = [item.description, item.sale_story, item.pre_price_text, item.price_text]
        .filter(Boolean)
        .join(' ');
      const fullText = `${title} ${story}`.toLowerCase();

      for (const ingredient of CANONICAL_INGREDIENTS) {
        const hasExclude = (ingredient.excludeKeywords || []).some((ex) =>
          fullText.includes(ex.toLowerCase())
        );
        if (hasExclude) continue;

        const hasKeyword = ingredient.matchKeywords.some((kw) =>
          fullText.includes(kw.toLowerCase())
        );
        if (!hasKeyword) continue;

        const { normalizedPricePerUnit, saleUnit, effectiveSalePrice } = normalizeFlyerPrice(
          rawPrice,
          fullText,
          ingredient
        );

        // Sanity bounds so a random processed side item doesn't skew per-lb price
        if (
          normalizedPricePerUnit < ingredient.mountainBaselinePerUnit * 0.22 ||
          normalizedPricePerUnit > ingredient.typicalRegularPerUnit * 1.35
        ) {
          continue;
        }

        const { dealType, dealConditions } = detectDealType(fullText, store);
        const bannerName = resolveStoreBanner(store, zipCode, item.merchant_name);
        const storeLocationLabel = item.merchant_name
          ? `${bannerName} (${item.merchant_name})`
          : `${bannerName} (${zipCode} Circular)`;

        matchedOffers.push({
          id: `flipp-${store.toLowerCase()}-${ingredient.id}-${item.id || Math.random()}`,
          canonicalIngredientId: ingredient.id,
          store,
          storeLocationLabel,
          rawTitle: title,
          rawPriceText: `$${effectiveSalePrice.toFixed(2)} / ${saleUnit}${
            story ? ` (${story.slice(0, 50)})` : ''
          }`,
          salePrice: effectiveSalePrice,
          saleUnit,
          normalizedPricePerUnit,
          regularPricePerUnit: ingredient.typicalRegularPerUnit,
          dealType,
          dealConditions: dealConditions || story,
          validFrom: sourceDate(item.valid_from),
          validTo: sourceDate(item.valid_to),
          imageUrl: item.clean_image_url,
          source: 'FLIPP_LIVE',
        });
      }
    }
  } catch {
    liveSuccess = false;
  }

  return { offers: matchedOffers, liveSuccess };
}
