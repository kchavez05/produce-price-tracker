import type { PriceHistoryPoint } from '@/types/domain';
/** USDA-only points and repeated observations cannot establish local weekly coverage. */
export function verifiedLocalWeekCount(points: PriceHistoryPoint[]): number {
  return new Set(points.filter((point) => point.bestLocalPrice !== null && Number.isFinite(point.bestLocalPrice) && point.bestLocalPrice > 0)
    .map((point) => point.weekStart)).size;
}
