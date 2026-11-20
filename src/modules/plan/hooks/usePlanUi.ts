import { useState, useEffect, useRef, type RefObject } from 'react';
import { withoutDerivedPantryPricing } from '@/lib/pantry/saved-pricing';
import { aiRetryHint, createAiRequestFence } from '@/lib/ai/client-request';
import type { useAccountAndPantry } from '@/modules/shell/hooks/useAccountAndPantry';
import type { useDashboardPayload } from '@/modules/shell/hooks/useDashboardPayload';
import type {
  CookingVesselArchetype, DietaryConstraint, MacroGoal, RecommendedDish, StoreChain,
} from '@/types/domain';

// Moved verbatim from MealPrepDashboard (v2.0 M3 Phase B.1c): the Plan view state and the AI plan actions. All of it
// survives navigation (owner decision 1), so the provider keeps it, not the Plan components. Keep these when editing:
//  1. The AI request fence, the customAiOwner and customAiContext refs and the pantry owner ref live here, never in a
//     route component: a request in flight must survive a module switch, and a late response must still be dropped
//     when the owner or the plan context changed (the fence compares both).
//  2. Hook order: usePlanUi comes before useDerivedDashboard (which reads customPrompt, customAiDishes and the refs);
//     usePlanActions comes after it, where the fence effect used to run, so effect order is unchanged.
//  3. The handlers are plain functions recreated every render (not memoized), like the closures they were.
// v2.0 M4-5b: the dishes' in-place expansion state is gone; a dish's full view is Dish Detail, at its own path.
export function usePlanUi() {
  const [showAllBlueprints, setShowAllBlueprints] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiBannerMessage, setAiBannerMessage] = useState<string | null>(null);
  const [customAiDishes, setCustomAiDishes] = useState<RecommendedDish[] | null>(null);
  const customAiOwner = useRef<string | null>(null);
  const customAiContext = useRef<string>('');
  return {
    showAllBlueprints, setShowAllBlueprints, customPrompt, setCustomPrompt,
    aiLoading, setAiLoading, aiBannerMessage, setAiBannerMessage, customAiDishes, setCustomAiDishes, customAiOwner,
    customAiContext,
  };
}

type Account = ReturnType<typeof useAccountAndPantry>;
interface PlanActionsArgs {
  pantryOwner: Account['pantry']['owner'];
  pantryOwnerRef: Account['pantryOwnerRef'];
  canUseAi: boolean;
  savedRecipeIds: Account['savedRecipeIds'];
  setSavedLibrary: Account['setSavedLibrary'];
  syncDashboard: ReturnType<typeof useDashboardPayload>['syncDashboard'];
  showAiSignIn: () => void;
  mealContextSignature: string;
  activeTrio: RecommendedDish[];
  pinnedIds: string[];
  effectiveOnHandIds: string[];
  targetServings: 4 | 6 | 8;
  customPrompt: string;
  storeFilter: 'ALL' | StoreChain;
  currentZip: string;
  cityLabel: string;
  macroGoal: MacroGoal;
  dietaryConstraints: DietaryConstraint[];
  applianceFilter: CookingVesselArchetype;
  customAiOwner: RefObject<string | null>;
  customAiContext: RefObject<string>;
  setAiLoading: (loading: boolean) => void;
  setAiBannerMessage: (message: string | null) => void;
  setCustomAiDishes: (dishes: RecommendedDish[] | null) => void;
}

