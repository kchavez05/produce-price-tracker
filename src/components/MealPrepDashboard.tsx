'use client';

import { createPantryPriceContext } from '@/lib/pantry/pricing';
import { withoutDerivedPantryPricing } from '@/lib/pantry/saved-pricing';

import { recipePantryIngredientId } from '@/lib/pantry/recipe-identity';
import { applyPantryToRecipe } from '@/lib/pantry/recipe';


import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { usePantry } from '@/hooks/usePantry';
import { availablePantryIngredientIds, pantryCatalog } from '@/lib/pantry/model';
import { rankMealPrepDishes } from '@/lib/meal-prep-matcher';
const VirtualPantry = dynamic(() => import('@/components/VirtualPantry'));
import {
  CommodityCategory,
  CookingVesselArchetype,
  DashboardPayload,
  DietaryConstraint,
  MacroGoal,
  RecommendedDish,
  StoreChain,
  UserSyncPayload,
  WeeklySyncCronResult,
} from '@/types/domain';
import {
  ALL_STORE_CHAINS,
} from '@/data/store-registry';
import { buildShoppingListAndStoreComparison } from '@/lib/shopping-list';
import {
  formatShoppingListForClipboard,
} from '@/lib/cart-exporter';
import ZipPanel from '@/modules/shell/ZipPanel';
import StoresPanel from '@/modules/shell/StoresPanel';
import AlertsPanel from '@/modules/shell/AlertsPanel';
import RadarSection from '@/modules/shop/RadarSection';
import TripSection from '@/modules/shop/TripSection';
import BoardAlerts from '@/modules/shop/BoardAlerts';
import BoardControls from '@/modules/shop/BoardControls';
import BoardLeaderboard from '@/modules/shop/BoardLeaderboard';
import HeaderPrimary from '@/modules/shell/HeaderPrimary';
import StoreFilterBar from '@/modules/shell/StoreFilterBar';
import FreshnessNotice from '@/modules/shell/FreshnessNotice';
import PrimaryNav from '@/modules/shell/PrimaryNav';
import PlanDishes from '@/modules/plan/PlanDishes';
import PlanBlueprints from '@/modules/plan/PlanBlueprints';
import PlanHeader from '@/modules/plan/PlanHeader';
import AccountModal from '@/components/AccountModal';
import { useUserSync } from '@/hooks/useUserSync';
import { aiRetryHint, createAiRequestFence } from '@/lib/ai/client-request';
import {
  DoorOpen,
} from 'lucide-react';

interface Props {
  initialData: DashboardPayload;
  barcodeEnabled?: boolean; speechConfigured?: boolean;
  cameraEnabled?: boolean;
  initialAccountId?: string | null;
  initialPrivateRecipes?: RecommendedDish[];
}

