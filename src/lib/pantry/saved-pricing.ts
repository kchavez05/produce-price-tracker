import type { RecommendedDish } from '@/types/domain';

/** Derived rows are current-view data, not a reusable provider cache in a saved recipe. */
export function withoutDerivedPantryPricing(dish: RecommendedDish): RecommendedDish {
  const copy = { ...dish };
  delete copy.pantryPricing;
  return copy;
}
