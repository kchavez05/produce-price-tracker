import { requiresExactOffer } from '@/lib/pantry/exact-offer';
import { CANONICAL_INGREDIENTS } from '@/data/canonical-ingredients';
import { KingSoopersLocation, StoreOffer } from '@/types/domain';

export const MEAD_KING_SOOPERS_LOCATIONS: KingSoopersLocation[] = [
  {
    locationId: '62000116',
    name: 'King Soopers Marketplace (Firestone)',
    address: '6110 Firestone Blvd',
    city: 'Firestone, CO 80504',
    distanceMiles: 3.8,
  },
  {
    locationId: '62000080',
    name: 'King Soopers (Longmont Pace St)',
    address: '1611 Pace St',
    city: 'Longmont, CO 80504',
    distanceMiles: 5.9,
  },
  {
    locationId: '62000042',
    name: 'King Soopers (Longmont North Main)',
    address: '2255 N Main St',
    city: 'Longmont, CO 80501',
    distanceMiles: 6.8,
  },
  {
    locationId: '62000102',
    name: 'King Soopers (Longmont Hover St)',
    address: '995 S Hover St',
    city: 'Longmont, CO 80501',
    distanceMiles: 7.9,
  },
];

/**
 * Ticket #3: Kroger Developer API connector for live King Soopers store lookup
 * and batch product shelf & promo pricing around 80542 (Mead / Firestone / Longmont).
 */
export async function fetchKrogerLiveOffers(
  requestedLocationId?: string
): Promise<{
  krogerLive: boolean;
  locations: KingSoopersLocation[];
  selectedLocationId: string;
  offers: StoreOffer[];
}> {
  const clientId = process.env.KROGER_CLIENT_ID?.trim();
  const clientSecret = process.env.KROGER_CLIENT_SECRET?.trim();
  const selectedLocationId =
    requestedLocationId ||
    process.env.KROGER_LOCATION_ID?.trim() ||
    MEAD_KING_SOOPERS_LOCATIONS[0].locationId;

  if (!clientId || !clientSecret) {
    return {
      krogerLive: false,
      locations: MEAD_KING_SOOPERS_LOCATIONS,
      selectedLocationId,
      offers: [],
    };
  }

  try {
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const tokenRes = await fetch('https://api.kroger.com/v1/connect/oauth2/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials&scope=product.compact',
      signal: AbortSignal.timeout(3500),
    });

    if (!tokenRes.ok) {
      return {
        krogerLive: false,
        locations: MEAD_KING_SOOPERS_LOCATIONS,
        selectedLocationId,
        offers: [],
      };
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData?.access_token;
    if (!accessToken) {
      return {
        krogerLive: false,
        locations: MEAD_KING_SOOPERS_LOCATIONS,
        selectedLocationId,
        offers: [],
      };
    }

    // Batch-query 5 core meal-prep anchor terms at the selected King Soopers locationId
    const batchTargets = [
      { ingredientId: 'chicken-thighs-boneless', term: 'boneless chicken thighs' },
      { ingredientId: 'pork-shoulder-butt', term: 'pork shoulder roast' },
      { ingredientId: 'beef-chuck-roast', term: 'beef chuck roast' },
      { ingredientId: 'potatoes-russet-gold', term: 'russet potatoes 5 lb' },
      { ingredientId: 'shredded-block-cheese', term: 'kroger shredded cheddar cheese' },
    ];

    const offers: StoreOffer[] = [];
    const results = await Promise.allSettled(
      batchTargets.map(async (target) => {
        const prodRes = await fetch(
          `https://api.kroger.com/v1/products?filter.term=${encodeURIComponent(
            target.term
          )}&filter.locationId=${encodeURIComponent(selectedLocationId)}&filter.limit=3`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: 'application/json',
            },
            cache: 'no-store',
            signal: AbortSignal.timeout(3500),
          }
        );
        if (!prodRes.ok) return null;
        const prodJson = await prodRes.json();
        return { target, data: prodJson?.data || [] };
      })
    );

    for (const result of results) {
      const res = result.status === 'fulfilled' ? result.value : null;
      if (!res) continue;
      const ingredient = CANONICAL_INGREDIENTS.find(
        (i) => i.id === res.target.ingredientId
      );
      if (!ingredient) continue;

      for (const prod of res.data) {
        if (requiresExactOffer(ingredient.id) && !prod.description?.trim()) continue;
        const item = prod?.items?.[0];
        const regular = item?.price?.regular;
        const promo = item?.price?.promo;
        const activePrice = promo && promo > 0 ? promo : regular;

        if (activePrice) {
          offers.push({
            id: `kroger-api-${prod.productId}`,
            canonicalIngredientId: ingredient.id,
            store: 'KING_SOOPERS',
            storeLocationLabel: `King Soopers (#${selectedLocationId} Live API)`,
            rawTitle: prod.description || ingredient.name,
            rawPriceText: promo
              ? `$${promo.toFixed(2)} Promo (Reg $${regular?.toFixed(2)})`
              : `$${regular.toFixed(2)} Shelf Price`,
            salePrice: activePrice,
            saleUnit: item?.size || ingredient.standardUnit,
            normalizedPricePerUnit: activePrice,
            regularPricePerUnit: regular || ingredient.typicalRegularPerUnit,
            ...(Number.isFinite(regular) && regular > 0 ? { regularPriceEvidence: 'OBSERVED_SAME_PRODUCT' as const } : {}),
            dealType: promo ? 'SHELF_OR_MEMBER' : 'EVERYDAY_LOW',
            validFrom: '',
            validTo: '',
            observedAtIso: new Date().toISOString(),
            source: 'KROGER_API',
          });
          break;
        }
      }
    }

    return {
      krogerLive: offers.length > 0,
      locations: MEAD_KING_SOOPERS_LOCATIONS,
      selectedLocationId,
      offers,
    };
  } catch {
    return {
      krogerLive: false,
      locations: MEAD_KING_SOOPERS_LOCATIONS,
      selectedLocationId,
      offers: [],
    };
  }
}
