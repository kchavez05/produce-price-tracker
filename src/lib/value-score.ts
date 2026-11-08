import { requiresExactOffer } from './pantry/exact-offer';
import type { CanonicalIngredient } from '@/types/domain';

export const SCORE_POLICY_VERSION = '1.6.1';

function calculateAffordabilityScore(
  ingredient: CanonicalIngredient,
  pricePerUnit: number
): number {
  if (ingredient.category === 'PROTEIN') {
    if (pricePerUnit <= 1.25) return 100;
    if (pricePerUnit >= 8.0) return 12;
    const score = 100 - ((pricePerUnit - 1.25) / (8.0 - 1.25)) * 88;
    return Math.round(Math.max(10, Math.min(100, score)));
  }

  if (ingredient.category === 'PRODUCE') {
    if (pricePerUnit <= 0.6) return 100;
    if (pricePerUnit >= 3.8) return 15;
    const score = 100 - ((pricePerUnit - 0.6) / (3.8 - 0.6)) * 85;
    return Math.round(Math.max(12, Math.min(100, score)));
  }

  // DAIRY_EGGS
  if (pricePerUnit <= 1.6) return 100;
  if (pricePerUnit >= 5.0) return 20;
  const score = 100 - ((pricePerUnit - 1.6) / (5.0 - 1.6)) * 80;
  return Math.round(Math.max(15, Math.min(100, score)));
}

function calculateDiscountDepthScore(
  discountVsBaselinePct: number,
  discountVsRegularPct: number
): number {
  const effectiveDiscount = Math.max(
    discountVsBaselinePct,
    discountVsRegularPct * 0.9
  );
  if (effectiveDiscount <= 0) return 10;
  if (effectiveDiscount >= 50) return 100;
  return Math.round(10 + (effectiveDiscount / 50) * 90);
}

function calculateWholesaleBonus(
  ingredient: CanonicalIngredient,
  discountVsBaselinePct: number
): number {
  const { trend } = ingredient.usdaSignal;
  if (trend === 'CYCLE_FLOOR' && discountVsBaselinePct >= 20) return 95;
  if (trend === 'SPIKING_BUY_NOW' && discountVsBaselinePct >= 25) return 100;
  if (trend === 'DROPPING_FAST' && discountVsBaselinePct < 15) return 20;
  return 60;
}

/** Missing or invalid comparison prices contribute no asserted discount. */
export function discountPercent(reference: number, price: number): number {
  if (
    !Number.isFinite(reference) ||
    reference <= 0 ||
    !Number.isFinite(price) ||
    price <= 0
  )
    return 0;
  const result = Math.round(((reference - price) / reference) * 100);
  return Number.isFinite(result) ? result : 0;
}

export function calculateValueScore(
  ingredient: CanonicalIngredient,
  price: number,
  regular: number,
  regularIsQualified = false
) {
  if (!Number.isFinite(price) || price <= 0)
    throw new Error('invalid_offer_price');
  const discountVsBaselinePct = discountPercent(
    requiresExactOffer(ingredient.id) ? 0 : ingredient.mountainBaselinePerUnit,
    price
  );
  const discountVsRegularPct = discountPercent(requiresExactOffer(ingredient.id) && !regularIsQualified ? 0 : regular, price);
  const affordabilityScore = calculateAffordabilityScore(ingredient, price);
  const discountDepthScore = calculateDiscountDepthScore(
    discountVsBaselinePct,
    discountVsRegularPct
  );
  const wholesaleBonusScore = calculateWholesaleBonus(
    requiresExactOffer(ingredient.id) ? { ...ingredient, usdaSignal: { ...ingredient.usdaSignal, trend: 'STABLE' } } : ingredient,
    discountVsBaselinePct
  );
  const contributions = [
    affordabilityScore * 0.55,
    discountDepthScore * 0.35,
    wholesaleBonusScore * 0.1,
  ];
  return {
    policyVersion: SCORE_POLICY_VERSION,
    discountVsBaselinePct,
    discountVsRegularPct,
    effectiveDiscount: Math.max(
      discountVsBaselinePct,
      discountVsRegularPct * 0.9
    ),
    affordabilityScore,
    discountDepthScore,
    wholesaleBonusScore,
    contributions,
    unroundedScore: contributions.reduce((sum, n) => sum + n, 0),
    valueScore: Math.round(contributions.reduce((sum, n) => sum + n, 0)),
  };
}
