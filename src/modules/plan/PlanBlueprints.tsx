'use client';

import { useDashboardContext, usePlanContext, usePreferencesContext } from '@/modules/shell/app-context';

// Moved verbatim from MealPrepDashboard (v2.0 M3 Phase A.3, Meal Plan tab). Since Phase B.2b it reads the app's state from the
// context hooks instead of props; the markup is unchanged.

export default function PlanBlueprints() {
  const { data } = useDashboardContext();
  const { targetServings } = usePreferencesContext();
  const { showAllBlueprints, setShowAllBlueprints, handlePromoteDish: onPromoteDish } = usePlanContext();
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Want to Swap a Dish? Browse All {data.allRankedDishes.length} Cost-Ranked Blueprints
          </h3>
          <p className="text-xs text-slate-500">
            Every blueprint is dynamically priced using this week&apos;s {data.cityLabel} circulars and scaled to {targetServings} servings.
          </p>
        </div>
        <button
          onClick={() => setShowAllBlueprints(!showAllBlueprints)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          {showAllBlueprints
            ? 'Hide Full Matrix'
            : `Show All ${data.allRankedDishes.length} Dishes`}
        </button>
      </div>

      {showAllBlueprints && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {data.allRankedDishes.map((dish) => (
            <div
              key={dish.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-xs"
            >
              <div>
                <span className="font-semibold text-emerald-700">
                  {dish.appliance} • {dish.macrosPerServing?.proteinGrams || 40}g Protein •{' '}
                  {dish.macrosPerServing?.carbsGrams || 30}g Carbs
                </span>
                <h4 className="font-bold text-slate-900">{dish.title}</h4>
                <p className="text-slate-500">
                  ${dish.costPerServing.toFixed(2)}/serving • Batch: $
                  {dish.totalBatchCost.toFixed(2)} (Save $
                  {dish.totalBatchSavings.toFixed(2)})
                </p>
              </div>
              <button
                onClick={() => onPromoteDish(dish)}
                className="shrink-0 rounded-lg bg-slate-900 px-2.5 py-1.5 font-semibold text-white hover:bg-emerald-600"
              >
                Promote to Top 3
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
