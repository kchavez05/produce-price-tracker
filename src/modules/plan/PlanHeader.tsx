'use client';

import { ArrowRight, Flame, ListChecks, SlidersHorizontal, Users } from 'lucide-react';
import AiMealPlanControls from '@/components/AiMealPlanControls';
import {
  useAccountContext, useDashboardContext, usePlanContext, usePreferencesContext, useShellContext,
} from '@/modules/shell/app-context';
import type { CookingVesselArchetype, DietaryConstraint, MacroGoal } from '@/types/domain';

// Moved verbatim from MealPrepDashboard (v2.0 M3 Phase A.3, Meal Plan header). Since Phase B.2b it reads the app's state from the
// context hooks instead of props; the markup is unchanged.

export default function PlanHeader() {
  const { data, trioTotals, activeTrio } = useDashboardContext();
  const {
    targetServings, handleServingsChange, macroGoal, dietaryConstraints, applianceFilter, handleMacroGoalChange,
    handleToggleDietaryConstraint, handleVesselChange, handleClearProfileFilters: onClearProfileFilters,
  } = usePreferencesContext();
  const { setActiveTab, showAiSignIn } = useShellContext();
  const { canUseAi } = useAccountContext();
  const {
    aiLoading, customPrompt, aiBannerMessage, setCustomPrompt, handleGenerateAiPlan, useStandardSuggestions,
  } = usePlanContext();
  return (
    <section className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-950 p-5 text-white shadow-md">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
            <Flame className="h-3.5 w-3.5" />
            <span>
              Smart Kitchen Batch Trio (Stews, Braises, Sheet-Pans &amp; Casseroles)
            </span>
          </div>
          <h2 className="mt-2 text-xl font-extrabold sm:text-2xl">
            Your 3-Dish Weekend Meal Prep Plan ({trioTotals.totalServings} Total Meals)
          </h2>
          <p className="mt-1 text-xs text-slate-300 sm:text-sm">
            {`Recipes in ${data.cityLabel} reflect your pantry availability and nutrition preferences. Estimated additional grocery cost assumes marked ingredients are on hand; quantities do not limit coverage. Staple estimates allocate recipe use; package checkout totals may differ.`}
            {' '}The strongest value match stays; two recipe slots rotate each Wednesday when enough recipes fit your profile. Planning cycle: {data.adCycleLabel}.
          </p>

          {/* v0.4 Batch Serving Scaler (Ticket #9) + Open Shopping List Button */}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 p-1 text-xs">
              <span className="flex items-center gap-1 px-2 font-semibold text-emerald-200">
                <Users className="h-3.5 w-3.5" /> Batch Size:
              </span>
              {([4, 6, 8] as const).map((srv) => (
                <button
                  key={srv}
                  onClick={() => handleServingsChange(srv)}
                  className={`rounded-lg px-2.5 py-1 font-bold transition ${
                    targetServings === srv
                      ? 'bg-emerald-400 text-slate-950 shadow-2xs'
                      : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  {srv} Srv / Dish
                </button>
              ))}
            </div>

            <button
              onClick={() => setActiveTab('SHOPPING_LIST')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-500 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-400"
            >
              <ListChecks className="h-4 w-4" />
              <span>Open Shopping List &amp; Cart Bridge</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 rounded-xl border border-white/15 bg-white/10 p-3 text-center backdrop-blur-xs sm:min-w-[360px]">
          <div>
            <div className="text-[11px] text-slate-300 uppercase">{'Additional / Serving'}</div>
            <div className="text-xl font-black text-emerald-300">
              ${trioTotals.avgPerServing}
            </div>
            <div className="text-[10px] text-slate-400">
              across {trioTotals.totalServings} portions
            </div>
          </div>
          <div className="border-x border-white/15 px-2">
            <div className="text-[11px] text-slate-300 uppercase">
              {'Estimated additional grocery cost'}
            </div>
            <div className="text-xl font-black text-white">
              ${trioTotals.totalBatchCost}
            </div>
            <div className="text-[10px] text-slate-400 line-through">
              Reg ${trioTotals.totalRegularCost}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-amber-300 uppercase">{'Price difference'}</div>
            <div className="text-xl font-black text-amber-300">
              ${trioTotals.totalSavings}
            </div>
            <div className="text-[10px] text-emerald-200">{'purchase prices only'}</div>
          </div>
        </div>
      </div>

      {activeTrio.some((dish) => dish.additionalCostEstimateComplete === false) && <p className="mt-3 text-sm text-amber-200">Known subtotal only — additional ingredients have no price.</p>}
      {/* v1.2 Ticket #22: Dietary Preferences, Macro Goals & Cooking Vessel Archetype Bar */}
      <div className="mt-4 rounded-xl border border-white/15 bg-black/25 p-3.5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>
              Personalize Nutrition Profile, Dietary Filters &amp; Cooking Vessel (Ticket #22)
            </span>
          </div>
          {(macroGoal !== 'ANY' ||
            dietaryConstraints.length > 0 ||
            applianceFilter !== 'ANY') && (
            <button
              type="button"
              onClick={onClearProfileFilters}
              className="text-[11px] font-semibold text-amber-300 underline hover:text-white"
            >
              Clear Profile Filters
            </button>
          )}
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          {/* 1. Macro Goal Selector */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Target Macro Goal:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { id: 'ANY', label: 'All Macros' },
                  { id: 'HIGH_PROTEIN', label: '💪 High-Protein (40g+)' },
                  { id: 'LOW_CARB_KETO', label: '🥑 Low-Carb / Keto' },
                  { id: 'CALORIE_CONSCIOUS', label: '🔥 <460 kcal' },
                  { id: 'BALANCED_FAMILY', label: '🍲 Balanced' },
                ] as { id: MacroGoal; label: string }[]
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleMacroGoalChange(m.id)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                    macroGoal === m.id
                      ? 'bg-emerald-400 text-slate-950 shadow-2xs'
                      : 'bg-white/10 text-slate-200 hover:bg-white/20'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Dietary Constraints */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Dietary Rules (Adapts Slots):
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { id: 'GLUTEN_FREE', label: '🌾 Gluten-Free' },
                  { id: 'DAIRY_FREE', label: '🥛 Dairy-Free' },
                  { id: 'NUT_FREE', label: '🥜 Nut-Free' },
                  { id: 'VEGETARIAN_PESCATARIAN', label: '🐟 Pescatarian' },
                ] as { id: DietaryConstraint; label: string }[]
              ).map((d) => {
                const active = dietaryConstraints.includes(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => handleToggleDietaryConstraint(d.id)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                      active
                        ? 'bg-amber-400 text-slate-950 shadow-2xs'
                        : 'bg-white/10 text-slate-200 hover:bg-white/20'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Cooking Vessel Archetype */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Cooking Vessel Archetype:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { id: 'ANY', label: 'All Vessels' },
                  {
                    id: 'SLOW_COOKER_INSTANT_POT',
                    label: '⚡ Slow Cooker / Instant Pot',
                  },
                  { id: 'CASSEROLE_SHEET_PAN', label: '🔥 Sheet-Pan / 9x13' },
                  { id: 'DUTCH_OVEN_BRAISE', label: '🍲 Dutch Oven' },
                  { id: 'BIG_BATCH_SKILLET', label: '🍳 Skillet' },
                ] as { id: CookingVesselArchetype; label: string }[]
              ).map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => handleVesselChange(v.id)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                    applianceFilter === v.id
                      ? 'bg-sky-400 text-slate-950 shadow-2xs'
                      : 'bg-white/10 text-slate-200 hover:bg-white/20'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AiMealPlanControls canUseAi={canUseAi} loading={aiLoading} prompt={customPrompt} banner={aiBannerMessage}
        onPromptChange={setCustomPrompt} onGenerate={handleGenerateAiPlan} onSignIn={showAiSignIn}
        onUseStandard={useStandardSuggestions} />

    </section>
  );
}
