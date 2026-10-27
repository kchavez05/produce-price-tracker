import type { StoreOffer } from '@/types/domain';

export function mountainDate(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Denver', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
}

export function currentAdCycle(now = new Date()) {
  const today = new Date(`${mountainDate(now)}T12:00:00Z`);
  const start = new Date(today);
  start.setUTCDate(today.getUTCDate() - ((today.getUTCDay() + 4) % 7));
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  const format = (date: Date) => date.toLocaleDateString('en-US', {
    timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric',
  });
  return {
    start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10),
    label: `${format(start)} – ${format(end)}, ${end.getUTCFullYear()}`,
  };
}

export function sourceDate(value?: string): string {
  if (!value) return '';
  const date = value.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !Number.isFinite(Date.parse(`${date}T12:00:00Z`)) ||
      new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) !== date) return '';
  if (value.length === 10) return date;
  // Keep source timestamps: truncating a UTC expiry can add an extra Mountain day.
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) &&
    Number.isFinite(Date.parse(value)) ? value : '';
}

export function isCurrentLiveOffer(offer: StoreOffer, now = new Date()): boolean {
  if (offer.source === 'CURATED_FALLBACK' || !Number.isFinite(offer.normalizedPricePerUnit) ||
      offer.normalizedPricePerUnit <= 0) return false;
  const today = mountainDate(now);
  // Kroger product prices are observations, not dated circular promotions.
  if (offer.source === 'KROGER_API' && !offer.validFrom && !offer.validTo) {
    const observed = new Date(offer.observedAtIso || '');
    return Number.isFinite(observed.getTime()) && observed <= now && mountainDate(observed) === today;
  }
  const from = sourceDate(offer.validFrom);
  const to = sourceDate(offer.validTo);
  if (!from || !to) return false;
  const started = from.length === 10 ? from <= today : Date.parse(from) <= now.getTime();
  const unexpired = to.length === 10 ? today <= to : now.getTime() <= Date.parse(to);
  return started && unexpired;
}

export function selectCurrentOffers(live: StoreOffer[], estimates: StoreOffer[], now = new Date()) {
  const current = [...new Map(live.filter((offer) => isCurrentLiveOffer(offer, now))
    .map((offer) => [`${offer.source}:${offer.id}`, offer])).values()];
  const covered = new Set(current.map((offer) => `${offer.store}:${offer.canonicalIngredientId}`));
  const fallback = estimates.filter((offer) => !covered.has(`${offer.store}:${offer.canonicalIngredientId}`))
    .map((offer) => ({ ...offer, source: 'CURATED_FALLBACK' as const, validFrom: '', validTo: '',
      dealType: 'EVERYDAY_LOW' as const,
      rawPriceText: `Historical estimate: $${offer.salePrice.toFixed(2)}/${offer.saleUnit} (verify with store)`,
      dealConditions: 'Historical baseline estimate; verify current price with the store.',
    }));
  return { current, offers: [...current, ...fallback] };
}
