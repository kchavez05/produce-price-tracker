import { CANONICAL_INGREDIENTS } from '@/data/canonical-ingredients';
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
 * Normalizes a raw flyer price and title/story into a per-unit ($/lb or $/doz) figure.
 */
export function normalizeFlyerPrice(
  rawPrice: number,
  combinedText: string,
  ingredient: CanonicalIngredient
): { normalizedPricePerUnit: number; saleUnit: string } {
  const lower = combinedText.toLowerCase();

  if (ingredient.standardUnit === 'doz') {
    if (lower.includes('18 ct') || lower.includes('18 count')) {
      return {
        normalizedPricePerUnit: Number(((rawPrice / 18) * 12).toFixed(2)),
        saleUnit: '18 ct',
      };
    }
    return {
      normalizedPricePerUnit: Number(rawPrice.toFixed(2)),
      saleUnit: 'doz',
    };
  }

  // Check explicit bag weight e.g. "5 lb", "3 lb", "2 lb", "10 lb"
  const lbBagMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:lb|pound)s?\s*(?:bag|pack|roll|box)?/);
  if (lbBagMatch && !lower.includes('/lb') && !lower.includes('per lb')) {
    const lbs = parseFloat(lbBagMatch[1]);
    if (lbs > 1 && lbs <= 15) {
      return {
        normalizedPricePerUnit: Number((rawPrice / lbs).toFixed(2)),
        saleUnit: `${lbs} lb bag`,
      };
    }
  }

  // Check ounce package e.g. "8 oz", "16 oz", "14 oz", "32 oz", "10 oz"
  const ozMatch = lower.match(/(\d+(?:\.\d+)?)\s*oz/);
  if (ozMatch && !lower.includes('/lb')) {
    const oz = parseFloat(ozMatch[1]);
    if (oz >= 4 && oz <= 64) {
      const lbs = oz / 16;
      return {
        normalizedPricePerUnit: Number((rawPrice / lbs).toFixed(2)),
        saleUnit: `${oz} oz`,
      };
    }
  }

  // Check if explicitly per lb
  if (lower.includes('/lb') || lower.includes('per lb') || lower.includes('lb.')) {
    return {
      normalizedPricePerUnit: Number(rawPrice.toFixed(2)),
      saleUnit: 'lb',
    };
  }

  // Check if sold by each/count
  if (
    lower.includes('/ea') ||
    lower.includes('each') ||
    ingredient.avgEachWeightLb < 0.8
  ) {
    const estLb = Math.max(0.2, ingredient.avgEachWeightLb);
    return {
      normalizedPricePerUnit: Number((rawPrice / estLb).toFixed(2)),
      saleUnit: 'ea',
    };
  }

  return {
    normalizedPricePerUnit: Number(rawPrice.toFixed(2)),
    saleUnit: ingredient.standardUnit,
  };
}

export function detectDealType(combinedText: string): {
  dealType: DealType;
  dealConditions?: string;
} {
  const lower = combinedText.toLowerCase();
  if (
    lower.includes('digital') ||
    lower.includes('clip') ||
    lower.includes('for u') ||
    lower.includes('coupon')
  ) {
    return {
      dealType: 'DIGITAL_COUPON',
      dealConditions: 'Clip Digital Coupon in store app (check item limit)',
    };
  }
  if (lower.includes('must buy') || lower.includes('when you buy')) {
    return {
      dealType: 'MULTI_BUY',
      dealConditions: 'Multi-buy requirement applies to get advertised unit price',
    };
  }
  return {
    dealType: 'SHELF_OR_MEMBER',
    dealConditions: 'With Store Loyalty Card / Phone Number at Checkout',
  };
}

/**
 * Queries the public Flipp circular endpoint for postal_code 80542 (Mead, CO)
 * for King Soopers and Safeway items and maps any matches to CanonicalIngredients.
 */
export async function fetchLiveFlippOffers(
  zipCode: string = '80542'
): Promise<{ offers: StoreOffer[]; liveSuccess: boolean }> {
  const matchedOffers: StoreOffer[] = [];
  let liveSuccess = false;

  try {
    const queries = ['King Soopers', 'Safeway'];
    const responses = await Promise.all(
      queries.map(async (merchantQuery) => {
        const url = `https://backflipp.wishabi.com/flipp/items/search?locale=en-us&postal_code=${encodeURIComponent(
          zipCode
        )}&q=${encodeURIComponent(merchantQuery)}`;
        const res = await fetch(url, {
          headers: {
            Accept: 'application/json',
            'User-Agent': 'ProducePriceTracker/1.0 (Mead-CO-MealPrep)',
          },
          next: { revalidate: 3600 },
          signal: AbortSignal.timeout(3500),
        });
        if (!res.ok) return [];
        const data = await res.json();
        return (data?.items || []) as FlippSearchItem[];
      })
    );

    const allItems = responses.flat();
    if (allItems.length > 0) {
      liveSuccess = true;
    }

    for (const item of allItems) {
      const merchant = (item.merchant_name || '').toLowerCase();
      let store: StoreChain | null = null;
      if (merchant.includes('king soopers') || merchant.includes('kroger')) {
        store = 'KING_SOOPERS';
      } else if (merchant.includes('safeway') || merchant.includes('albertsons')) {
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

        const { normalizedPricePerUnit, saleUnit } = normalizeFlyerPrice(
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

        const { dealType, dealConditions } = detectDealType(fullText);

        matchedOffers.push({
          id: `flipp-${store.toLowerCase()}-${ingredient.id}-${item.id || Math.random()}`,
          canonicalIngredientId: ingredient.id,
          store,
          storeLocationLabel:
            store === 'KING_SOOPERS'
              ? `King Soopers (${zipCode} Circular)`
              : `Safeway (${zipCode} Circular)`,
          rawTitle: title,
          rawPriceText: `$${rawPrice.toFixed(2)} / ${saleUnit}${
            story ? ` (${story.slice(0, 50)})` : ''
          }`,
          salePrice: rawPrice,
          saleUnit,
          normalizedPricePerUnit,
          regularPricePerUnit: ingredient.typicalRegularPerUnit,
          dealType,
          dealConditions: story || dealConditions,
          validFrom: (item.valid_from || '2026-10-14').slice(0, 10),
          validTo: (item.valid_to || '2026-10-20').slice(0, 10),
          imageUrl: item.clean_image_url,
          source: 'FLIPP_LIVE',
        });
      }
    }
  } catch {
    // Graceful fallback when running in offline/sandboxed mode without external internet
    liveSuccess = false;
  }

  return { offers: matchedOffers, liveSuccess };
}