export function usePlanActions({
  pantryOwner, pantryOwnerRef, canUseAi, savedRecipeIds, setSavedLibrary, syncDashboard, showAiSignIn, mealContextSignature,
  activeTrio, pinnedIds, effectiveOnHandIds, targetServings, customPrompt, storeFilter, currentZip, cityLabel, macroGoal,
  dietaryConstraints, applianceFilter, customAiOwner, customAiContext, setAiLoading, setAiBannerMessage, setCustomAiDishes,
}: PlanActionsArgs) {
  const aiContextRef = useRef(mealContextSignature);
  aiContextRef.current = mealContextSignature;
  const aiRequests = useRef<ReturnType<typeof createAiRequestFence> | null>(null);
  if (!aiRequests.current) aiRequests.current = createAiRequestFence();
  useEffect(() => {
    const requests = aiRequests.current;
    requests?.cancel();
    setAiLoading(false);
    setAiBannerMessage(null);
    return () => { requests?.cancel(); };
  }, [pantryOwner, mealContextSignature, setAiLoading, setAiBannerMessage]); // the setters are useState setters: stable, so the effect still runs only when the owner or the context changes


  async function handleToggleSaveRecipe(dish: RecommendedDish) {
    const requestOwner = pantryOwnerRef.current;
    const isCurrentlySaved = Boolean(dish.savedInLibrary || savedRecipeIds[dish.id]);
    try {
      const res = isCurrentlySaved
        ? await fetch(`/api/saved-recipes?id=${encodeURIComponent(dish.id)}`, { method: 'DELETE' })
        : await fetch('/api/saved-recipes', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dish: withoutDerivedPantryPricing(dish) }),
          });
      if (!res.ok) throw new Error('Recipe save failed');
      if (pantryOwnerRef.current !== requestOwner) return;
      if (requestOwner) setSavedLibrary((previous) => ({ owner: requestOwner,
        recipes: isCurrentlySaved ? previous.recipes.filter((entry) => entry.id !== dish.id) : [...previous.recipes.filter((entry) => entry.id !== dish.id), { ...withoutDerivedPantryPricing(dish), savedInLibrary: true }] }));
    } catch {
      setAiBannerMessage('Unable to update your saved recipes. Please try again.');
      return;
    }
    syncDashboard(storeFilter, pinnedIds, effectiveOnHandIds, targetServings);
  }

  function useStandardSuggestions() {
    aiRequests.current?.cancel();
    setAiLoading(false);
    setCustomAiDishes(null);
    customAiOwner.current = null;
    customAiContext.current = '';
    setAiBannerMessage('Using standard meal-prep suggestions.');
  }

  async function handleGenerateAiPlan() {
    if (!canUseAi) { showAiSignIn(); return; }
    const ticket = aiRequests.current!.begin(pantryOwnerRef.current, mealContextSignature);
    setAiLoading(true);
    setAiBannerMessage(null);
    try {
      const res = await fetch('/api/ai-meal-plan', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ticket.controller.signal,
        body: JSON.stringify({ requestId: ticket.id, pinnedIngredientIds: pinnedIds, onHandIngredientIds: effectiveOnHandIds,
          targetServings, customPreference: customPrompt, storeFilter, zipCode: currentZip, cityLabel,
          macroGoal, dietaryConstraints, applianceFilter }),
      });
      const result = await res.json();
      if (!aiRequests.current!.isCurrent(ticket, pantryOwnerRef.current, aiContextRef.current)) return;
      if (res.ok && Array.isArray(result.dishes)) {
        customAiOwner.current = ticket.owner;
        customAiContext.current = ticket.context;
        setCustomAiDishes(result.dishes);
        setAiBannerMessage(result.message || 'Updated 3-dish meal-prep plan.');
      } else {
        setCustomAiDishes(null);
        const retry = aiRetryHint(res.headers.get('Retry-After'));
        setAiBannerMessage((typeof result.error === 'string' ? result.error : 'Unable to generate a meal plan. Standard suggestions remain available.') + retry);
        if (res.status === 401) showAiSignIn();
      }
    } catch {
      if (!aiRequests.current!.isCurrent(ticket, pantryOwnerRef.current, aiContextRef.current)) return;
      setCustomAiDishes(null);
      setAiBannerMessage('Unable to reach AI assistance. Standard suggestions remain available. Try again when connected.');
    } finally {
      if (aiRequests.current!.isCurrent(ticket, pantryOwnerRef.current, aiContextRef.current)) {
        setAiLoading(false);
        aiRequests.current!.complete(ticket);
      }
    }
  }

  // Promote a blueprint into the top three (moved unchanged from the Meal Plan tab's inline click handler).
  function handlePromoteDish(dish: RecommendedDish) {
    customAiOwner.current = pantryOwner;
    customAiContext.current = mealContextSignature;
    setCustomAiDishes([
      dish,
      ...activeTrio.filter((d) => d.id !== dish.id).slice(0, 2),
    ]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return { handleToggleSaveRecipe, useStandardSuggestions, handleGenerateAiPlan, handlePromoteDish };
}