export default function MealPrepDashboard({ initialData, barcodeEnabled = false, speechConfigured = false, cameraEnabled = false, initialAccountId = null, initialPrivateRecipes = [] }: Props) {
  const [serverData, setData] = useState<DashboardPayload>(initialData);
  const [savedLibrary, setSavedLibrary] = useState<{ owner: string; recipes: RecommendedDish[] }>(() => ({ owner: initialAccountId ? `account:${initialAccountId}` : 'guest:ssr', recipes: initialPrivateRecipes }));
  const [activeTab, setActiveTab] = useState<
    'BOARD' | 'MEAL_PLAN' | 'SHOPPING_LIST' | 'RADAR'
  >('BOARD');
  const [storeFilter, setStoreFilter] = useState<'ALL' | StoreChain>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | CommodityCategory>('ALL');
  const [sortMode, setSortMode] = useState<
    'VALUE_SCORE' | 'LOWEST_PRICE' | 'BIGGEST_DISCOUNT'
  >('VALUE_SCORE');
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [targetServings, setTargetServings] = useState<4 | 6 | 8>(6);
  const [showPantry, setShowPantry] = useState(false);
  const pantryTrigger = useRef<HTMLButtonElement>(null);
  const [arbitrageToast, setArbitrageToast] = useState<string | null>(null);

  // v1.2 Ticket #22: Dietary Preferences, Macro Targets & Cooking Vessel Archetypes
  const [macroGoal, setMacroGoal] = useState<MacroGoal>('ANY');
  const [dietaryConstraints, setDietaryConstraints] = useState<DietaryConstraint[]>([]);
  const [applianceFilter, setApplianceFilter] = useState<CookingVesselArchetype>('ANY');

  // v1.2 Ticket #23: 1-Tap Curbside Cart Bridge & Multi-Store Export state
  const [copiedChecklist, setCopiedChecklist] = useState(false);
  const [showPrintSlipModal, setShowPrintSlipModal] = useState(false);

  const [expandedDishIds, setExpandedDishIds] = useState<Record<string, boolean>>({
    [initialData.recommendedTrio[0]?.id || '']: true,
  });
  const [showAllBlueprints, setShowAllBlueprints] = useState(false);

  // Shopping list & coupon checklist interactive state (v0.3 + v1.1)
  const [tripMode, setTripMode] = useState<'SPLIT' | StoreChain>('SPLIT');
  const [activeStores, setActiveStores] = useState<StoreChain[]>(() => {
    return initialData.activeStores || ALL_STORE_CHAINS;
  });
  const [showStoresModal, setShowStoresModal] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [clippedCoupons, setClippedCoupons] = useState<Record<string, boolean>>({});

  // AI Custom Chef state
  const [customPrompt, setCustomPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiBannerMessage, setAiBannerMessage] = useState<string | null>(null);
  const [customAiDishes, setCustomAiDishes] = useState<RecommendedDish[] | null>(null);
  const customAiOwner = useRef<string | null>(null);
  const customAiContext = useRef<string>('');

  // v1.0: Weekly Circular Cron & Smart Push Notifications Preview (Ticket #12)
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [cronSyncResult, setCronSyncResult] = useState<WeeklySyncCronResult | null>(null);
  const [cronSyncLoading, setCronSyncLoading] = useState(false);
  const [cronSyncError, setCronSyncError] = useState<string | null>(null);
  const [copiedDigest, setCopiedDigest] = useState(false);

  // Dynamic Zip Code / Location state (De-localization)
  const [currentZip, setCurrentZip] = useState(initialData.zipCode || '80542');
  const [showZipModal, setShowZipModal] = useState(false);
  const [zipInput, setZipInput] = useState(initialData.zipCode || '80542');
  const [zipLoading, setZipLoading] = useState(false);
  const [zipError, setZipError] = useState<string | null>(null);

  // v1.3 Tickets #26 - #30: User Account, Cloud Sync & Privacy Controls state
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountIntent, setAccountIntent] = useState<'account' | 'ai'>('account');

  const handleCloudHydrated = useCallback((payload: UserSyncPayload) => {
    if (!payload.authenticated || !payload.preferences) return;
    const prefs = payload.preferences;
    if (prefs.defaultZip && /^\d{5}$/.test(prefs.defaultZip)) {
      setCurrentZip(prefs.defaultZip);
      setZipInput(prefs.defaultZip);
    }
    if (
      Array.isArray(prefs.favoriteStoreIds) &&
      prefs.favoriteStoreIds.length > 0
    ) {
      setActiveStores(prefs.favoriteStoreIds);
    }
    if (prefs.macroGoal) setMacroGoal(prefs.macroGoal);
    if (Array.isArray(prefs.dietaryConstraints)) {
      setDietaryConstraints(prefs.dietaryConstraints);
    }
    if (prefs.vesselArchetype) setApplianceFilter(prefs.vesselArchetype);
    if (prefs.targetServings) setTargetServings(prefs.targetServings);
    if (Array.isArray(prefs.pinnedIngredientIds)) {
      setPinnedIds(prefs.pinnedIngredientIds);
    }

    setSavedLibrary({ owner: `account:${payload.profile!.id}`, recipes: payload.savedRecipes || [] });
  }, []);

  const userSync = useUserSync({
    onCloudStateHydrated: handleCloudHydrated,
    onSyncAcknowledged: () => {
      void syncDashboard(storeFilter, pinnedIds, effectiveOnHandIds, targetServings);
    },
  });
  const pantryAccountId = userSync.lastSyncedIso !== null ? userSync.profile?.id ?? null : initialAccountId;
  const pantry = usePantry(true, pantryAccountId);
  const savedRecipeIds = savedLibrary.owner === pantry.owner || (savedLibrary.owner === 'guest:ssr' && pantry.guest)
      ? Object.fromEntries(savedLibrary.recipes.map((dish) => [dish.id, true])) : {};
  const pantryOwnerRef = useRef(pantry.owner);
  pantryOwnerRef.current = pantry.owner;

  // Availability comes only from the private Pantry.
  const effectiveOnHandIds = useMemo(() => availablePantryIngredientIds(pantry.entries), [pantry.entries]);
  const [priceClock, setPriceClock] = useState(serverData.lastUpdatedIso);
  useEffect(() => {
    const refresh = () => setPriceClock(new Date().toISOString());
    refresh();
    const timer = window.setInterval(refresh, 60_000);
    window.addEventListener('focus', refresh);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, []);
  // No live source, contract or admission is configured. One snapshot serves every view.
  const pantryPriceContext = useMemo(() => createPantryPriceContext({
    nowIso: priceClock || new Date().toISOString(), marketId: currentZip,
    selectedLocationIds: [],
  }), [priceClock, currentZip]);
  const mealContextSignature = JSON.stringify({ available: [...effectiveOnHandIds].sort(), pinned: [...pinnedIds].sort(),
    targetServings, macroGoal, dietary: [...dietaryConstraints].sort(), vessel: applianceFilter,
    stores: [...activeStores].sort(), storeFilter, zip: currentZip, customPreference: customPrompt });
  const aiContextRef = useRef(mealContextSignature);
  aiContextRef.current = mealContextSignature;
  const aiRequests = useRef<ReturnType<typeof createAiRequestFence> | null>(null);
  if (!aiRequests.current) aiRequests.current = createAiRequestFence();
  const canUseAi = userSync.profile?.isCloudBacked === true && pantry.owner === `account:${userSync.profile.id}`;
  useEffect(() => {
    const requests = aiRequests.current;
    requests?.cancel();
    setAiLoading(false);
    setAiBannerMessage(null);
    return () => { requests?.cancel(); };
  }, [pantry.owner, mealContextSignature]);

  const data = useMemo(() => {

    const ranked = rankMealPrepDishes(serverData.commodities, pinnedIds, effectiveOnHandIds, targetServings, {
      macroGoal, dietaryConstraints, applianceFilter,
      pantryPriceContext,
      savedRecipes: savedLibrary.owner === pantry.owner || (savedLibrary.owner === 'guest:ssr' && pantry.guest) ? savedLibrary.recipes : [],
      now: new Date(serverData.lastUpdatedIso || Date.now()),
    });
    return { ...serverData, ...ranked };
  }, [serverData, pinnedIds, effectiveOnHandIds, targetServings, macroGoal, dietaryConstraints, applianceFilter, savedLibrary, pantry.owner, pantry.guest, pantryPriceContext]);

  useEffect(() => {
    try {
      const savedChecked = localStorage.getItem('mead_checked_items_v03');
      if (savedChecked) setCheckedItems(JSON.parse(savedChecked));
      const savedClipped = localStorage.getItem('mead_clipped_coupons_v03');
      if (savedClipped) setClippedCoupons(JSON.parse(savedClipped));

      let loadedMacroGoal = macroGoal;
      let loadedDietaryConstraints = dietaryConstraints;
      let loadedApplianceFilter = applianceFilter;
      const savedProfile = localStorage.getItem('pantrybot_nutrition_profile_v12');
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        if (parsed.macroGoal) {
          setMacroGoal(parsed.macroGoal);
          loadedMacroGoal = parsed.macroGoal;
        }
        if (Array.isArray(parsed.dietaryConstraints)) {
          setDietaryConstraints(parsed.dietaryConstraints);
          loadedDietaryConstraints = parsed.dietaryConstraints;
        }
        if (parsed.applianceFilter) {
          setApplianceFilter(parsed.applianceFilter);
          loadedApplianceFilter = parsed.applianceFilter;
        }
      }

      let loadedActiveStores = activeStores;
      const savedActiveStores = localStorage.getItem('pantrybot_active_stores');
      if (savedActiveStores) {
        try {
          const parsed = JSON.parse(savedActiveStores);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setActiveStores(parsed);
            loadedActiveStores = parsed;
          }
        } catch {
          // Ignore
        }
      }

      const savedZip = localStorage.getItem('pantrybot_user_zip');
      if (savedZip && /^\d{5}$/.test(savedZip) && savedZip !== data.zipCode) {
        setCurrentZip(savedZip);
        setZipInput(savedZip);
        syncDashboard(
          storeFilter,
          pinnedIds,
          effectiveOnHandIds,
          targetServings,
          savedZip,
          loadedActiveStores,
          loadedMacroGoal,
          loadedDietaryConstraints,
          loadedApplianceFilter
        );
      }
    } catch {
      // Ignore storage errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function persistProfileToLocalStorage(
    nextMacro: MacroGoal,
    nextDietary: DietaryConstraint[],
    nextVessel: CookingVesselArchetype
  ) {
    try {
      localStorage.setItem(
        'pantrybot_nutrition_profile_v12',
        JSON.stringify({
          macroGoal: nextMacro,
          dietaryConstraints: nextDietary,
          applianceFilter: nextVessel,
        })
      );
    } catch {
      // Ignore
    }
  }

  function toggleCheckedItem(key: string) {
    setCheckedItems((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem('mead_checked_items_v03', JSON.stringify(next));
      } catch {
        // Ignore
      }
      return next;
    });
  }

  function toggleClippedCoupon(key: string) {
    setClippedCoupons((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem('mead_clipped_coupons_v03', JSON.stringify(next));
      } catch {
        // Ignore
      }
      return next;
    });
  }

  async function syncDashboard(
    nextStore: 'ALL' | StoreChain = storeFilter,
    nextPinned: string[] = pinnedIds,
    nextOnHand: string[] = effectiveOnHandIds,
    nextServings: 4 | 6 | 8 = targetServings,
    nextZip: string = currentZip,
    nextActiveStores: StoreChain[] = activeStores,
    nextMacroGoal: MacroGoal = macroGoal,
    nextDietary: DietaryConstraint[] = dietaryConstraints,
    nextVessel: CookingVesselArchetype = applianceFilter
  ) {
    const requestOwner = pantryOwnerRef.current;
    try {
      const params = new URLSearchParams({
        zip: nextZip,
        store: nextStore,
        stores: nextActiveStores.join(','),
        pinned: nextPinned.join(','),
        onHand: nextOnHand.join(','),
        servings: String(nextServings),
        macroGoal: nextMacroGoal,
        dietary: nextDietary.join(','),
        vessel: nextVessel,
      });
      const res = await fetch(`/api/dashboard?${params.toString()}`);
      if (res.ok) {
        const updated: DashboardPayload = await res.json();
        if (pantryOwnerRef.current !== requestOwner) return;
        setData(updated);
        setCurrentZip(updated.zipCode);
      }
    } catch {
      // Ignore network hiccup
    }
  }

  function handleReviewStockUp() {
    setShowPantry(true);
    setArbitrageToast('Review your Pantry before stocking up. Record ingredients after purchase.');
  }

  async function handleForceCloudSync() {
    await pantry.retry();
    await userSync.pushCloudSync({ preferences: { defaultZip: currentZip, favoriteStoreIds: activeStores, macroGoal,
      dietaryConstraints, vesselArchetype: applianceFilter, targetServings, pinnedIngredientIds: pinnedIds } });
  }

  // v1.2 Ticket #22 Handlers: Macro Goal, Dietary Constraints, Cooking Vessel
  function handleMacroGoalChange(nextMacro: MacroGoal) {
    setMacroGoal(nextMacro);
    setCustomAiDishes(null);
    persistProfileToLocalStorage(nextMacro, dietaryConstraints, applianceFilter);
    userSync.pushCloudSync({
      preferences: {
        macroGoal: nextMacro,
        dietaryConstraints,
        vesselArchetype: applianceFilter,
      },
    });
    syncDashboard(
      storeFilter,
      pinnedIds,
      effectiveOnHandIds,
      targetServings,
      currentZip,
      activeStores,
      nextMacro,
      dietaryConstraints,
      applianceFilter
    );
  }

  function handleToggleDietaryConstraint(constraint: DietaryConstraint) {
    const exists = dietaryConstraints.includes(constraint);
    const nextDietary = exists
      ? dietaryConstraints.filter((c) => c !== constraint)
      : [...dietaryConstraints, constraint];
    setDietaryConstraints(nextDietary);
    setCustomAiDishes(null);
    persistProfileToLocalStorage(macroGoal, nextDietary, applianceFilter);
    userSync.pushCloudSync({
      preferences: {
        macroGoal,
        dietaryConstraints: nextDietary,
        vesselArchetype: applianceFilter,
      },
    });
    syncDashboard(
      storeFilter,
      pinnedIds,
      effectiveOnHandIds,
      targetServings,
      currentZip,
      activeStores,
      macroGoal,
      nextDietary,
      applianceFilter
    );
  }

  function handleVesselChange(nextVessel: CookingVesselArchetype) {
    setApplianceFilter(nextVessel);
    setCustomAiDishes(null);
    persistProfileToLocalStorage(macroGoal, dietaryConstraints, nextVessel);
    userSync.pushCloudSync({
      preferences: {
        macroGoal,
        dietaryConstraints,
        vesselArchetype: nextVessel,
      },
    });
    syncDashboard(
      storeFilter,
      pinnedIds,
      effectiveOnHandIds,
      targetServings,
      currentZip,
      activeStores,
      macroGoal,
      dietaryConstraints,
      nextVessel
    );
  }

  function handleToggleActiveStore(store: StoreChain) {
    setActiveStores((prev) => {
      let next: StoreChain[];
      if (prev.includes(store)) {
        if (prev.length <= 1) return prev;
        next = prev.filter((s) => s !== store);
      } else {
        next = [...prev, store];
      }
      try {
        localStorage.setItem('pantrybot_active_stores', JSON.stringify(next));
      } catch {
        // Ignore
      }
      userSync.pushCloudSync({
        preferences: {
          favoriteStoreIds: next,
        },
      });
      syncDashboard(
        storeFilter,
        pinnedIds,
        effectiveOnHandIds,
        targetServings,
        currentZip,
        next
      );
      return next;
    });
  }

  function handleTogglePin(ingredientId: string) {
    const exists = pinnedIds.includes(ingredientId);
    const nextPinned = exists
      ? pinnedIds.filter((id) => id !== ingredientId)
      : [...pinnedIds, ingredientId];
    setPinnedIds(nextPinned);
    setCustomAiDishes(null);
    syncDashboard(storeFilter, nextPinned, effectiveOnHandIds, targetServings);
  }

  function handleToggleOnHand(ingredientId: string) {
    const pantryId = recipePantryIngredientId(ingredientId);
    const ingredient = pantryCatalog.get(pantryId);
    if (!ingredient) {
      setShowPantry(true);
      setArbitrageToast('Choose the specific ingredient in Virtual Pantry. Grouped deals do not establish an exact ingredient identity.');
      return;
    }
    const existing = pantry.entries.find((entry) => entry.ingredientId === pantryId);
    void pantry.save({ ...(existing ?? { ingredientId: pantryId, displayName: ingredient.name }), available: !(existing?.available && !existing.deletedAtIso) }, existing?.id)
      .catch((error: unknown) => setArbitrageToast(error instanceof Error ? error.message : 'Could not update the pantry.'));
  }

  function handleServingsChange(nextServings: 4 | 6 | 8) {
    setTargetServings(nextServings);
    setCustomAiDishes(null);
    syncDashboard(storeFilter, pinnedIds, effectiveOnHandIds, nextServings);
  }

  function handleStoreChange(nextStore: 'ALL' | StoreChain) {
    setStoreFilter(nextStore);
    if (nextStore === 'ALL') {
      setTripMode('SPLIT');
    } else {
      setTripMode(nextStore);
    }
    setCustomAiDishes(null);
    syncDashboard(
      nextStore,
      pinnedIds,
      effectiveOnHandIds,
      targetServings,
      currentZip,
      activeStores
    );
  }

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

  function showAiSignIn() {
    setAccountIntent('ai');
    setShowAccountModal(true);
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
          targetServings, customPreference: customPrompt, storeFilter, zipCode: currentZip, cityLabel: data.cityLabel,
          macroGoal, dietaryConstraints, applianceFilter }),
      });
      const result = await res.json();
      if (!aiRequests.current!.isCurrent(ticket, pantryOwnerRef.current, aiContextRef.current)) return;
      if (res.ok && Array.isArray(result.dishes)) {
        customAiOwner.current = ticket.owner;
        customAiContext.current = ticket.context;
        setCustomAiDishes(result.dishes);
        setAiBannerMessage(result.message || 'Updated 3-dish meal-prep plan.');
        if (result.dishes[0]?.id) setExpandedDishIds({ [result.dishes[0].id]: true });
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

  async function handleZipSubmit(e?: React.FormEvent, overrideZip?: string) {
    if (e) e.preventDefault();
    const cleanZip = (overrideZip || zipInput).trim();
    if (!/^\d{5}$/.test(cleanZip)) {
      setZipError('Please enter a valid 5-digit US ZIP code.');
      return;
    }
    setZipError(null);
    setZipLoading(true);
    try {
      localStorage.setItem('pantrybot_user_zip', cleanZip);
      setCurrentZip(cleanZip);
      setZipInput(cleanZip);
      userSync.pushCloudSync({
        preferences: {
          defaultZip: cleanZip,
        },
      });
      await syncDashboard(
        storeFilter,
        pinnedIds,
        effectiveOnHandIds,
        targetServings,
        cleanZip
      );
      setShowZipModal(false);
    } catch {
      setZipError('Failed to load deals for this zip code.');
    } finally {
      setZipLoading(false);
    }
  }

  async function handleToggleAlertsModal() {
    const nextOpen = !showAlertsModal;
    setShowAlertsModal(nextOpen);
    if (nextOpen && !cronSyncResult) {
      setCronSyncLoading(true);
      try {
        const res = await fetch(
          `/api/cron/weekly-sync?cycle=preview_digest&zip=${encodeURIComponent(currentZip)}`
        );
        if (res.ok) {
          const payload: WeeklySyncCronResult = await res.json();
          setCronSyncResult(payload);
        }
      } catch {
        // Ignore
      } finally {
        setCronSyncLoading(false);
      }
    }
  }

  async function handleTriggerWeeklySync() {
    setCronSyncLoading(true);
    setCronSyncError(null);
    try {
      const res = await fetch('/api/cron/weekly-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cycle: 'manual_sync', zipCode: currentZip }),
      });
      const payload = await res.json();
      if (payload.fridayWeekendDigest) setCronSyncResult(payload);
      if (!res.ok) {
        setCronSyncError(payload.auditStorage === 'unavailable'
          ? 'Prices were checked, but the durable audit could not be saved. Please retry.'
          : 'Weekly refresh failed. Please retry.');
        return;
      }
      await syncDashboard(
        storeFilter, pinnedIds, effectiveOnHandIds, targetServings, currentZip
      );
    } catch {
      setCronSyncError('Weekly refresh could not connect. Please retry.');
    } finally {
      setCronSyncLoading(false);
    }
  }

  function handleCopyMarkdownDigest() {
    const text = cronSyncResult?.fridayWeekendDigest?.markdownDigest;
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedDigest(true);
    setTimeout(() => setCopiedDigest(false), 2500);
  }

  const filteredCommodities = useMemo(() => {
    const list = data.commodities.filter((c) => {
      if (categoryFilter === 'ALL') return true;
      return c.ingredient.category === categoryFilter;
    });

    return [...list].sort((a, b) => {
      if (sortMode === 'LOWEST_PRICE') {
        return a.bestOffer.normalizedPricePerUnit - b.bestOffer.normalizedPricePerUnit;
      }
      if (sortMode === 'BIGGEST_DISCOUNT') {
        return b.discountVsRegularPct - a.discountVsRegularPct;
      }
      return b.valueScore - a.valueScore;
    });
  }, [data.commodities, categoryFilter, sortMode]);

  const sourceTrio = ((customAiOwner.current !== pantry.owner || customAiContext.current !== mealContextSignature)
    ? null : customAiDishes) || data.recommendedTrio;
  const activeTrio = useMemo(() => sourceTrio.map((dish) =>
    applyPantryToRecipe(dish, effectiveOnHandIds, data.commodities, undefined, pantryPriceContext)),
  [sourceTrio, effectiveOnHandIds, data.commodities, pantryPriceContext]);

  const trioTotals = useMemo(() => {
    const totalBatchCost = activeTrio.reduce((acc, d) => acc + d.totalBatchCost, 0);
    const totalRegularCost = activeTrio.reduce((acc, d) => acc + d.regularBatchCost, 0);
    const totalSavings = Math.max(0, totalRegularCost - totalBatchCost);
    const totalServings =
      activeTrio.reduce((acc, d) => acc + d.servings, 0) || targetServings * 3;
    const avgPerServing = totalBatchCost / totalServings;

    return {
      totalBatchCost: totalBatchCost.toFixed(2),
      totalRegularCost: totalRegularCost.toFixed(2),
      totalSavings: totalSavings.toFixed(2),
      totalServings,
      avgPerServing: avgPerServing.toFixed(2),
    };
  }, [activeTrio, targetServings]);

  // v0.3 + v0.4 + v1.1 + v1.2 Aggregated Shopping List, Coupon Pre-Flight, and Store Trip Optimizer
  const shoppingPlan = useMemo(
    () =>
      buildShoppingListAndStoreComparison(
        activeTrio,
        data.commodities,
        effectiveOnHandIds,
        data.zipCode || currentZip,
        activeStores,
        pantryPriceContext,
      ),
    [
      activeTrio,
      data.commodities,
      effectiveOnHandIds,
      data.zipCode,
      currentZip,
      activeStores,
      pantryPriceContext,
    ]
  );

  const resolvedShoppingItems = useMemo(() => {
    return shoppingPlan.items.map((item) => {
      const store: StoreChain =
        tripMode === 'SPLIT' ? item.optimalStore : tripMode;

      const sp = item.storePricing?.[store];
      const unitCost =
        sp?.unitCost ??
        (store === 'KING_SOOPERS'
          ? item.kingSoopersUnitCost
          : store === 'SAFEWAY'
            ? item.safewayUnitCost
            : item.optimalUnitCost);
      const totalCost = item.isOnHand
        ? 0
        : sp?.totalCost ??
          (store === 'KING_SOOPERS'
            ? item.kingSoopersTotalCost
            : store === 'SAFEWAY'
              ? item.safewayTotalCost
              : item.optimalTotalCost);
      const rawDealText = item.isOnHand
        ? 'Already have'
        : sp?.rawDealText ??
          (store === 'KING_SOOPERS'
            ? item.kingSoopersRawDealText
            : store === 'SAFEWAY'
              ? item.safewayRawDealText
              : item.optimalRawDealText);
      const dealType =
        sp?.dealType ??
        (store === 'KING_SOOPERS'
          ? item.kingSoopersDealType
          : store === 'SAFEWAY'
            ? item.safewayDealType
            : item.optimalDealType);
      const dealConditions =
        sp?.dealConditions ??
        (store === 'KING_SOOPERS'
          ? item.kingSoopersDealConditions
          : store === 'SAFEWAY'
            ? item.safewayDealConditions
            : item.optimalDealConditions);

      return {
        ...item,
        ingredientName: sp?.ingredientName ?? item.ingredientName,
        activeStore: store,
        activeUnitCost: unitCost,
        activeTotalCost: totalCost,
        activeRawDealText: rawDealText,
        activeDealType: dealType,
        activeDealConditions: dealConditions,
      };
    });
  }, [shoppingPlan.items, tripMode]);

  const digitalCouponItems = useMemo(
    () =>
      resolvedShoppingItems.filter(
        (i) =>
          !i.isOnHand &&
          (i.activeDealType === 'DIGITAL_COUPON' || i.activeDealType === 'MULTI_BUY')
      ),
    [resolvedShoppingItems]
  );

  // v1.2 Ticket #23: Copy formatted checklist for Apple Notes / Google Keep / Reminders
  function handleCopyShoppingListForNotes() {
    const text = formatShoppingListForClipboard({
      items: resolvedShoppingItems,
      pantryChecklist: shoppingPlan.pantryChecklist,
      tripComparison: shoppingPlan.tripComparison,
      activeTrio,
      zipCode: currentZip,
      cityLabel: data.cityLabel,
      tripMode,
      checkedItems,
    });
    navigator.clipboard?.writeText(text);
    setCopiedChecklist(true);
    setTimeout(() => setCopiedChecklist(false), 3000);
  }

  function handlePrintShoppingSlip() {
    setShowPrintSlipModal(true);
    setTimeout(() => {
      window.print();
    }, 150);
  }

  // Promote a blueprint into the top three (moved unchanged from the Meal Plan tab's inline click handler).
  function handlePromoteDish(dish: RecommendedDish) {
    customAiOwner.current = pantry.owner;
    customAiContext.current = mealContextSignature;
    setCustomAiDishes([
      dish,
      ...activeTrio.filter((d) => d.id !== dish.id).slice(0, 2),
    ]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Clear the profile filters (moved unchanged from the Meal Plan header's inline click handler).
  function handleClearProfileFilters() {
    setMacroGoal('ANY');
    setDietaryConstraints([]);
    setApplianceFilter('ANY');
    setCustomAiDishes(null);
    persistProfileToLocalStorage('ANY', [], 'ANY');
    syncDashboard(
      storeFilter,
      pinnedIds,
      effectiveOnHandIds,
      targetServings,
      currentZip,
      activeStores,
      'ANY',
      [],
      'ANY'
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Top Header — Two-Tier Navigation Architecture */}
      <header className={`${showPantry ? 'relative' : 'sticky top-0'} z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-2xs no-print`}>
        <div className="mx-auto max-w-6xl px-4 py-2.5">
          {/* Tier 1: Primary Brand & Location (Left) + Utilities & User Account (Pinned Top-Right) */}
          <HeaderPrimary
            data={data}
            currentZip={currentZip}
            showPantry={showPantry}
            showZipModal={showZipModal}
            showAccountModal={showAccountModal}
            showAlertsModal={showAlertsModal}
            userSync={userSync}
            pantryEntries={pantry.entries}
            pantryTrigger={pantryTrigger}
            setShowZipModal={setShowZipModal}
            setShowPantry={setShowPantry}
            setShowAccountModal={setShowAccountModal}
            setAccountIntent={setAccountIntent}
            handleToggleAlertsModal={handleToggleAlertsModal}
          />

          {/* Tier 2: Dedicated Supermarket Filter Bar (Left) & Weekly Ad-Cycle Pill (Right) */}
          <StoreFilterBar
            data={data}
            currentZip={currentZip}
            storeFilter={storeFilter}
            activeStores={activeStores}
            showStoresModal={showStoresModal}
            handleStoreChange={handleStoreChange}
            setShowStoresModal={setShowStoresModal}
          />

          <FreshnessNotice data={data} />

          {/* v1.3 Ticket #29: Account Management, Cloud Sync & Privacy Drawer */}
          <AccountModal
            isOpen={showAccountModal}
            intent={accountIntent}
            onClose={() => setShowAccountModal(false)}
            authenticated={userSync.authenticated}
            profile={userSync.profile}
            storageMode={userSync.storageMode}
            supabaseConfigured={userSync.supabaseConfigured}
            syncStatus={userSync.syncStatus}
            lastSyncedIso={userSync.lastSyncedIso}
            authLoading={userSync.authLoading}
            currentZip={currentZip}
            activeStores={activeStores}
            macroGoal={macroGoal}
            dietaryConstraints={dietaryConstraints}
            applianceFilter={applianceFilter}
            pantryItemCount={pantry.entries.filter((entry) => !entry.deletedAtIso).length}
            onSignIn={userSync.signInWithProvider}
            onSignOut={userSync.signOut}
            onForceSync={handleForceCloudSync}
            onExportData={userSync.exportAccountDataJson}
            onDeleteAccount={userSync.deleteAccountAndData}
          />

          {/* Arbitrage Toast Banner */}
          {arbitrageToast && (
            <div className="mt-2.5 flex items-center justify-between rounded-xl border border-sky-300 bg-sky-950 px-3.5 py-2 text-xs font-semibold text-sky-100 shadow-md">
              <div className="flex items-center gap-2">
                <DoorOpen className="h-4 w-4 text-sky-400 shrink-0" />
                <span>{arbitrageToast}</span>
              </div>
              <button
                onClick={() => setArbitrageToast(null)}
                className="ml-3 text-sky-300 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Private Virtual Pantry drawer */}
          {showPantry && <VirtualPantry speechConfigured={speechConfigured} onAiSignIn={showAiSignIn} owner={pantry.owner} barcodeEnabled={barcodeEnabled} cameraEnabled={cameraEnabled}
            key={pantry.owner ?? `loading:${pantryAccountId ?? 'guest'}`}
            entries={pantry.entries} acceptedCatalogIds={pantry.acceptedCatalogIds} status={pantry.status} error={pantry.error} guest={pantry.guest} hasLegacyEdits={pantry.hasLegacyEdits}
            importDuplicates={pantry.importDuplicates}
            guestEntries={pantry.guestEntries} conflicts={pantry.conflicts}
            onSave={pantry.save} onDelete={pantry.remove} onRetry={pantry.retry} onResolve={pantry.resolve}
            onImportGuest={pantry.importGuest} onReviewLegacy={pantry.reviewLegacy} onImportLegacy={pantry.importLegacy}
            onClose={() => { setShowPantry(false); pantryTrigger.current?.focus(); }}
          />}

          {/* Interactive Zip Code / Location Switcher Drawer */}
          {showZipModal && (
            <ZipPanel
              currentZip={currentZip}
              zipInput={zipInput}
              zipLoading={zipLoading}
              zipError={zipError}
              onZipInputChange={(value) => {
                setZipInput(value);
                setZipError(null);
              }}
              onSubmit={handleZipSubmit}
              onClose={() => setShowZipModal(false)}
            />
          )}

          {/* Interactive My Stores Preference Drawer (v1.1) */}
          {showStoresModal && (
            <StoresPanel
              activeStores={activeStores}
              cityLabel={data.cityLabel}
              currentZip={currentZip}
              onToggleStore={handleToggleActiveStore}
              onSelectAll={() => {
                setActiveStores(ALL_STORE_CHAINS);
                try {
                  localStorage.setItem(
                    'pantrybot_active_stores',
                    JSON.stringify(ALL_STORE_CHAINS)
                  );
                } catch {}
                syncDashboard(
                  storeFilter,
                  pinnedIds,
                  effectiveOnHandIds,
                  targetServings,
                  currentZip,
                  ALL_STORE_CHAINS
                );
              }}
              onClose={() => setShowStoresModal(false)}
            />
          )}

          {/* v1.0 Weekly Cron & Smart Push Notifications Preview Drawer */}
          {showAlertsModal && (
            <AlertsPanel
              cronSyncResult={cronSyncResult}
              cronSyncLoading={cronSyncLoading}
              cronSyncError={cronSyncError}
              copiedDigest={copiedDigest}
              onRunSync={handleTriggerWeeklySync}
              onCopyDigest={handleCopyMarkdownDigest}
            />
          )}

          {/* Primary Navigation Tabs */}
          <PrimaryNav
            data={data}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            pinnedIds={pinnedIds}
            effectiveOnHandIds={effectiveOnHandIds}
            shoppingPlan={shoppingPlan}
            trioTotals={trioTotals}
          />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-5">
        {/* =========================================================
            TAB 1: THE WEEKEND VALUE BOARD
           ========================================================= */}
        {activeTab === 'BOARD' && (
          <div className="space-y-6">
            {/* Splurge Value Alerts Callout Strip */}
            <BoardAlerts
              data={data}
              currentZip={currentZip}
              pinnedIds={pinnedIds}
              handleTogglePin={handleTogglePin}
              handleReviewStockUp={handleReviewStockUp}
            />

            {/* Category & Sort Controls */}
            <BoardControls
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              sortMode={sortMode}
              setSortMode={setSortMode}
            />

            {/* Main Commodity Leaderboard Grid */}
            <BoardLeaderboard
              filteredCommodities={filteredCommodities}
              currentZip={currentZip}
              pinnedIds={pinnedIds}
              effectiveOnHandIds={effectiveOnHandIds}
              handleTogglePin={handleTogglePin}
              handleToggleOnHand={handleToggleOnHand}
              handleReviewStockUp={handleReviewStockUp}
            />
          </div>
        )}

        {/* =========================================================
            TAB 2: THE 3-DISH STEW & CASSEROLE MEAL PREP PLAN
           ========================================================= */}
        {activeTab === 'MEAL_PLAN' && (
          <div className="space-y-6">
            <PlanHeader
              data={data}
              trioTotals={trioTotals}
              activeTrio={activeTrio}
              targetServings={targetServings}
              handleServingsChange={handleServingsChange}
              setActiveTab={setActiveTab}
              macroGoal={macroGoal}
              dietaryConstraints={dietaryConstraints}
              applianceFilter={applianceFilter}
              handleMacroGoalChange={handleMacroGoalChange}
              handleToggleDietaryConstraint={handleToggleDietaryConstraint}
              handleVesselChange={handleVesselChange}
              onClearProfileFilters={handleClearProfileFilters}
              canUseAi={canUseAi}
              aiLoading={aiLoading}
              customPrompt={customPrompt}
              aiBannerMessage={aiBannerMessage}
              setCustomPrompt={setCustomPrompt}
              handleGenerateAiPlan={handleGenerateAiPlan}
              showAiSignIn={showAiSignIn}
              useStandardSuggestions={useStandardSuggestions}
            />

            {/* The 3 Recommended Batch Dishes */}
            <PlanDishes
              activeTrio={activeTrio}
              currentZip={currentZip}
              expandedDishIds={expandedDishIds}
              setExpandedDishIds={setExpandedDishIds}
              savedRecipeIds={savedRecipeIds}
              handleToggleSaveRecipe={handleToggleSaveRecipe}
            />

            {/* Option to Browse All Evaluated Stew/Casserole Blueprints */}
            <PlanBlueprints
              data={data}
              targetServings={targetServings}
              showAllBlueprints={showAllBlueprints}
              setShowAllBlueprints={setShowAllBlueprints}
              onPromoteDish={handlePromoteDish}
            />
          </div>
        )}

        {/* =========================================================
            TAB 3: SHOPPING LIST, 1-TAP CURBSIDE CART BRIDGE & EXPORT
           ========================================================= */}
        {activeTab === 'SHOPPING_LIST' && (
          <TripSection
            data={data}
            currentZip={currentZip}
            shoppingPlan={shoppingPlan}
            tripMode={tripMode}
            setTripMode={setTripMode}
            resolvedShoppingItems={resolvedShoppingItems}
            digitalCouponItems={digitalCouponItems}
            activeTrio={activeTrio}
            trioTotals={trioTotals}
            checkedItems={checkedItems}
            clippedCoupons={clippedCoupons}
            copiedChecklist={copiedChecklist}
            showPrintSlipModal={showPrintSlipModal}
            setShowPrintSlipModal={setShowPrintSlipModal}
            toggleCheckedItem={toggleCheckedItem}
            toggleClippedCoupon={toggleClippedCoupon}
            handleToggleOnHand={handleToggleOnHand}
            handleCopyShoppingListForNotes={handleCopyShoppingListForNotes}
            handlePrintShoppingSlip={handlePrintShoppingSlip}
          />
        )}

        {/* =========================================================
            TAB 4: USDA, 6-WEEK CYCLE SIGNALS & WHOLESALE CLUB RADAR
           ========================================================= */}
        {activeTab === 'RADAR' && (
          <RadarSection
            data={data}
            currentZip={currentZip}
            onTogglePin={handleTogglePin}
            onReviewStockUp={handleReviewStockUp}
          />
        )}
      </main>
    </div>
  );
}
