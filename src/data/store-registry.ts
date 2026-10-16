import { StoreChain } from '@/types/domain';

export interface StoreDefinition {
  id: StoreChain;
  name: string;
  shortName: string;
  brandColor: string;
  accentBg: string;
  badgeTextColor: string;
  hasDigitalCoupons: boolean;
  couponAppLabel?: string;
  requiresLoyaltyCard: boolean;
  isEverydayLowPrice: boolean;
  defaultEnabled: boolean;
  bannerResolver: (zipCode: string, rawMerchant?: string) => string;
}

export const ALL_STORE_CHAINS: StoreChain[] = [
  'ALDI',
  'KING_SOOPERS',
  'WALMART',
  'SAFEWAY',
  'SPROUTS',
  'TARGET',
];

export const STORE_REGISTRY: Record<StoreChain, StoreDefinition> = {
  ALDI: {
    id: 'ALDI',
    name: 'ALDI',
    shortName: 'ALDI',
    brandColor: '#0A2540',
    accentBg: '#EBF4FF',
    badgeTextColor: '#0A2540',
    hasDigitalCoupons: false,
    requiresLoyaltyCard: false,
    isEverydayLowPrice: true,
    defaultEnabled: true,
    bannerResolver: () => 'ALDI',
  },
  KING_SOOPERS: {
    id: 'KING_SOOPERS',
    name: 'Kroger Family',
    shortName: 'Kroger / King Soopers',
    brandColor: '#0055A5',
    accentBg: '#EFF6FF',
    badgeTextColor: '#1E40AF',
    hasDigitalCoupons: true,
    couponAppLabel: 'Kroger / King Soopers App',
    requiresLoyaltyCard: true,
    isEverydayLowPrice: false,
    defaultEnabled: true,
    bannerResolver: (zipCode: string, rawMerchant?: string) => {
      if (rawMerchant) {
        const lower = rawMerchant.toLowerCase();
        if (lower.includes('ralphs')) return 'Ralphs';
        if (lower.includes('fred meyer')) return 'Fred Meyer';
        if (lower.includes("fry's") || lower.includes('frys')) return "Fry's";
        if (lower.includes('smith')) return "Smith's";
        if (lower.includes('dillons')) return 'Dillons';
        if (lower.includes('qfc')) return 'QFC';
        if (lower.includes('city market')) return 'City Market';
        if (lower.includes('king soopers')) return 'King Soopers';
        if (lower.includes('kroger')) return 'Kroger';
      }
      const zipNum = parseInt(zipCode, 10);
      if (zipNum >= 80000 && zipNum <= 81658) return 'King Soopers';
      if (zipNum >= 90000 && zipNum <= 93599) return 'Ralphs';
      if (zipNum >= 97000 && zipNum <= 99499) return 'Fred Meyer';
      if (zipNum >= 85000 && zipNum <= 86599) return "Fry's";
      if (zipNum >= 84000 && zipNum <= 84799) return "Smith's";
      if (zipNum >= 66000 && zipNum <= 67999) return 'Dillons';
      return 'Kroger';
    },
  },
  WALMART: {
    id: 'WALMART',
    name: 'Walmart',
    shortName: 'Walmart',
    brandColor: '#0071DC',
    accentBg: '#EFF6FF',
    badgeTextColor: '#004C99',
    hasDigitalCoupons: false,
    requiresLoyaltyCard: false,
    isEverydayLowPrice: true,
    defaultEnabled: true,
    bannerResolver: () => 'Walmart',
  },
  SAFEWAY: {
    id: 'SAFEWAY',
    name: 'Albertsons Family',
    shortName: 'Safeway / Albertsons',
    brandColor: '#E31837',
    accentBg: '#FEF2F2',
    badgeTextColor: '#991B1B',
    hasDigitalCoupons: true,
    couponAppLabel: 'Safeway for U App',
    requiresLoyaltyCard: true,
    isEverydayLowPrice: false,
    defaultEnabled: true,
    bannerResolver: (zipCode: string, rawMerchant?: string) => {
      if (rawMerchant) {
        const lower = rawMerchant.toLowerCase();
        if (lower.includes('vons')) return 'Vons';
        if (lower.includes('jewel')) return 'Jewel-Osco';
        if (lower.includes('tom thumb')) return 'Tom Thumb';
        if (lower.includes('randalls')) return 'Randalls';
        if (lower.includes('shaw')) return "Shaw's";
        if (lower.includes('acme')) return 'Acme';
        if (lower.includes('albertsons')) return 'Albertsons';
        if (lower.includes('safeway')) return 'Safeway';
      }
      const zipNum = parseInt(zipCode, 10);
      if (zipNum >= 60000 && zipNum <= 60899) return 'Jewel-Osco';
      if (zipNum >= 90000 && zipNum <= 93599) return 'Vons';
      if (zipNum >= 75000 && zipNum <= 76999) return 'Tom Thumb';
      if (zipNum >= 77000 && zipNum <= 77999) return 'Randalls';
      if (zipNum >= 1000 && zipNum <= 4999) return "Shaw's";
      if (zipNum >= 80000 && zipNum <= 81658) return 'Safeway';
      return 'Safeway';
    },
  },
  SPROUTS: {
    id: 'SPROUTS',
    name: 'Sprouts Farmers Market',
    shortName: 'Sprouts',
    brandColor: '#1E5631',
    accentBg: '#F0FDF4',
    badgeTextColor: '#166534',
    hasDigitalCoupons: true,
    couponAppLabel: 'Sprouts App',
    requiresLoyaltyCard: false,
    isEverydayLowPrice: false,
    defaultEnabled: true,
    bannerResolver: () => 'Sprouts',
  },
  TARGET: {
    id: 'TARGET',
    name: 'Target',
    shortName: 'Target',
    brandColor: '#CC0000',
    accentBg: '#FFF1F2',
    badgeTextColor: '#9F1239',
    hasDigitalCoupons: true,
    couponAppLabel: 'Target Circle App',
    requiresLoyaltyCard: false,
    isEverydayLowPrice: false,
    defaultEnabled: true,
    bannerResolver: () => 'Target',
  },
};

export function resolveStoreBanner(
  store: StoreChain,
  zipCode: string,
  rawMerchant?: string
): string {
  const def = STORE_REGISTRY[store];
  return def ? def.bannerResolver(zipCode, rawMerchant) : store;
}

export function getStoreDefinition(store: StoreChain): StoreDefinition {
  return STORE_REGISTRY[store] || STORE_REGISTRY.KING_SOOPERS;
}
