'use client';

import { useState } from 'react';
import { ArrowRight, ListChecks, SlidersHorizontal } from 'lucide-react';
import { Banner, Button, Card, Chip, SegmentedControl, Sheet } from '@/components/ui';
import AiMealPlanControls from '@/components/AiMealPlanControls';
import AppLink from '@/modules/shell/AppLink';
import {
  useAccountContext, useDashboardContext, usePlanContext, usePreferencesContext, useShellContext,
} from '@/modules/shell/app-context';
import type { CookingVesselArchetype, DietaryConstraint, MacroGoal } from '@/types/domain';

// v2.0 M4-5a (wireframes Plan and Plan Preferences): the top of the Plan. The page's heading is for assistive technology (the shell's
// h1 names the screen); what is on screen is the servings stepper, a summary chip of the preferences that opens them in a sheet, a
// hint to mark the Pantry (only while nothing is marked, and it can be hidden), the cost summary, the link to the Trip, and the AI
// Chef controls. The preferences are the same three choices and the same handlers as the old bar (macro goal, dietary rules, cookware),
// the servings are the same batch-size action; only the layout moved. Nothing here is required to get standard suggestions.
const MACROS: ReadonlyArray<{ id: MacroGoal; label: string }> = [
  { id: 'ANY', label: 'All Macros' },
  { id: 'HIGH_PROTEIN', label: 'High-Protein (40g+)' },
  { id: 'LOW_CARB_KETO', label: 'Low-Carb / Keto' },
  { id: 'CALORIE_CONSCIOUS', label: '<460 kcal' },
  { id: 'BALANCED_FAMILY', label: 'Balanced' },
];
const DIETARY: ReadonlyArray<{ id: DietaryConstraint; label: string }> = [
  { id: 'GLUTEN_FREE', label: 'Gluten-Free' },
  { id: 'DAIRY_FREE', label: 'Dairy-Free' },
  { id: 'NUT_FREE', label: 'Nut-Free' },
  { id: 'VEGETARIAN_PESCATARIAN', label: 'Pescatarian' },
];
const VESSELS: ReadonlyArray<{ id: CookingVesselArchetype; label: string }> = [
  { id: 'ANY', label: 'All Vessels' },
  { id: 'SLOW_COOKER_INSTANT_POT', label: 'Slow Cooker / Instant Pot' },
  { id: 'CASSEROLE_SHEET_PAN', label: 'Sheet-Pan / 9x13' },
  { id: 'DUTCH_OVEN_BRAISE', label: 'Dutch Oven' },
  { id: 'BIG_BATCH_SKILLET', label: 'Skillet' },
];

