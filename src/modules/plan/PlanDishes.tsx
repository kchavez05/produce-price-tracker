'use client';

import { Bookmark, Check } from 'lucide-react';
import { Badge, Button, Card } from '@/components/ui';
import { focusRing } from '@/components/ui/cx';
import AppLink from '@/modules/shell/AppLink';
import { useAccountContext, useDashboardContext, usePlanContext } from '@/modules/shell/app-context';

// v2.0 M4-5a and M4-5b (wireframe Plan): the three dishes as short cards. Each shows the title, its cost per serving as a tag, one line
// of protein, calories, vessel and times, the badges, and two actions: View dish (primary; a link to Dish Detail, M4-5b) and Save (a
// toggle). From 1024 px the open dish is marked in the list and its detail is the pane beside it. The ingredients, staples, steps and
// reheat tip are on Dish Detail, with their wording and numbers unchanged.
export default function PlanDishes({ selectedId = null }: { selectedId?: string | null }) {
  const { activeTrio } = useDashboardContext();
  const { handleToggleSaveRecipe } = usePlanContext();
  const { savedRecipeIds } = useAccountContext();
  return (
    <div className="space-y-3">
      {activeTrio.map((dish) => {
        const isSaved = Boolean(dish.savedInLibrary || savedRecipeIds[dish.id]);
        const selected = dish.id === selectedId;
        return (
          <Card as="article" key={dish.id} aria-label={dish.title} className={`space-y-3 ${selected ? 'wide:ring-2 wide:ring-accent' : ''}`}>
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
              <AppLink
                to={{ module: 'plan', dish: dish.id }}
                aria-current={selected ? 'page' : undefined}
                aria-label={`View dish: ${dish.title}`}
                className={`inline-flex min-h-touch flex-1 items-center justify-center rounded-control bg-accent px-4 text-base font-semibold text-on-accent ${focusRing}`}
              >
                View dish
              </AppLink>
              {/* v0.4 Save to Personal Blueprint Library (Ticket #10) */}
              <Button variant="secondary" aria-pressed={isSaved} onClick={() => handleToggleSaveRecipe(dish)} title="Save this recipe into your SQLite Personal Library">
                {isSaved ? <Check aria-hidden="true" className="size-4" /> : <Bookmark aria-hidden="true" className="size-4" />}
                <span>{isSaved ? 'Saved' : 'Save'}</span>
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
