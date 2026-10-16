import { NextRequest, NextResponse } from 'next/server';
import { ALL_STORE_CHAINS, getStoreDefinition, resolveStoreBanner } from '@/data/store-registry';
import { MEAD_KING_SOOPERS_LOCATIONS } from '@/lib/connectors/usda-and-kroger';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const zipCode = searchParams.get('zipCode') || searchParams.get('zip') || '80542';

  const availableStores = ALL_STORE_CHAINS.map((chain) => {
    const def = getStoreDefinition(chain);
    return {
      id: chain,
      name: def.name,
      bannerName: resolveStoreBanner(chain, zipCode),
      brandColor: def.brandColor,
      accentBg: def.accentBg,
      badgeTextColor: def.badgeTextColor,
      hasDigitalCoupons: def.hasDigitalCoupons,
      couponAppLabel: def.couponAppLabel,
      isEverydayLowPrice: def.isEverydayLowPrice,
      requiresLoyaltyCard: def.requiresLoyaltyCard,
      available: true,
      hasFlyer: true,
    };
  });

  return NextResponse.json({
    zipCode,
    chain: 'KING_SOOPERS',
    locations: MEAD_KING_SOOPERS_LOCATIONS,
    availableStores,
  });
}