export default function PlanHeader() {
  const { data, trioTotals, activeTrio } = useDashboardContext();
  const {
    targetServings, handleServingsChange, macroGoal, dietaryConstraints, applianceFilter, handleMacroGoalChange,
    handleToggleDietaryConstraint, handleVesselChange, handleClearProfileFilters: onClearProfileFilters,
  } = usePreferencesContext();
  const { showAiSignIn } = useShellContext();
  const { canUseAi, effectiveOnHandIds } = useAccountContext();
  const {
    aiLoading, customPrompt, aiBannerMessage, aiBannerTone, setAiBannerMessage, setCustomPrompt, handleGenerateAiPlan, useStandardSuggestions,
  } = usePlanContext();
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [hintHidden, setHintHidden] = useState(false);
  const filtered = macroGoal !== 'ANY' || dietaryConstraints.length > 0 || applianceFilter !== 'ANY';
  const summary = [
    macroGoal === 'ANY' ? 'Any macros' : MACROS.find((m) => m.id === macroGoal)?.label,
    dietaryConstraints.length === 0 ? 'No restrictions' : DIETARY.filter((d) => dietaryConstraints.includes(d.id)).map((d) => d.label).join(', '),
    ...(applianceFilter === 'ANY' ? [] : [VESSELS.find((v) => v.id === applianceFilter)?.label]),
  ].join(' · ');
  return (
    <section aria-labelledby="plan-title" className="space-y-3">
      <h2 id="plan-title" className="sr-only">Your 3-Dish Weekend Meal Prep Plan ({trioTotals.totalServings} Total Meals)</h2>

      {/* v0.4 Batch Serving Scaler (Ticket #9) */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted">Servings per dish</span>
        <SegmentedControl label="Servings per dish" value={String(targetServings) as '4' | '6' | '8'}
          options={[{ value: '4', label: '4' }, { value: '6', label: '6' }, { value: '8', label: '8' }]}
          onChange={(value) => handleServingsChange(Number(value) as 4 | 6 | 8)} />
      </div>

      <Button variant="secondary" className="h-auto w-full justify-between gap-3 py-2" onClick={() => setPrefsOpen(true)}>
        <span className="min-w-0 flex-1 text-left">{summary}</span>
        <span className="inline-flex shrink-0 items-center gap-1.5 text-accent"><SlidersHorizontal aria-hidden="true" className="size-4" />Edit preferences</span>
      </Button>

      {effectiveOnHandIds.length === 0 && !hintHidden && (
        <Banner onDismiss={() => setHintHidden(true)} dismissLabel="Hide hint">Mark what you have in Pantry to lower the cost.</Banner>
      )}

      <Card as="section" aria-label="Cost summary" className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-xs font-semibold uppercase text-muted">{'Additional / Serving'}</div>
            <div className="text-xl font-extrabold text-ink">${trioTotals.avgPerServing}</div>
            <div className="text-xs text-muted">across {trioTotals.totalServings} portions</div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase text-muted">{'Estimated additional grocery cost'}</div>
            <div className="text-xl font-extrabold text-ink">${trioTotals.totalBatchCost}</div>
            <div className="text-xs text-muted line-through">Reg ${trioTotals.totalRegularCost}</div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase text-muted">{'Price difference'}</div>
            <div className="text-xl font-extrabold text-save">${trioTotals.totalSavings}</div>
            <div className="text-xs text-muted">{'purchase prices only'}</div>
          </div>
        </div>
        {activeTrio.some((dish) => dish.additionalCostEstimateComplete === false) && <p className="text-sm text-warning">Known subtotal only — additional ingredients have no price.</p>}
        <p className="text-xs text-muted">
          {`Recipes in ${data.cityLabel} reflect your pantry availability and nutrition preferences. Estimated additional grocery cost assumes marked ingredients are on hand; quantities do not limit coverage. Staple estimates allocate recipe use; package checkout totals may differ.`}
          {' '}The strongest value match stays; two recipe slots rotate each Wednesday when enough recipes fit your profile. Planning cycle: {data.adCycleLabel}.
        </p>
        <AppLink
          to={{ module: 'shop', view: 'SHOPPING_LIST' }}
          className="inline-flex min-h-touch items-center gap-1.5 text-sm font-semibold text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <ListChecks aria-hidden="true" className="size-4" />
          <span>Open Shopping List &amp; Cart Bridge</span>
          <ArrowRight aria-hidden="true" className="size-4" />
        </AppLink>
      </Card>

      <AiMealPlanControls canUseAi={canUseAi} loading={aiLoading} prompt={customPrompt} banner={aiBannerMessage}
        bannerTone={aiBannerTone} onDismissBanner={() => setAiBannerMessage(null)} onPromptChange={setCustomPrompt} onGenerate={handleGenerateAiPlan} onSignIn={showAiSignIn}
        onUseStandard={useStandardSuggestions} />

      <Sheet open={prefsOpen} onClose={() => setPrefsOpen(false)} title="Preferences">
        <div className="space-y-4">
          <section aria-labelledby="plan-pref-macro" className="space-y-2">
            <h3 id="plan-pref-macro" className="text-sm font-bold uppercase tracking-wide text-muted">Macro Goal</h3>
            <div className="flex flex-wrap gap-2">
              {MACROS.map((m) => <Chip key={m.id} selected={macroGoal === m.id} onClick={() => handleMacroGoalChange(m.id)}>{m.label}</Chip>)}
            </div>
          </section>
          <section aria-labelledby="plan-pref-diet" className="space-y-2">
            <h3 id="plan-pref-diet" className="text-sm font-bold uppercase tracking-wide text-muted">Dietary Rules</h3>
            <div className="flex flex-wrap gap-2">
              {DIETARY.map((d) => <Chip key={d.id} selected={dietaryConstraints.includes(d.id)} onClick={() => handleToggleDietaryConstraint(d.id)}>{d.label}</Chip>)}
            </div>
          </section>
          <section aria-labelledby="plan-pref-vessel" className="space-y-2">
            <h3 id="plan-pref-vessel" className="text-sm font-bold uppercase tracking-wide text-muted">Cookware</h3>
            <div className="flex flex-wrap gap-2">
              {VESSELS.map((v) => <Chip key={v.id} selected={applianceFilter === v.id} onClick={() => handleVesselChange(v.id)}>{v.label}</Chip>)}
            </div>
          </section>
          <p className="text-sm text-muted">Changes apply to your next suggestions. Saved on this device until you sign in.</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => setPrefsOpen(false)}>Done</Button>
            {filtered && <Button variant="quiet" onClick={onClearProfileFilters}>Clear Profile Filters</Button>}
          </div>
        </div>
      </Sheet>
    </section>
  );
}
