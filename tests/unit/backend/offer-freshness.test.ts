import { describe, expect, it } from 'vitest';
import { currentAdCycle, isCurrentLiveOffer, selectCurrentOffers, sourceDate } from '@/lib/offer-freshness';
import { createMockOffer } from '../../test-utils';

const now = new Date('2026-10-27T18:00:00Z');
const live = createMockOffer({ source: 'FLIPP_LIVE', validFrom: '2026-10-21', validTo: '2026-10-27' });

describe('weekly offer freshness', () => {
  it('rolls the cycle at Wednesday midnight in Mountain Time', () => {
    expect(currentAdCycle(new Date('2026-10-28T05:59:59Z')).start).toBe('2026-10-21');
    expect(currentAdCycle(new Date('2026-10-28T06:00:00Z')).start).toBe('2026-10-28');
    expect(currentAdCycle(new Date('2026-11-04T06:59:59Z')).start).toBe('2026-10-28');
    expect(currentAdCycle(new Date('2026-11-04T07:00:00Z')).start).toBe('2026-11-04');
    expect(currentAdCycle(new Date('2026-01-01T18:00:00Z')).end).toBe('2026-01-06');
  });

  it('rejects expired, future, malformed and undated circulars', () => {
    expect(isCurrentLiveOffer(live, now)).toBe(true);
    for (const dates of [
      { validTo: '2026-10-20' }, { validFrom: '2026-10-28' },
      { validFrom: '' }, { validTo: '' }, { validTo: 'invalid' },
    ]) expect(isCurrentLiveOffer({ ...live, ...dates }, now)).toBe(false);
    expect(sourceDate('2026-02-30')).toBe('');
    expect(sourceDate('2026-10-27T00:00:00Z')).toBe('2026-10-27T00:00:00Z');
  });

  it('never lets a cheaper historical special replace a live offer in the same store', () => {
    const estimate = createMockOffer({ normalizedPricePerUnit: 0.5 });
    const selected = selectCurrentOffers([live], [estimate], now);
    expect(selected.offers).toEqual([live]);
    const fallback = selectCurrentOffers([], [estimate], now).offers[0];
    expect(fallback.source).toBe('CURATED_FALLBACK');
    expect(fallback.rawPriceText).toContain('Historical estimate');
    expect(fallback.validFrom).toBe('');
    expect(fallback.validTo).toBe('');
    expect(estimate.validFrom).toBe('2026-10-14');
    expect(selectCurrentOffers([], [{ ...estimate, source: 'FLIPP_LIVE' }], now).offers[0].source).toBe('CURATED_FALLBACK');
  });

  it('honors exact source timestamps instead of extending an expiry to the next Mountain day', () => {
    const dated = { ...live, validTo: '2026-10-28T03:59:59+00:00' };
    expect(isCurrentLiveOffer(dated, new Date('2026-10-28T03:59:58Z'))).toBe(true);
    expect(isCurrentLiveOffer(dated, new Date('2026-10-28T04:00:00Z'))).toBe(false);
  });

  it('keeps deterministic estimates for uncovered stores and ingredients', () => {
    const otherStore = createMockOffer({ store: 'SAFEWAY' });
    expect(selectCurrentOffers([live], [otherStore], now).offers).toHaveLength(2);
  });

  it('uses same-day Kroger observations without inventing an advertised validity window', () => {
    const observed = { ...live, source: 'KROGER_API' as const, validFrom: '', validTo: '', observedAtIso: now.toISOString() };
    expect(isCurrentLiveOffer(observed, now)).toBe(true);
    expect(isCurrentLiveOffer({ ...observed, observedAtIso: '2026-10-26T18:00:00Z' }, now)).toBe(false);
    expect(isCurrentLiveOffer({ ...observed, observedAtIso: 'invalid' }, now)).toBe(false);
  });
});
