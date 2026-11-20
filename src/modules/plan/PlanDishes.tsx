'use client';

import { Bookmark, Check, ChevronDown } from 'lucide-react';
import { Badge, Button, Card } from '@/components/ui';
import { renderStoreBadge } from '@/modules/shop/badges';
import { formatPantryRequirement } from '@/lib/pantry/recipe';
import { pantryPriceLabel } from '@/lib/pantry/pricing';
import {
  useAccountContext, useDashboardContext, useLocationContext, usePlanContext,
} from '@/modules/shell/app-context';

// v2.0 M4-5a (wireframe Plan): the three dishes as short cards. Each shows the title, its cost per serving as a tag, one line of
// protein, calories, vessel and times, the badges, and two actions: View dish (primary; it opens the full dish in place until Dish
// Detail takes it over in M4-5b) and Save (a toggle). The ingredients, staples, steps and reheat tip are the old card's, behind View
// dish, with their wording and numbers unchanged.
export default function PlanDishes() {
  const { activeTrio } = useDashboardContext();
  const { currentZip } = useLocationContext();
  const { expandedDishIds, setExpandedDishIds, handleToggleSaveRecipe } = usePlanContext();
  const { savedRecipeIds } = useAccountContext();
  return (
    <div className="space-y-3">
      {activeTrio.map((dish) => {
        const isExpanded = Boolean(expandedDishIds[dish.id]);
        const isSaved = Boolean(dish.savedInLibrary || savedRecipeIds[dish.id]);
        const panelId = `dish-${dish.id}`;
        return (
          <Card as="article" key={dish.id} aria-label={dish.title} className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-ink">{dish.title}</h3>
                <p className="text-sm text-muted">{dish.subtitle}</p>
              </div>
              <Badge tone="save" className="shrink-0">${dish.costPerServing.toFixed(2)}/srv</Badge>
            </div>

            {/* v1.2 Ticket #22: macro breakdown and dietary tags */}
            {dish.macrosPerServing && (
              <p className="text-sm text-ink">
                {dish.macrosPerServing.proteinGrams}g protein · {dish.macrosPerServing.calories} kcal · {dish.macrosPerServing.carbsGrams}g carbs · {dish.macrosPerServing.fatGrams}g fat
              </p>
            )}
            <p className="text-sm text-muted">{dish.appliance} · {dish.prepTimeMinutes}m prep · {dish.cookTimeMinutes}m cook</p>
            <div className="flex flex-wrap items-center gap-1.5 empty:hidden">
              {dish.freezerFriendly && <Badge>Freezer Friendly</Badge>}
              {dish.aiGenerated && <Badge tone="accent">Gemini AI Custom</Badge>}
              {(dish.macroBadges || []).map((badge) => <Badge key={badge} tone="save">{badge}</Badge>)}
            </div>
            {dish.adaptationNote && <p className="text-sm font-semibold text-ink">Smart Profile Adaptation: {dish.adaptationNote}</p>}
            {dish.pantryCoverage && <p className="text-sm text-ink">
              You have {dish.pantryCoverage.availableRequiredCount} of {dish.pantryCoverage.requiredCount} required ingredients.
              {dish.pantryCoverage.optionalCount > 0 && ` Optional: ${dish.pantryCoverage.availableOptionalCount} of ${dish.pantryCoverage.optionalCount} available.`}
              {dish.pantryPricing?.includesStaticEstimates && ' Includes static estimates.'}
              {dish.additionalCostEstimateComplete === false && ' Known subtotal only — additional ingredients have no price.'}
            </p>}

            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                className="flex-1"
                aria-expanded={isExpanded}
                aria-controls={panelId}
                onClick={() => setExpandedDishIds((prev) => ({ ...prev, [dish.id]: !prev[dish.id] }))}
              >
                <span>{isExpanded ? 'Hide dish' : 'View dish'}</span>
                <ChevronDown aria-hidden="true" className={`size-4 transition-transform motion-reduce:transition-none ${isExpanded ? 'rotate-180' : ''}`} />
              </Button>
              {/* v0.4 Save to Personal Blueprint Library (Ticket #10) */}
              <Button variant="secondary" aria-pressed={isSaved} onClick={() => handleToggleSaveRecipe(dish)} title="Save this recipe into your SQLite Personal Library">
                {isSaved ? <Check aria-hidden="true" className="size-4" /> : <Bookmark aria-hidden="true" className="size-4" />}
                <span>{isSaved ? 'Saved' : 'Save'}</span>
              </Button>
            </div>

            <div id={panelId} hidden={!isExpanded} className="space-y-4 border-t border-border pt-3">
              {isExpanded && <>
                <p className="text-sm text-muted">
                  {'Additional / Serving'} ({dish.servings} srv): <strong className="text-ink">${dish.costPerServing.toFixed(2)}</strong>
                  {' · '}{'Additional batch estimate:'} <strong className="text-ink">${dish.totalBatchCost.toFixed(2)}</strong>
                  {' · '}{'Price difference'} <strong className="text-save">${dish.totalBatchSavings.toFixed(2)}</strong>
                </p>
                <section aria-label="Recipe ingredients" className="space-y-2">
                  <h4 className="text-sm font-bold uppercase tracking-wide text-muted">{'Recipe ingredients'} ({dish.servings} Servings)</h4>
                  <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {dish.matchedIngredients.map((ing, i) => (
                      <li key={`${dish.id}-ing-${i}`} className={`rounded-control p-3 text-sm ${ing.isOnHand ? 'bg-chip' : 'bg-bg'}`}>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-semibold text-muted">{ing.slotLabel}</span>
                          {ing.isOnHand ? <Badge>Already have</Badge> : renderStoreBadge(ing.store, currentZip)}
                        </div>
                        <div className="mt-1 font-bold text-ink">{ing.ingredientName}</div>
                        <div className="mt-1 flex items-baseline justify-between gap-2">
                          <span className="text-muted">
                            {(ing.isOnHand ? 'Make sure you have:' : ing.optional ? 'Optional:' : 'Need to buy:')}{' '}
                            <strong className="text-ink">{ing.quantityUsed} {ing.unit}</strong>{' '}
                            {(!ing.isOnHand) && <> (@ ${ing.unitCost.toFixed(2)}/{ing.unit})</>}
                          </span>
                          <span className="font-extrabold text-ink">{`$${ing.slotCost.toFixed(2)}`}</span>
                        </div>
                        <div className="mt-1.5 flex items-center justify-between border-t border-border pt-1.5 text-xs text-muted">
                          <span>{ing.rawDealText}</span>
                          {!ing.isOnHand && ing.dealType === 'DIGITAL_COUPON' && <span className="font-semibold text-ink">App Coupon</span>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>

                <div className="text-sm text-muted">
                  <strong className="text-ink">{'Staples (recipe-use estimate)'} (+${dish.estimatedPantryCost.toFixed(2)}):</strong>
                  <ul className="mt-2 space-y-1">
                    {(dish.pantryPricing?.rows ?? []).map((row) => (
                      <li key={row.requirementKey}>
                        {formatPantryRequirement(row)} — {row.estimatedCost === null ? '' : `$${row.estimatedCost.toFixed(2)} · `}{pantryPriceLabel(row)}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-3 rounded-control bg-chip p-3 text-sm">
                  {dish.macrosPerServing && (
                    <p className="flex flex-wrap gap-x-3 text-ink">
                      <strong>Per Serving Nutrition Estimate:</strong>
                      <span>{dish.macrosPerServing.calories} Calories</span>
                      <span>{dish.macrosPerServing.proteinGrams}g Protein</span>
                      <span>{dish.macrosPerServing.carbsGrams}g Carbs</span>
                      <span>{dish.macrosPerServing.fatGrams}g Fat</span>
                    </p>
                  )}
                  <div>
                    <div className="mb-1.5 font-bold text-ink">Low-Effort Batch Cooking Steps:</div>
                    <ol className="list-decimal space-y-1.5 pl-5 text-ink">
                      {dish.steps.map((step, sIdx) => <li key={sIdx}>{step}</li>)}
                    </ol>
                  </div>
                  <p className="text-ink"><strong>Reheat &amp; Storage Tip:</strong> {dish.reheatTip}</p>
                </div>
              </>}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
