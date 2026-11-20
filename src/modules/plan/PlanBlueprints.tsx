'use client';

import { Button, Card } from '@/components/ui';
import { useDashboardContext, usePlanContext, usePreferencesContext } from '@/modules/shell/app-context';

// v2.0 M4-5a: the browse-all list on the design tokens. The heading, the counts, the prices and the promote action are unchanged.
export default function PlanBlueprints() {
  const { data } = useDashboardContext();
  const { targetServings } = usePreferencesContext();
  const { showAllBlueprints, setShowAllBlueprints, handlePromoteDish: onPromoteDish } = usePlanContext();
  return (
    <Card as="section" aria-labelledby="plan-blueprints" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 id="plan-blueprints" className="text-sm font-bold text-ink">
            Want to Swap a Dish? Browse All {data.allRankedDishes.length} Cost-Ranked Blueprints
          </h3>
          <p className="text-xs text-muted">
            Every blueprint is dynamically priced using this week&apos;s {data.cityLabel} circulars and scaled to {targetServings} servings.
          </p>
        </div>
        <Button variant="secondary" aria-expanded={showAllBlueprints} onClick={() => setShowAllBlueprints(!showAllBlueprints)}>
          {showAllBlueprints ? 'Hide Full Matrix' : `Show All ${data.allRankedDishes.length} Dishes`}
        </Button>
      </div>

      {showAllBlueprints && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {data.allRankedDishes.map((dish) => (
            <li key={dish.id} className="flex items-center justify-between gap-3 rounded-control bg-bg p-3 text-sm">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-muted">
                  {dish.appliance} • {dish.macrosPerServing?.proteinGrams || 40}g Protein • {dish.macrosPerServing?.carbsGrams || 30}g Carbs
                </p>
                <h4 className="font-bold text-ink">{dish.title}</h4>
                <p className="text-muted">
                  ${dish.costPerServing.toFixed(2)}/serving • Batch: ${dish.totalBatchCost.toFixed(2)} (Save ${dish.totalBatchSavings.toFixed(2)})
                </p>
              </div>
              <Button variant="secondary" className="shrink-0" onClick={() => onPromoteDish(dish)}>Promote to Top 3</Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
