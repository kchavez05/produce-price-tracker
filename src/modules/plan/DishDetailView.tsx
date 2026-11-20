'use client';

import { Bookmark, Check, ChevronLeft, ListChecks } from 'lucide-react';
import { Badge, Button, EmptyState } from '@/components/ui';
import { focusRing } from '@/components/ui/cx';
import { formatPantryRequirement } from '@/lib/pantry/recipe';
import { pantryPriceLabel } from '@/lib/pantry/pricing';
import AppLink from '@/modules/shell/AppLink';
import { renderStoreBadge } from '@/modules/shop/badges';
import {
  useAccountContext, useDashboardContext, useLocationContext, usePlanContext,
} from '@/modules/shell/app-context';

// v2.0 M4-5b (wireframes Plan Dish Detail and iPad Plan): one dish in full. Below 1024 px it is its own screen with a Back link to the
// Plan; from 1024 px it is the pane beside the list, with no Back. It has the title and cost per serving, one line of servings,
// protein, calories and vessel, the ingredients with where each is bought or that it is already at home, the staples, the method with the
// nutrition and the reheat tip, and two actions: View shopping list (primary; the Trip is built from the plan's dishes, so there is
// nothing to add to it) and Save. The content is the old card's expanded view, with its wording and numbers unchanged. The dish is
// found among this week's dishes first, then among all the ranked blueprints; one that is in neither says so.
export default function DishDetailView({ dishId }: { dishId: string }) {
  const { activeTrio, data } = useDashboardContext();
  const { currentZip } = useLocationContext();
  const { handleToggleSaveRecipe } = usePlanContext();
  const { savedRecipeIds } = useAccountContext();
  const dish = activeTrio.find((candidate) => candidate.id === dishId) ?? data.allRankedDishes.find((candidate) => candidate.id === dishId);
  const back = (
    <AppLink to={{ module: 'plan' }} className={`inline-flex min-h-touch items-center gap-1 text-accent wide:hidden ${focusRing}`}>
      <ChevronLeft aria-hidden="true" className="size-5" />
      <span>Plan</span>
    </AppLink>
  );
  if (!dish) {
    return (
      <div>
        {back}
        <EmptyState
          title="This dish is not available"
          description="The plan may have changed, or the link is old. Go back to the Plan to see this week's dishes."
          action={<AppLink to={{ module: 'plan' }} className={`inline-flex min-h-touch items-center text-accent underline ${focusRing}`}>Show the Plan</AppLink>}
        />
      </div>
    );
  }
  const isSaved = Boolean(dish.savedInLibrary || savedRecipeIds[dish.id]);
  const macros = dish.macrosPerServing;
  return (
    <article aria-label={`${dish.title}, Dish Detail`} className="space-y-4">
      {back}
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-xl font-bold text-ink">{dish.title}</h2>
        <Badge tone="save" className="shrink-0">${dish.costPerServing.toFixed(2)}/srv</Badge>
      </div>
      <p className="text-sm text-muted">
        {dish.servings} servings{macros ? ` · ${macros.proteinGrams}g protein · ${macros.calories} cal per serving` : ''} · {dish.appliance}
        {' · '}{dish.prepTimeMinutes}m prep · {dish.cookTimeMinutes}m cook
      </p>
      {dish.subtitle && <p className="text-sm text-ink">{dish.subtitle}</p>}
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
      <p className="text-sm text-muted">
        {'Additional / Serving'} ({dish.servings} srv): <strong className="text-ink">${dish.costPerServing.toFixed(2)}</strong>
        {' · '}{'Additional batch estimate:'} <strong className="text-ink">${dish.totalBatchCost.toFixed(2)}</strong>
        {' · '}{'Price difference'} <strong className="text-save">${dish.totalBatchSavings.toFixed(2)}</strong>
      </p>

      <section aria-labelledby="dish-ingredients" className="space-y-2">
        <h3 id="dish-ingredients" className="text-sm font-bold uppercase tracking-wide text-muted">{'Recipe ingredients'} ({dish.servings} Servings)</h3>
        <ul className="divide-y divide-border rounded-card bg-surface shadow-card">
          {dish.matchedIngredients.map((ing, i) => (
            <li key={`${dish.id}-ing-${i}`} className="space-y-1 px-4 py-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-muted">{ing.slotLabel}</span>
                  <div className="font-bold text-ink">{ing.ingredientName}</div>
                </div>
                {ing.isOnHand ? <Badge>Already have</Badge> : renderStoreBadge(ing.store, currentZip)}
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-muted">
                  {(ing.isOnHand ? 'Make sure you have:' : ing.optional ? 'Optional:' : 'Need to buy:')}{' '}
                  <strong className="text-ink">{ing.quantityUsed} {ing.unit}</strong>{' '}
                  {(!ing.isOnHand) && <> (@ ${ing.unitCost.toFixed(2)}/{ing.unit})</>}
                </span>
                <span className="font-extrabold text-ink">{`$${ing.slotCost.toFixed(2)}`}</span>
              </div>
              <div className="flex items-center justify-between gap-2 text-xs text-muted">
                <span>{ing.rawDealText}</span>
                {!ing.isOnHand && ing.dealType === 'DIGITAL_COUPON' && <span className="font-semibold text-ink">App Coupon</span>}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="dish-staples" className="space-y-2 text-sm text-muted">
        <h3 id="dish-staples" className="text-sm font-bold uppercase tracking-wide text-muted">{'Staples (recipe-use estimate)'} (+${dish.estimatedPantryCost.toFixed(2)})</h3>
        <ul className="space-y-1">
          {(dish.pantryPricing?.rows ?? []).map((row) => (
            <li key={row.requirementKey}>
              {formatPantryRequirement(row)} — {row.estimatedCost === null ? '' : `$${row.estimatedCost.toFixed(2)} · `}{pantryPriceLabel(row)}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="dish-method" className="space-y-2">
        <h3 id="dish-method" className="text-sm font-bold uppercase tracking-wide text-muted">Method</h3>
        <div className="space-y-3 rounded-card bg-chip p-4 text-sm text-ink">
          {macros && (
            <p className="flex flex-wrap gap-x-3">
              <strong>Per Serving Nutrition Estimate:</strong>
              <span>{macros.calories} Calories</span>
              <span>{macros.proteinGrams}g Protein</span>
              <span>{macros.carbsGrams}g Carbs</span>
              <span>{macros.fatGrams}g Fat</span>
            </p>
          )}
          <div>
            <div className="mb-1.5 font-bold">Low-Effort Batch Cooking Steps:</div>
            <ol className="list-decimal space-y-1.5 pl-5">
              {dish.steps.map((step, index) => <li key={index}>{step}</li>)}
            </ol>
          </div>
          <p><strong>Reheat &amp; Storage Tip:</strong> {dish.reheatTip}</p>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <AppLink
          to={{ module: 'shop', view: 'SHOPPING_LIST' }}
          className={`inline-flex min-h-touch flex-1 items-center justify-center gap-2 rounded-control bg-accent px-4 text-base font-semibold text-on-accent ${focusRing}`}
        >
          <ListChecks aria-hidden="true" className="size-4" />
          <span>View shopping list</span>
        </AppLink>
        {/* v0.4 Save to Personal Blueprint Library (Ticket #10) */}
        <Button variant="secondary" aria-pressed={isSaved} onClick={() => handleToggleSaveRecipe(dish)} title="Save this recipe into your SQLite Personal Library">
          {isSaved ? <Check aria-hidden="true" className="size-4" /> : <Bookmark aria-hidden="true" className="size-4" />}
          <span>{isSaved ? 'Saved' : 'Save'}</span>
        </Button>
      </div>
    </article>
  );
}
