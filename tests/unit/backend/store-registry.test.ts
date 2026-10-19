import { describe, it, expect } from 'vitest';
import {
  ALL_STORE_CHAINS,
  getStoreDefinition,
  resolveStoreBanner,
  STORE_REGISTRY,
} from '@/data/store-registry';

describe('store-registry: definitions and banners', () => {
  it('contains all 6 standard grocery store chains', () => {
    expect(ALL_STORE_CHAINS).toEqual([
      'ALDI',
      'KING_SOOPERS',
      'WALMART',
      'SAFEWAY',
      'SPROUTS',
      'TARGET',
    ]);
  });

  it('retrieves valid metadata for each registered store', () => {
    for (const chain of ALL_STORE_CHAINS) {
      const def = getStoreDefinition(chain);
      expect(def).toBeDefined();
      expect(def.id).toBe(chain);
      expect(def.name).toBeTruthy();
      expect(def.brandColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(typeof def.hasDigitalCoupons).toBe('boolean');
      expect(typeof def.requiresLoyaltyCard).toBe('boolean');
    }
  });

  it('resolves Kroger banner names according to ZIP code', () => {
    // Colorado (80000 - 81658) -> King Soopers
    expect(resolveStoreBanner('KING_SOOPERS', '80542')).toBe('King Soopers');
    // California (90000 - 93599) -> Ralphs
    expect(resolveStoreBanner('KING_SOOPERS', '90210')).toBe('Ralphs');
    // Washington/Oregon (97000 - 99499) -> Fred Meyer
    expect(resolveStoreBanner('KING_SOOPERS', '98101')).toBe('Fred Meyer');
    // Arizona (85000 - 86599) -> Fry's
    expect(resolveStoreBanner('KING_SOOPERS', '85001')).toBe("Fry's");
    // Utah (84000 - 84799) -> Smith's
    expect(resolveStoreBanner('KING_SOOPERS', '84101')).toBe("Smith's");
    // Kansas (66000 - 67999) -> Dillons
    expect(resolveStoreBanner('KING_SOOPERS', '66044')).toBe('Dillons');
    // Fallback -> Kroger
    expect(resolveStoreBanner('KING_SOOPERS', '10001')).toBe('Kroger');
  });

  it('overrides Kroger banner with explicit rawMerchant name if present', () => {
    expect(resolveStoreBanner('KING_SOOPERS', '80542', 'Ralphs Grocery')).toBe('Ralphs');
    expect(resolveStoreBanner('KING_SOOPERS', '80542', 'City Market')).toBe('City Market');
    expect(resolveStoreBanner('KING_SOOPERS', '80542', 'Fred Meyer')).toBe('Fred Meyer');
  });

  it('resolves Safeway banner names according to ZIP code', () => {
    // Colorado (80000 - 81658) -> Safeway
    expect(resolveStoreBanner('SAFEWAY', '80542')).toBe('Safeway');
    // Southern California -> Vons
    expect(resolveStoreBanner('SAFEWAY', '90210')).toBe('Vons');
    // Chicago/Illinois -> Jewel-Osco
    expect(resolveStoreBanner('SAFEWAY', '60601')).toBe('Jewel-Osco');
    // Texas -> Tom Thumb
    expect(resolveStoreBanner('SAFEWAY', '75201')).toBe('Tom Thumb');
    // Massachusetts -> Shaw's
    expect(resolveStoreBanner('SAFEWAY', '02108')).toBe("Shaw's");
  });

  it('returns fixed banner names for chains without regional sub-banners', () => {
    expect(resolveStoreBanner('ALDI', '80542')).toBe('ALDI');
    expect(resolveStoreBanner('WALMART', '80542')).toBe('Walmart');
    expect(resolveStoreBanner('SPROUTS', '80542')).toBe('Sprouts');
    expect(resolveStoreBanner('TARGET', '80542')).toBe('Target');
  });
});
