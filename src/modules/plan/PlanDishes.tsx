'use client';

import { Bookmark, ChefHat, ChevronDown, ChevronUp, Clock, DoorOpen, Dumbbell, Snowflake, Sparkles } from 'lucide-react';
import { renderStoreBadge } from '@/modules/shop/badges';
import { formatPantryRequirement } from '@/lib/pantry/recipe';
import { pantryPriceLabel } from '@/lib/pantry/pricing';
import {
  useAccountContext, useDashboardContext, useLocationContext, usePlanContext,
} from '@/modules/shell/app-context';

// Moved verbatim from MealPrepDashboard (v2.0 M3 Phase A.3, Meal Plan tab). Since Phase B.2b it reads the app's state from the
// context hooks instead of props; the markup is unchanged.

export default function PlanDishes() {
  const { activeTrio } = useDashboardContext();
  const { currentZip } = useLocationContext();
  const { expandedDishIds, setExpandedDishIds, handleToggleSaveRecipe } = usePlanContext();
  const { savedRecipeIds } = useAccountContext();
  return (
    <div className="space-y-4">
      {activeTrio.map((dish, index) => {
        const isExpanded = Boolean(expandedDishIds[dish.id]);
        const isSaved = Boolean(dish.savedInLibrary || savedRecipeIds[dish.id]);

        return (
          <div
            key={dish.id}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs"
          >
            <div className="border-b border-slate-100 bg-slate-50/70 p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-md bg-emerald-600 px-2.5 py-0.5 text-xs font-extrabold text-white">
                      Dish #{index + 1}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-800">
                      <ChefHat className="h-3.5 w-3.5" />
                      {dish.appliance}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      <Clock className="h-3.5 w-3.5" />
                      {dish.prepTimeMinutes}m prep • {dish.cookTimeMinutes}m cook
                    </span>
                    {dish.freezerFriendly && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-900">
                        <Snowflake className="h-3.5 w-3.5" />
                        Freezer Friendly
                      </span>
                    )}
                    {dish.aiGenerated && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-900">
                        <Sparkles className="h-3 w-3" />
                        Gemini AI Custom
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-extrabold text-slate-900 sm:text-xl">
                    {dish.title}
                  </h3>
                  <p className="text-xs text-slate-600 sm:text-sm">
                    {dish.subtitle}
                  </p>

                  {/* v1.2 Ticket #22: Clear Macro Breakdown Badges & Dietary Tags */}
                  {dish.macrosPerServing && (
                    <div className="pt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-950 border border-amber-300">
                        <Dumbbell className="h-3.5 w-3.5 text-amber-700" />
                        {dish.macrosPerServing.proteinGrams}g Protein
                      </span>
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-800 border border-slate-200">
                        🔥 {dish.macrosPerServing.calories} kcal
                      </span>
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-800 border border-slate-200">
                        🌾 {dish.macrosPerServing.carbsGrams}g Carbs
                      </span>
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-800 border border-slate-200">
                        🥑 {dish.macrosPerServing.fatGrams}g Fat
                      </span>
                      {(dish.macroBadges || []).map((badge) => (
                        <span
                          key={badge}
                          className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200"
                        >
                          {badge}
                        </span>
                      ))}
                    </div>
                  )}

                  {dish.adaptationNote && (
                    <p className="text-[11px] font-semibold text-indigo-700">
                      ✨ Smart Profile Adaptation: {dish.adaptationNote}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {/* v0.4 Save to Personal Blueprint Library Button (Ticket #10) */}
                  <button
                    onClick={() => handleToggleSaveRecipe(dish)}
                    className={`inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-bold transition ${
                      isSaved
                        ? 'border-amber-400 bg-amber-100 text-amber-950'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                    title="Save this recipe into your SQLite Personal Library"
                  >
                    <Bookmark
                      className={`h-4 w-4 ${
                        isSaved ? 'fill-amber-500 text-amber-600' : ''
                      }`}
                    />
                    <span>{isSaved ? 'Saved in Library' : 'Save Recipe'}</span>
                  </button>

                  <div className="flex items-center gap-4 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-2.5 text-right">
                    <div>
                      <div className="text-[11px] font-semibold text-emerald-800 uppercase">
                        {'Additional / Serving'} ({dish.servings} srv)
                      </div>
                      <div className="text-2xl font-black text-emerald-700">
                        ${dish.costPerServing.toFixed(2)}
                      </div>
                    </div>
                    <div className="border-l border-emerald-200 pl-3 text-xs text-slate-600">
                      <div>
                        {'Additional batch estimate:'}{' '}
                        <strong className="text-slate-900">
                          ${dish.totalBatchCost.toFixed(2)}
                        </strong>
                      </div>
                      <div className="text-emerald-700 font-semibold">
                        {'Price difference'} ${dish.totalBatchSavings.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5">
              {dish.pantryCoverage && <p className="mb-3 text-sm font-semibold text-sky-900">
                You have {dish.pantryCoverage.availableRequiredCount} of {dish.pantryCoverage.requiredCount} required ingredients.
                {dish.pantryCoverage.optionalCount > 0 && ` Optional: ${dish.pantryCoverage.availableOptionalCount} of ${dish.pantryCoverage.optionalCount} available.`}
                {dish.pantryPricing?.includesStaticEstimates && ' Includes static estimates.'}
                {dish.additionalCostEstimateComplete === false && ' Known subtotal only — additional ingredients have no price.'}
              </p>}
              <h4 className="mb-2.5 text-xs font-bold tracking-wider text-slate-500 uppercase">
                {'Recipe ingredients'} ({dish.servings} Servings)
              </h4>
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {dish.matchedIngredients.map((ing, i) => (
                  <div
                    key={`${dish.id}-ing-${i}`}
                    className={`rounded-xl border p-3 text-xs ${
                      ing.isOnHand
                        ? 'border-sky-400 bg-sky-50/60'
                        : ing.isUserPinned
                          ? 'border-emerald-400 bg-emerald-50/40'
                          : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-slate-500">
                        {ing.slotLabel}
                      </span>
                      {ing.isOnHand ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-sky-600 px-2 py-0.5 text-[11px] font-bold text-white">
                          <DoorOpen className="h-3 w-3" />{' '}
                          {'Already have'}
                        </span>
                      ) : (
                        renderStoreBadge(ing.store, currentZip)
                      )}
                    </div>
                    <div className="mt-1 font-bold text-slate-900">
                      {ing.ingredientName}
                    </div>
                    <div className="mt-1 flex items-baseline justify-between">
                      <span className="text-slate-600">
                        {(ing.isOnHand ? 'Make sure you have:' : ing.optional ? 'Optional:' : 'Need to buy:')}{' '}
                        <strong>
                          {ing.quantityUsed} {ing.unit}
                        </strong>{' '}
                        {(!ing.isOnHand) && <> (@ ${ing.unitCost.toFixed(2)}/{ing.unit})</>}
                      </span>
                      <span className="text-sm font-extrabold text-emerald-700">
                        {`$${ing.slotCost.toFixed(2)}`}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between border-t border-slate-100 pt-1.5 text-[11px] text-slate-500">
                      <span>{ing.rawDealText}</span>
                      {!ing.isOnHand && ing.dealType === 'DIGITAL_COUPON' && (
                        <span className="font-semibold text-amber-700">
                          📱 App Coupon
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                <div className="text-xs text-slate-600">
                  <strong className="text-slate-800">
                    {'Staples (recipe-use estimate)'} (+${dish.estimatedPantryCost.toFixed(2)}):
                  </strong>{' '}
                  {(
                    <ul className="mt-2 space-y-1">
                      {(dish.pantryPricing?.rows ?? []).map((row) => (
                        <li key={row.requirementKey}>
                          {formatPantryRequirement(row)} — {row.estimatedCost === null ? '' : `$${row.estimatedCost.toFixed(2)} · `}{pantryPriceLabel(row)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <button
                  onClick={() =>
                    setExpandedDishIds((prev) => ({
                      ...prev,
                      [dish.id]: !prev[dish.id],
                    }))
                  }
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-200"
                >
                  <span>
                    {isExpanded ? 'Hide Prep Steps' : 'Show Prep & Reheat Guide'}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              </div>

              {isExpanded && (
                <div className="mt-3 rounded-xl bg-slate-50 p-4 text-xs sm:text-sm space-y-3 border border-slate-200/80">
                  {dish.macrosPerServing && (
                    <div className="flex flex-wrap gap-3 rounded-lg bg-white p-2.5 text-xs border border-slate-200">
                      <strong className="text-slate-900">
                        Per Serving Nutrition Estimate:
                      </strong>
                      <span>🔥 {dish.macrosPerServing.calories} Calories</span>
                      <span>💪 {dish.macrosPerServing.proteinGrams}g Protein</span>
                      <span>🌾 {dish.macrosPerServing.carbsGrams}g Carbs</span>
                      <span>🥑 {dish.macrosPerServing.fatGrams}g Fat</span>
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-slate-900 mb-1.5">
                      Low-Effort Batch Cooking Steps:
                    </div>
                    <ol className="list-decimal space-y-1.5 pl-5 text-slate-700">
                      {dish.steps.map((step, sIdx) => (
                        <li key={sIdx}>{step}</li>
                      ))}
                    </ol>
                  </div>
                  <div className="rounded-lg bg-emerald-50 p-2.5 text-xs text-emerald-950 border border-emerald-200">
                    <strong>Reheat &amp; Storage Tip:</strong> {dish.reheatTip}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
