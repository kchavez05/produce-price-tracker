'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  CommodityCategory,
  CookingVesselArchetype,
  DashboardPayload,
  DealType,
  DietaryConstraint,
  FreezerItem,
  MacroGoal,
  RecommendedDish,
  ScoredCommodity,
  StoreChain,
  WeeklySyncCronResult,
} from '@/types/domain';
import {
  ALL_STORE_CHAINS,
  getStoreDefinition,
  resolveStoreBanner,
} from '@/data/store-registry';
import { buildShoppingListAndStoreComparison } from '@/lib/shopping-list';
import {
  formatShoppingListForClipboard,
  getItemCurbsideLinks,
} from '@/lib/cart-exporter';
import {
  Sparkles,
  TrendingDown,
  TrendingUp,
  Tag,
  Smartphone,
  CreditCard,
  Layers,
  ChefHat,
  Flame,
  Pin,
  Check,
  RefreshCw,
  MapPin,
  Gem,
  Clock,
  Snowflake,
  ChevronDown,
  ChevronUp,
  KeyRound,
  Radar,
  ShoppingBag,
  ArrowRight,
  Info,
  ListChecks,
  Store,
  CheckSquare,
  Square,
  Bookmark,
  Users,
  Dumbbell,
  Bell,
  Copy,
  ExternalLink,
  Printer,
  Trash2,
  Plus,
  Minus,
  Award,
  SlidersHorizontal,
  ArrowLeftRight,
} from 'lucide-react';

interface Props {
  initialData: DashboardPayload;
}

export default function MealPrepDashboard({ initialData }: Props) {
  const [data, setData] = useState<DashboardPayload>(initialData);
  const [activeTab, setActiveTab] = useState<
    'BOARD' | 'MEAL_PLAN' | 'SHOPPING_LIST' | 'RADAR'
  >('BOARD');
  const [storeFilter, setStoreFilter] = useState<'ALL' | StoreChain>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | CommodityCategory>('ALL');
  const [sortMode, setSortMode] = useState<
    'VALUE_SCORE' | 'LOWEST_PRICE' | 'BIGGEST_DISCOUNT'
  >('VALUE_SCORE');
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  // v0.4: On-Hand in Freezer/Pantry IDs (Ticket #8) & Target Servings 4/6/8 (Ticket #9)
  const [onHandIds, setOnHandIds] = useState<string[]>([]);
  const [targetServings, setTargetServings] = useState<4 | 6 | 8>(6);
  const [savedRecipeIds, setSavedRecipeIds] = useState<Record<string, boolean>>({});

  // v1.2 Ticket #21: Persistent Virtual Freezer & Multi-Week Arbitrage state
  const [freezerItems, setFreezerItems] = useState<FreezerItem[]>(
    () => initialData.freezerInventory || []
  );
  const [showFreezerModal, setShowFreezerModal] = useState(false);
  const [arbitrageToast, setArbitrageToast] = useState<string | null>(null);
  const [customFreezerIngredientId, setCustomFreezerIngredientId] = useState<string>(
    initialData.commodities[0]?.ingredient.id || 'pork-shoulder-butt'
  );
  const [customFreezerQty, setCustomFreezerQty] = useState<string>('3.0');

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
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiBannerMessage, setAiBannerMessage] = useState<string | null>(null);
  const [customAiDishes, setCustomAiDishes] = useState<RecommendedDish[] | null>(null);

  // v1.0: Weekly Circular Cron & Smart Push Notifications Preview (Ticket #12)
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [cronSyncResult, setCronSyncResult] = useState<WeeklySyncCronResult | null>(null);
  const [cronSyncLoading, setCronSyncLoading] = useState(false);
  const [copiedDigest, setCopiedDigest] = useState(false);

  // Dynamic Zip Code / Location state (De-localization)
  const [currentZip, setCurrentZip] = useState(data.zipCode || '80542');
  const [showZipModal, setShowZipModal] = useState(false);
  const [zipInput, setZipInput] = useState(data.zipCode || '80542');
  const [zipLoading, setZipLoading] = useState(false);
  const [zipError, setZipError] = useState<string | null>(null);

  // Combine manual onHandIds + any canonicalIngredientId currently in Virtual Freezer
  const effectiveOnHandIds = useMemo(() => {
    const set = new Set<string>(onHandIds);
    for (const f of freezerItems) {
      if (f.quantityLbOrDoz > 0) {
        set.add(f.canonicalIngredientId);
      }
    }
    return Array.from(set);
  }, [onHandIds, freezerItems]);

  const freezerSummary = useMemo(() => {
    const totalItems = freezerItems.length;
    const totalWeightLb = freezerItems.reduce((acc, f) => acc + f.quantityLbOrDoz, 0);
    const totalCostBasis = freezerItems.reduce((acc, f) => acc + f.totalCostBasis, 0);
    const totalEstimatedSavings = freezerItems.reduce(
      (acc, f) => acc + f.estimatedSavings,
      0
    );
    return {
      totalItems,
      totalWeightLb: totalWeightLb.toFixed(1),
      totalCostBasis: totalCostBasis.toFixed(2),
      totalEstimatedSavings: totalEstimatedSavings.toFixed(2),
    };
  }, [freezerItems]);

  useEffect(() => {
    try {
      const savedChecked = localStorage.getItem('mead_checked_items_v03');
      if (savedChecked) setCheckedItems(JSON.parse(savedChecked));
      const savedClipped = localStorage.getItem('mead_clipped_coupons_v03');
      if (savedClipped) setClippedCoupons(JSON.parse(savedClipped));
      const savedOnHand = localStorage.getItem('mead_on_hand_ids_v04');
      if (savedOnHand) {
        const parsed = JSON.parse(savedOnHand);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setOnHandIds(parsed);
        }
      }
      const savedFreezer = localStorage.getItem('pantrybot_virtual_freezer_v12');
      if (savedFreezer) {
        const parsed = JSON.parse(savedFreezer);
        if (Array.isArray(parsed) && parsed.length > 0 && freezerItems.length === 0) {
          setFreezerItems(parsed);
        }
      }
      const savedProfile = localStorage.getItem('pantrybot_nutrition_profile_v12');
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        if (parsed.macroGoal) setMacroGoal(parsed.macroGoal);
        if (Array.isArray(parsed.dietaryConstraints)) {
          setDietaryConstraints(parsed.dietaryConstraints);
        }
        if (parsed.applianceFilter) setApplianceFilter(parsed.applianceFilter);
      }
      const savedActiveStores = localStorage.getItem('pantrybot_active_stores');
      if (savedActiveStores) {
        try {
          const parsed = JSON.parse(savedActiveStores);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setActiveStores(parsed);
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
          onHandIds,
          targetServings,
          savedZip,
          activeStores,
          macroGoal,
          dietaryConstraints,
          applianceFilter
        );
      }
    } catch {
      // Ignore storage errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function persistFreezerToLocalStorage(items: FreezerItem[]) {
    try {
      localStorage.setItem('pantrybot_virtual_freezer_v12', JSON.stringify(items));
    } catch {
      // Ignore
    }
  }

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
        setData(updated);
        setCurrentZip(updated.zipCode);
        if (updated.freezerInventory) {
          setFreezerItems(updated.freezerInventory);
          persistFreezerToLocalStorage(updated.freezerInventory);
        }
      }
    } catch {
      // Ignore network hiccup
    }
  }

  // v1.2 Ticket #21: "Buy 2: Prep 1, Freeze 1" 1-Tap Arbitrage Handler
  async function handleBuyTwoPrepOneFreezeOne(item: ScoredCommodity) {
    const qty =
      item.arbitragePrompt?.recommendedFreezeQty ||
      Math.max(2.0, Number(item.ingredient.avgEachWeightLb.toFixed(1)));
    const unitPrice = item.bestOffer.normalizedPricePerUnit;
    const regPrice = item.bestOffer.regularPricePerUnit;
    const storeBanner = resolveStoreBanner(item.bestOffer.store, currentZip);

    const newEntry: FreezerItem = {
      id: `frz-${item.ingredient.id}-${Date.now()}`,
      canonicalIngredientId: item.ingredient.id,
      ingredientName: item.ingredient.name,
      category: item.ingredient.category,
      quantityLbOrDoz: qty,
      unit: item.ingredient.standardUnit,
      purchasePricePerUnit: unitPrice,
      regularPricePerUnit: regPrice,
      totalCostBasis: Number((qty * unitPrice).toFixed(2)),
      estimatedSavings: Number(Math.max(0, qty * (regPrice - unitPrice)).toFixed(2)),
      store: item.bestOffer.store,
      storeBanner,
      purchasedAtIso: new Date().toISOString(),
      notes: `Buy 2 Arbitrage (${item.bestOffer.rawPriceText})`,
    };

    // Pin 1st pack to this week's prep
    const nextPinned = pinnedIds.includes(item.ingredient.id)
      ? pinnedIds
      : [...pinnedIds, item.ingredient.id];
    setPinnedIds(nextPinned);

    try {
      const res = await fetch('/api/freezer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item: newEntry }),
      });
      if (res.ok) {
        const payload = await res.json();
        if (Array.isArray(payload.items)) {
          setFreezerItems(payload.items);
          persistFreezerToLocalStorage(payload.items);
        }
      }
    } catch {
      const updatedLocal = [newEntry, ...freezerItems];
      setFreezerItems(updatedLocal);
      persistFreezerToLocalStorage(updatedLocal);
    }

    setArbitrageToast(
      `❄️ Arbitrage Locked: Pinned 1 ${item.ingredient.name} to this week's Meal Prep + banked ${qty} ${item.ingredient.standardUnit} in your Virtual Freezer (saved $${newEntry.estimatedSavings.toFixed(2)})!`
    );
    setTimeout(() => setArbitrageToast(null), 5000);

    const nextOnHand = Array.from(new Set([...effectiveOnHandIds, item.ingredient.id]));
    syncDashboard(storeFilter, nextPinned, nextOnHand, targetServings);
  }

  async function handleAddCustomFreezerItem(e: React.FormEvent) {
    e.preventDefault();
    const matched = data.commodities.find(
      (c) => c.ingredient.id === customFreezerIngredientId
    );
    if (!matched) return;
    const qty = Math.max(0.5, parseFloat(customFreezerQty) || 2.0);
    const unitPrice = matched.bestOffer.normalizedPricePerUnit;
    const regPrice = matched.bestOffer.regularPricePerUnit;

    const newEntry: FreezerItem = {
      id: `frz-${matched.ingredient.id}-${Date.now()}`,
      canonicalIngredientId: matched.ingredient.id,
      ingredientName: matched.ingredient.name,
      category: matched.ingredient.category,
      quantityLbOrDoz: qty,
      unit: matched.ingredient.standardUnit,
      purchasePricePerUnit: unitPrice,
      regularPricePerUnit: regPrice,
      totalCostBasis: Number((qty * unitPrice).toFixed(2)),
      estimatedSavings: Number(Math.max(0, qty * (regPrice - unitPrice)).toFixed(2)),
      store: matched.bestOffer.store,
      storeBanner: resolveStoreBanner(matched.bestOffer.store, currentZip),
      purchasedAtIso: new Date().toISOString(),
      notes: 'Logged to Virtual Freezer',
    };

    try {
      const res = await fetch('/api/freezer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item: newEntry }),
      });
      if (res.ok) {
        const payload = await res.json();
        if (Array.isArray(payload.items)) {
          setFreezerItems(payload.items);
          persistFreezerToLocalStorage(payload.items);
        }
      }
    } catch {
      // Ignore
    }
    const nextOnHand = Array.from(
      new Set([...effectiveOnHandIds, matched.ingredient.id])
    );
    syncDashboard(storeFilter, pinnedIds, nextOnHand, targetServings);
  }

  async function handleUpdateFreezerQuantity(item: FreezerItem, delta: number) {
    const nextQty = Number((item.quantityLbOrDoz + delta).toFixed(2));
    if (nextQty <= 0) {
      await handleDeleteFreezerItem(item.id, item.canonicalIngredientId);
      return;
    }
    try {
      const res = await fetch('/api/freezer', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, quantityLbOrDoz: nextQty }),
      });
      if (res.ok) {
        const payload = await res.json();
        if (Array.isArray(payload.items)) {
          setFreezerItems(payload.items);
          persistFreezerToLocalStorage(payload.items);
        }
      }
    } catch {
      // Ignore
    }
    syncDashboard(storeFilter, pinnedIds, effectiveOnHandIds, targetServings);
  }

  async function handleDeleteFreezerItem(id: string, canonicalIngredientId: string) {
    try {
      const res = await fetch(`/api/freezer?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const payload = await res.json();
        if (Array.isArray(payload.items)) {
          setFreezerItems(payload.items);
          persistFreezerToLocalStorage(payload.items);
        }
      }
    } catch {
      const remaining = freezerItems.filter((f) => f.id !== id);
      setFreezerItems(remaining);
      persistFreezerToLocalStorage(remaining);
    }
    const nextOnHand = onHandIds.filter((oid) => oid !== canonicalIngredientId);
    setOnHandIds(nextOnHand);
    syncDashboard(storeFilter, pinnedIds, nextOnHand, targetServings);
  }

  // v1.2 Ticket #22 Handlers: Macro Goal, Dietary Constraints, Cooking Vessel
  function handleMacroGoalChange(nextMacro: MacroGoal) {
    setMacroGoal(nextMacro);
    setCustomAiDishes(null);
    persistProfileToLocalStorage(nextMacro, dietaryConstraints, applianceFilter);
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
    const inFreezer = freezerItems.find(
      (f) => f.canonicalIngredientId === ingredientId
    );
    if (inFreezer) {
      handleDeleteFreezerItem(inFreezer.id, ingredientId);
      return;
    }
    const exists = onHandIds.includes(ingredientId);
    const nextOnHand = exists
      ? onHandIds.filter((id) => id !== ingredientId)
      : [...onHandIds, ingredientId];
    setOnHandIds(nextOnHand);
    try {
      localStorage.setItem('mead_on_hand_ids_v04', JSON.stringify(nextOnHand));
    } catch {
      // Ignore
    }
    setCustomAiDishes(null);
    const merged = Array.from(
      new Set([
        ...nextOnHand,
        ...freezerItems.map((f) => f.canonicalIngredientId),
      ])
    );
    syncDashboard(storeFilter, pinnedIds, merged, targetServings);
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
    const isCurrentlySaved = Boolean(dish.savedInLibrary || savedRecipeIds[dish.id]);
    if (isCurrentlySaved) {
      setSavedRecipeIds((prev) => ({ ...prev, [dish.id]: false }));
      await fetch(`/api/saved-recipes?id=${encodeURIComponent(dish.id)}`, {
        method: 'DELETE',
      });
    } else {
      setSavedRecipeIds((prev) => ({ ...prev, [dish.id]: true }));
      await fetch('/api/saved-recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dish }),
      });
    }
    syncDashboard(storeFilter, pinnedIds, effectiveOnHandIds, targetServings);
  }

  async function handleGenerateAiPlan() {
    setAiLoading(true);
    setAiBannerMessage(null);
    try {
      const res = await fetch('/api/ai-meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pinnedIngredientIds: pinnedIds,
          onHandIngredientIds: effectiveOnHandIds,
          targetServings,
          customPreference: customPrompt,
          storeFilter,
          geminiApiKey,
          zipCode: currentZip,
          cityLabel: data.cityLabel,
          macroGoal,
          dietaryConstraints,
          applianceFilter,
        }),
      });
      const result = await res.json();
      if (result.dishes && Array.isArray(result.dishes)) {
        setCustomAiDishes(result.dishes);
        setAiBannerMessage(result.message || 'Updated 3-dish meal prep plan!');
        if (result.dishes[0]?.id) {
          setExpandedDishIds({ [result.dishes[0].id]: true });
        }
      } else if (result.error) {
        setAiBannerMessage(result.error);
      }
    } catch {
      setAiBannerMessage('Failed to reach AI meal plan endpoint.');
    } finally {
      setAiLoading(false);
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
    try {
      const res = await fetch('/api/cron/weekly-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cycle: 'manual_sync', zipCode: currentZip }),
      });
      if (res.ok) {
        const payload: WeeklySyncCronResult = await res.json();
        setCronSyncResult(payload);
        syncDashboard(
          storeFilter,
          pinnedIds,
          effectiveOnHandIds,
          targetServings,
          currentZip
        );
      }
    } catch {
      // Ignore
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

  const activeTrio = customAiDishes || data.recommendedTrio;

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
        activeStores
      ),
    [
      activeTrio,
      data.commodities,
      effectiveOnHandIds,
      data.zipCode,
      currentZip,
      activeStores,
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
        ? '❄️ Already On-Hand in Virtual Freezer/Pantry ($0.00 out-of-pocket)'
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

  function renderDealBadge(dealType: DealType) {
    switch (dealType) {
      case 'DIGITAL_COUPON':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900 border border-amber-300">
            <Smartphone className="h-3 w-3" />
            Clip Digital Coupon
          </span>
        );
      case 'MULTI_BUY':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-900 border border-purple-300">
            <Layers className="h-3 w-3" />
            Multi-Buy Requirement
          </span>
        );
      case 'EVERYDAY_LOW':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-900 border border-blue-300">
            <Tag className="h-3 w-3" />
            Everyday Low Price
          </span>
        );
      case 'SHELF_OR_MEMBER':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-900 border border-emerald-300">
            <CreditCard className="h-3 w-3" />
            Member Card Price
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
            <Tag className="h-3 w-3" />
            Everyday Shelf Price
          </span>
        );
    }
  }

  function renderStoreBadge(store: StoreChain) {
    const def = getStoreDefinition(store);
    const banner = resolveStoreBanner(store, currentZip);
    return (
      <span
        style={{ backgroundColor: def.brandColor, color: '#ffffff' }}
        className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold shadow-xs"
      >
        {banner}
      </span>
    );
  }

  function renderCycleSignalBadge(item: ScoredCommodity) {
    const sig = item.cycleSignal;
    if (!sig) return null;
    if (sig.status === 'STOCK_UP_6WK_LOW') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-900 border border-emerald-300">
          <span>🟢 Stock Up Alert (6-Wk Low)</span>
        </span>
      );
    }
    if (sig.status === 'CYCLE_PEAK_WAIT') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-900 border border-rose-300">
          <span>🔴 Cycle Peak (Wait / Swap)</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-900 border border-amber-200">
        <span>🟡 Fair Sale Price</span>
      </span>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md no-print">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
                  <ChefHat className="h-5 w-5" />
                </span>
                <div>
                  <h1 className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                    <span>PantryBot</span>
                    <span className="hidden rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200 sm:inline-block">
                      v1.2 Smart Kitchen &amp; Cart Bridge
                    </span>
                  </h1>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                    <button
                      onClick={() => setShowZipModal(!showZipModal)}
                      className="inline-flex items-center gap-1 rounded-md bg-slate-100 hover:bg-emerald-50 px-2 py-0.5 font-medium text-slate-700 hover:text-emerald-800 border border-slate-200 transition"
                      title="Click to change your ZIP code"
                    >
                      <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                      <span>
                        {data.cityLabel} ({currentZip})
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-700 underline ml-0.5">
                        Change
                      </span>
                    </button>
                    <span>•</span>
                    <span>{data.adCycleLabel}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Store Filter & Smart Kitchen Drawers */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs font-medium overflow-x-auto max-w-full">
                <button
                  onClick={() => handleStoreChange('ALL')}
                  className={`rounded-md px-2.5 py-1.5 transition whitespace-nowrap ${
                    storeFilter === 'ALL'
                      ? 'bg-white font-semibold text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Stores ({activeStores.length})
                </button>
                {activeStores.map((chain) => {
                  const banner = resolveStoreBanner(chain, currentZip);
                  const def = getStoreDefinition(chain);
                  const isSelected = storeFilter === chain;
                  return (
                    <button
                      key={chain}
                      onClick={() => handleStoreChange(chain)}
                      style={
                        isSelected
                          ? { backgroundColor: def.brandColor, color: '#ffffff' }
                          : undefined
                      }
                      className={`rounded-md px-2.5 py-1.5 transition whitespace-nowrap ${
                        isSelected
                          ? 'font-semibold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {banner}
                    </button>
                  );
                })}
              </div>

              {/* v1.2 Ticket #21: Virtual Freezer Drawer Trigger */}
              <button
                onClick={() => setShowFreezerModal(!showFreezerModal)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                  showFreezerModal
                    ? 'border-sky-600 bg-sky-600 text-white shadow-xs'
                    : freezerItems.length > 0
                      ? 'border-sky-300 bg-sky-50 text-sky-900 hover:bg-sky-100'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
                title="Open Virtual Freezer & Multi-Week Protein Arbitrage Inventory"
              >
                <Snowflake className="h-3.5 w-3.5 text-sky-500" />
                <span>Virtual Freezer ({freezerItems.length})</span>
              </button>

              <button
                onClick={() => setShowStoresModal(!showStoresModal)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                  showStoresModal
                    ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
                title="Customize which grocery stores you shop at"
              >
                <Store className="h-3.5 w-3.5" />
                <span>My Stores ({activeStores.length})</span>
              </button>

              <button
                onClick={handleToggleAlertsModal}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                  showAlertsModal
                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
                }`}
                title="Preview Smart Push Notifications & Friday Weekend Meal-Prep Digest"
              >
                <Bell className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Smart Alerts &amp; Digest</span>
              </button>

              <button
                onClick={() => setShowKeyModal(!showKeyModal)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                title="Configure Optional Free Gemini API Key"
              >
                <KeyRound className="h-3.5 w-3.5 text-emerald-600" />
                <span className="hidden sm:inline">API Keys</span>
              </button>
            </div>
          </div>

          {/* Arbitrage Toast Banner */}
          {arbitrageToast && (
            <div className="mt-2.5 flex items-center justify-between rounded-xl border border-sky-300 bg-sky-950 px-3.5 py-2 text-xs font-semibold text-sky-100 shadow-md">
              <div className="flex items-center gap-2">
                <Snowflake className="h-4 w-4 text-sky-400 shrink-0" />
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

          {/* v1.2 Ticket #21: Persistent Virtual Freezer & Multi-Week Arbitrage Drawer */}
          {showFreezerModal && (
            <div className="mt-3 rounded-xl border border-sky-300 bg-white p-4 shadow-lg text-xs text-slate-700">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-sky-600 text-white">
                    <Snowflake className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      Virtual Freezer &amp; Multi-Week Arbitrage Inventory (Ticket #21)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Stock up on deep 6-week cycle lows (&ldquo;Buy 2: Prep 1, Freeze 1&rdquo;). Any item banked here automatically drops out-of-pocket protein costs to <strong>$0.00</strong> in your 3-Dish Meal-Prep Trio!
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-3 rounded-lg bg-sky-50 px-3 py-1.5 border border-sky-200 text-[11px]">
                    <span>
                      Banked: <strong className="text-sky-950">{freezerSummary.totalWeightLb} lbs</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Basis: <strong className="text-sky-950">${freezerSummary.totalCostBasis}</strong>
                    </span>
                    <span>•</span>
                    <span className="text-emerald-700 font-bold">
                      Saved ${freezerSummary.totalEstimatedSavings}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowFreezerModal(false)}
                    className="text-slate-400 hover:text-slate-600 text-sm font-bold px-2 py-0.5"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {freezerItems.length === 0 ? (
                <div className="my-3 rounded-xl border border-dashed border-sky-200 bg-sky-50/40 p-4 text-center text-slate-600">
                  <p className="font-semibold text-slate-800">
                    Your Virtual Freezer is currently empty.
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Click <strong>&ldquo;❄️ Buy 2: Prep 1, Freeze 1&rdquo;</strong> on any deep cycle-low meat deal below, or log an on-hand freezer item using the quick form below.
                  </p>
                </div>
              ) : (
                <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {freezerItems.map((fItem) => (
                    <div
                      key={fItem.id}
                      className="flex flex-col justify-between rounded-xl border border-sky-200 bg-sky-50/40 p-3 shadow-2xs"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1.5">
                          {renderStoreBadge(fItem.store)}
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            Saved ${fItem.estimatedSavings.toFixed(2)}
                          </span>
                        </div>
                        <div className="mt-1.5 font-bold text-slate-900 text-xs">
                          {fItem.ingredientName}
                        </div>
                        <div className="mt-1 flex items-baseline justify-between text-[11px] text-slate-600">
                          <span>
                            Stock:{' '}
                            <strong className="text-sky-950">
                              {fItem.quantityLbOrDoz} {fItem.unit}
                            </strong>{' '}
                            (@ ${fItem.purchasePricePerUnit.toFixed(2)}/{fItem.unit})
                          </span>
                          <span className="font-bold text-slate-800">
                            Basis ${fItem.totalCostBasis.toFixed(2)}
                          </span>
                        </div>
                        {fItem.notes && (
                          <p className="mt-1 text-[10px] text-slate-500">{fItem.notes}</p>
                        )}
                      </div>

                      <div className="mt-2.5 flex items-center justify-between border-t border-sky-200/70 pt-2">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleUpdateFreezerQuantity(fItem, -0.5)}
                            className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                            title="Consume 0.5 lb/doz"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="px-1.5 font-bold text-slate-800">
                            {fItem.quantityLbOrDoz} {fItem.unit}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateFreezerQuantity(fItem, 0.5)}
                            className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                            title="Add 0.5 lb/doz"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="rounded bg-sky-600 px-2 py-0.5 text-[10px] font-bold text-white">
                            $0 Prep Active
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteFreezerItem(
                                fItem.id,
                                fItem.canonicalIngredientId
                              )
                            }
                            className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600"
                            title="Thaw & Remove from Freezer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick-Add to Virtual Freezer Form */}
              <form
                onSubmit={handleAddCustomFreezerItem}
                className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-700">
                    Log Item into Virtual Freezer:
                  </span>
                  <select
                    value={customFreezerIngredientId}
                    onChange={(e) => setCustomFreezerIngredientId(e.target.value)}
                    className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-900"
                  >
                    {data.commodities.map((c) => (
                      <option key={c.ingredient.id} value={c.ingredient.id}>
                        {c.ingredient.name} (${c.bestOffer.normalizedPricePerUnit.toFixed(2)}/
                        {c.ingredient.standardUnit})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="30"
                    value={customFreezerQty}
                    onChange={(e) => setCustomFreezerQty(e.target.value)}
                    className="w-20 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-900"
                    placeholder="lbs"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 rounded-lg bg-sky-600 px-3 py-1 text-xs font-bold text-white hover:bg-sky-700"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add to Freezer ($0 Prep)</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowFreezerModal(false);
                    setActiveTab('MEAL_PLAN');
                  }}
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline"
                >
                  <span>View $0 Freezer-Powered Recipes</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          )}

          {/* Interactive Zip Code / Location Switcher Drawer */}
          {showZipModal && (
            <div className="mt-3 rounded-xl border border-emerald-300 bg-white p-4 shadow-lg text-xs text-slate-700">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  <span className="font-bold text-sm text-slate-900">
                    Change Grocery Location (ZIP Code)
                  </span>
                </div>
                <button
                  onClick={() => setShowZipModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold px-2 py-0.5"
                >
                  ✕
                </button>
              </div>

              <p className="mt-2 text-slate-600 text-xs">
                Enter your 5-digit US ZIP code to fetch weekly supermarket circulars, digital coupons, and price trends for your local area.
              </p>

              <form onSubmit={handleZipSubmit} className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  maxLength={5}
                  pattern="[0-9]{5}"
                  value={zipInput}
                  onChange={(e) => {
                    setZipInput(e.target.value.replace(/\D/g, ''));
                    setZipError(null);
                  }}
                  placeholder="e.g. 80542, 80501, 80202, 90210"
                  className="w-40 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-900 focus:border-emerald-600 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={zipLoading}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 font-bold text-white hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  {zipLoading ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Update Location</span>
                  )}
                </button>
              </form>

              {zipError && (
                <p className="mt-1.5 text-xs font-semibold text-red-600">{zipError}</p>
              )}

              <div className="mt-3 pt-2.5 border-t border-slate-100">
                <span className="text-[11px] font-semibold text-slate-500">
                  Quick-select popular areas:
                </span>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {[
                    { zip: '80542', label: 'Mead / Firestone, CO' },
                    { zip: '80501', label: 'Longmont, CO' },
                    { zip: '80202', label: 'Denver, CO' },
                    { zip: '80302', label: 'Boulder, CO' },
                    { zip: '80525', label: 'Fort Collins, CO' },
                    { zip: '90210', label: 'Los Angeles, CA' },
                    { zip: '75001', label: 'Dallas, TX' },
                    { zip: '98101', label: 'Seattle, WA' },
                    { zip: '60601', label: 'Chicago, IL' },
                  ].map((preset) => (
                    <button
                      key={preset.zip}
                      type="button"
                      onClick={() => {
                        handleZipSubmit(undefined, preset.zip);
                      }}
                      className={`rounded-md px-2 py-1 text-[11px] font-medium border transition ${
                        currentZip === preset.zip
                          ? 'bg-emerald-100 border-emerald-400 text-emerald-900 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {preset.label} ({preset.zip})
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Interactive My Stores Preference Drawer (v1.1) */}
          {showStoresModal && (
            <div className="mt-3 rounded-xl border border-blue-300 bg-white p-4 shadow-lg text-xs text-slate-700">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-blue-600" />
                  <span className="font-bold text-sm text-slate-900">
                    My Grocery Stores ({activeStores.length} Active in {data.cityLabel})
                  </span>
                </div>
                <button
                  onClick={() => setShowStoresModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold px-2 py-0.5"
                >
                  ✕
                </button>
              </div>

              <p className="mt-2 text-slate-600 text-xs">
                Select which grocery chains you shop at. Meal-prep ingredient pricing, digital coupon checklists, and multi-store trip split calculations will only compare against your selected stores.
              </p>

              <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {ALL_STORE_CHAINS.map((chain) => {
                  const def = getStoreDefinition(chain);
                  const banner = resolveStoreBanner(chain, currentZip);
                  const isChecked = activeStores.includes(chain);
                  return (
                    <div
                      key={chain}
                      onClick={() => handleToggleActiveStore(chain)}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition ${
                        isChecked
                          ? 'border-blue-400 bg-blue-50/50 shadow-2xs'
                          : 'border-slate-200 bg-slate-50 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          style={{ backgroundColor: def.brandColor }}
                          className="h-3.5 w-3.5 rounded-full shrink-0"
                        />
                        <div>
                          <div className="font-bold text-slate-900 text-xs">{banner}</div>
                          <div className="text-[11px] text-slate-500">
                            {def.hasDigitalCoupons
                              ? `📱 ${def.couponAppLabel || 'Digital Coupons'}`
                              : def.isEverydayLowPrice
                                ? '🏷️ Everyday Low Price'
                                : '🏷️ Member Card'}
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0 pl-2">
                        {isChecked ? (
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-blue-600 text-white">
                            <Check className="h-3.5 w-3.5" />
                          </span>
                        ) : (
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-md border border-slate-300 bg-white" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-slate-100">
                <span className="text-[11px] text-slate-500">
                  Tip: Toggle off stores you don&apos;t live near to streamline your shopping lists.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
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
                    className="text-xs font-semibold text-blue-700 hover:underline"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => setShowStoresModal(false)}
                    className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-bold text-white hover:bg-blue-700 transition"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* v1.0 Weekly Cron & Smart Push Notifications Preview Drawer */}
          {showAlertsModal && (
            <div className="mt-3 rounded-xl border border-slate-300 bg-slate-900 p-4 text-xs text-slate-100 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300 border border-emerald-500/30">
                      <Bell className="h-3 w-3" />
                      Milestone v1.0 Cron &amp; Smart Push Engine
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Wed 6:00 AM MT Circular Sync • Fri 4:00 PM MT Weekend Prep Digest
                    </span>
                  </div>
                  <p className="mt-1 text-slate-300">
                    Live preview of automated push payloads &amp; weekend digest generated by{' '}
                    <code className="rounded bg-slate-800 px-1.5 py-0.5 text-emerald-300">
                      /api/cron/weekly-sync
                    </code>
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleTriggerWeeklySync}
                    disabled={cronSyncLoading}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 ${cronSyncLoading ? 'animate-spin' : ''}`}
                    />
                    <span>
                      {cronSyncLoading ? 'Syncing Circulars...' : 'Run Weekly Sync Now'}
                    </span>
                  </button>
                  <button
                    onClick={handleCopyMarkdownDigest}
                    disabled={!cronSyncResult}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 font-semibold text-slate-200 hover:bg-slate-700 disabled:opacity-50"
                  >
                    {copiedDigest ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-emerald-300">Copied Digest!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy Friday Markdown Digest</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {cronSyncLoading && !cronSyncResult ? (
                <div className="py-6 text-center text-slate-400">
                  Building Smart Push Notifications &amp; Friday Weekend Digest...
                </div>
              ) : cronSyncResult ? (
                <div className="mt-3 grid gap-3 lg:grid-cols-3">
                  {cronSyncResult.smartPushNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="flex flex-col justify-between rounded-xl border border-slate-700/80 bg-slate-800/90 p-3 shadow-xs"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                            {notif.scheduledWindowLabel}
                          </span>
                          <span className="rounded-full bg-slate-700 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                            {notif.badgeText}
                          </span>
                        </div>
                        <p className="mt-1.5 font-bold text-white">{notif.title}</p>
                        <p className="mt-0.5 text-[11px] font-semibold text-emerald-300">
                          {notif.subtitle}
                        </p>
                        <p className="mt-1.5 text-[11px] leading-relaxed text-slate-300">
                          {notif.body}
                        </p>
                      </div>
                      <div className="mt-2.5 flex items-center justify-between border-t border-slate-700/60 pt-2 text-[10px] text-slate-400">
                        <span>Trigger: {notif.triggerType}</span>
                        <span>Priority: {notif.priority.toUpperCase()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )}

          {/* Optional API Key Drawer */}
          {showKeyModal && (
            <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-slate-700">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-slate-900">
                    Optional Free-Tier Gemini 2.5 Flash Key (Zero Cost via Google AI Studio)
                  </p>
                  <p className="text-slate-600">
                    The app runs 100% free out-of-the-box using the built-in Stew/Casserole Algorithmic Matcher. Paste a free Gemini key here (or in{' '}
                    <code className="rounded bg-white px-1 py-0.5">.env.local</code>) to enable custom AI recipe remixing.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder="AIzaSy... (Gemini API Key)"
                    className="w-56 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none"
                  />
                  <button
                    onClick={() => setShowKeyModal(false)}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 font-semibold text-white hover:bg-emerald-700"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Primary Navigation Tabs */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              <button
                onClick={() => setActiveTab('BOARD')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                  activeTab === 'BOARD'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <ShoppingBag className="h-4 w-4" />
                <span>1. Value Board</span>
                <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[11px] text-emerald-300">
                  {data.commodities.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('MEAL_PLAN')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                  activeTab === 'MEAL_PLAN'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <Flame className="h-4 w-4" />
                <span>2. 3-Dish Meal Prep</span>
                <span className="rounded-full bg-black/15 px-1.5 py-0.5 text-[11px]">
                  ${trioTotals.avgPerServing}/srv
                </span>
              </button>

              <button
                onClick={() => setActiveTab('SHOPPING_LIST')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                  activeTab === 'SHOPPING_LIST'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-indigo-50 text-indigo-950 border border-indigo-200 hover:bg-indigo-100'
                }`}
              >
                <ListChecks className="h-4 w-4" />
                <span>3. Shopping List &amp; Cart Bridge</span>
                <span className="rounded-full bg-black/15 px-1.5 py-0.5 text-[11px]">
                  {shoppingPlan.items.length} items
                </span>
              </button>

              <button
                onClick={() => setActiveTab('RADAR')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                  activeTab === 'RADAR'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Radar className="h-4 w-4" />
                <span>4. Cycle &amp; Club Radar</span>
              </button>
            </div>

            {(pinnedIds.length > 0 || effectiveOnHandIds.length > 0) && (
              <div className="hidden items-center gap-2 md:flex">
                <span className="text-xs font-medium text-slate-600">
                  {pinnedIds.length > 0 && `${pinnedIds.length} Pinned`}
                  {pinnedIds.length > 0 && effectiveOnHandIds.length > 0 && ' • '}
                  {effectiveOnHandIds.length > 0 &&
                    `${effectiveOnHandIds.length} In Freezer/Pantry ($0)`}
                </span>
                <button
                  onClick={() => setActiveTab('MEAL_PLAN')}
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  <span>View 3 Dishes</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-5">
        {/* =========================================================
            TAB 1: THE WEEKEND VALUE BOARD
           ========================================================= */}
        {activeTab === 'BOARD' && (
          <div className="space-y-6">
            {/* Splurge Value Alerts Callout Strip */}
            {data.splurgeAlerts.length > 0 && (
              <section className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 p-4 text-white shadow-md">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-400/20 text-amber-300">
                      <Gem className="h-4 w-4" />
                    </span>
                    <div>
                      <h2 className="text-sm font-bold tracking-wide text-amber-300 uppercase">
                        Splurge Value Alerts &amp; Multi-Week Freezer Arbitrage
                      </h2>
                      <p className="text-xs text-slate-300">
                        Premium roasts, steaks, and seafood at 40–54% off. Use &ldquo;Buy 2: Prep 1, Freeze 1&rdquo; to lock in cycle-floor pricing for future weeks.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {data.splurgeAlerts.slice(0, 4).map((item) => {
                    const isPinned = pinnedIds.includes(item.ingredient.id);
                    const inFreezer = freezerItems.some(
                      (f) => f.canonicalIngredientId === item.ingredient.id
                    );
                    return (
                      <div
                        key={item.ingredient.id}
                        className="flex flex-col justify-between rounded-xl border border-white/15 bg-white/10 p-3 backdrop-blur-xs"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            {renderStoreBadge(item.bestOffer.store)}
                            <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-xs font-bold text-emerald-300">
                              -{item.discountVsRegularPct}% OFF
                            </span>
                          </div>
                          <h3 className="mt-2 font-bold text-white">
                            {item.ingredient.name}
                          </h3>
                          <div className="mt-1 flex items-baseline gap-2">
                            <span className="text-xl font-extrabold text-amber-300">
                              ${item.bestOffer.normalizedPricePerUnit.toFixed(2)}
                              <span className="text-xs font-normal text-slate-300">
                                /{item.ingredient.standardUnit}
                              </span>
                            </span>
                            <span className="text-xs text-slate-400 line-through">
                              Reg ${item.bestOffer.regularPricePerUnit.toFixed(2)}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-slate-300">
                            {item.bestOffer.rawPriceText}
                          </p>
                          {item.clubBenchmark?.beatsClubBulk && (
                            <p className="mt-1 text-[11px] font-semibold text-emerald-300">
                              🏆 Beats {item.clubBenchmark.bestClubName} Bulk ($
                              {item.clubBenchmark.bestClubPricePerUnit.toFixed(2)}/
                              {item.ingredient.standardUnit}) by{' '}
                              {item.clubBenchmark.savingsVsClubPct}%
                            </p>
                          )}
                        </div>

                        <div className="mt-3 space-y-1.5 border-t border-white/10 pt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-amber-200/90">
                              {item.bestOffer.dealType === 'DIGITAL_COUPON'
                                ? '📱 Clip App Coupon'
                                : '🏷️ Member Card'}
                            </span>
                            <button
                              onClick={() => handleTogglePin(item.ingredient.id)}
                              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                                isPinned
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-white/15 text-white hover:bg-white/25'
                              }`}
                            >
                              {isPinned ? (
                                <>
                                  <Check className="h-3.5 w-3.5" /> Pinned
                                </>
                              ) : (
                                <>
                                  <Pin className="h-3.5 w-3.5" /> Pin to Prep
                                </>
                              )}
                            </button>
                          </div>

                          {item.arbitragePrompt?.eligible && (
                            <button
                              type="button"
                              onClick={() => handleBuyTwoPrepOneFreezeOne(item)}
                              className={`w-full flex items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-bold transition ${
                                inFreezer
                                  ? 'bg-sky-500 text-white'
                                  : 'bg-sky-400/25 text-sky-200 border border-sky-400/40 hover:bg-sky-400/40'
                              }`}
                            >
                              <Snowflake className="h-3 w-3" />
                              <span>
                                {inFreezer
                                  ? '✓ Banked in Virtual Freezer (+Add 1)'
                                  : `Buy 2: Prep 1, Freeze 1 (Save $${item.arbitragePrompt.futureWeekSavings.toFixed(2)})`}
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Category & Sort Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { id: 'ALL', label: 'All Categories' },
                    { id: 'PROTEIN', label: '🥩 Meat, Poultry & Seafood' },
                    { id: 'PRODUCE', label: '🥬 Fresh Produce' },
                    { id: 'DAIRY_EGGS', label: '🧀 Dairy & Eggs' },
                  ] as const
                ).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryFilter(cat.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      categoryFilter === cat.id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="font-medium text-slate-500">Sort by:</span>
                <select
                  value={sortMode}
                  onChange={(e) =>
                    setSortMode(
                      e.target.value as
                        | 'VALUE_SCORE'
                        | 'LOWEST_PRICE'
                        | 'BIGGEST_DISCOUNT'
                    )
                  }
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-semibold text-slate-800 focus:border-emerald-600 focus:outline-none"
                >
                  <option value="VALUE_SCORE">
                    Best Meal-Prep Value (Affordability + Discount)
                  </option>
                  <option value="LOWEST_PRICE">
                    Absolute Lowest Cost ($/lb or $/doz)
                  </option>
                  <option value="BIGGEST_DISCOUNT">
                    Biggest % Off Regular Price
                  </option>
                </select>
              </div>
            </div>

            {/* Main Commodity Leaderboard Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCommodities.map((item: ScoredCommodity) => {
                const isPinned = pinnedIds.includes(item.ingredient.id);
                const isOnHand = effectiveOnHandIds.includes(item.ingredient.id);
                const inVirtualFreezer = freezerItems.some(
                  (f) => f.canonicalIngredientId === item.ingredient.id
                );
                const { ingredient, bestOffer, kingSoopersOffer, safewayOffer } = item;

                return (
                  <div
                    key={ingredient.id}
                    className={`flex flex-col justify-between rounded-2xl border bg-white p-4 transition shadow-2xs hover:shadow-md ${
                      isPinned
                        ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                        : isOnHand
                          ? 'border-sky-400 ring-2 ring-sky-400/20'
                          : item.cycleSignal?.status === 'CYCLE_PEAK_WAIT'
                            ? 'border-rose-200 bg-rose-50/15'
                            : 'border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {renderStoreBadge(bestOffer.store)}
                          <span className="text-xs font-medium text-slate-500">
                            {ingredient.subcategory}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {item.isSplurgeAlert && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-bold text-indigo-800">
                              <Gem className="h-3 w-3" /> Splurge Deal
                            </span>
                          )}
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              item.valueScore >= 85
                                ? 'bg-emerald-100 text-emerald-900'
                                : item.valueScore >= 70
                                  ? 'bg-teal-100 text-teal-900'
                                  : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            Value {item.valueScore}/100
                          </span>
                        </div>
                      </div>

                      <h3 className="mt-2.5 text-base font-bold text-slate-900">
                        {ingredient.name}
                      </h3>

                      {/* v1.2 Ticket #24 & #25: Cycle Low Signal Badge + Beats Club Bulk Pill */}
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {renderCycleSignalBadge(item)}
                        {item.clubBenchmark?.beatsClubBulk && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-blue-900 border border-blue-300">
                            <Award className="h-3 w-3 text-blue-700" />
                            <span>
                              Beats {item.clubBenchmark.bestClubName} Bulk (-
                              {item.clubBenchmark.savingsVsClubPct}%)
                            </span>
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex items-baseline justify-between rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                        <div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-extrabold text-slate-900">
                              ${bestOffer.normalizedPricePerUnit.toFixed(2)}
                            </span>
                            <span className="text-xs font-semibold text-slate-600">
                              / {ingredient.standardUnit}
                            </span>
                            {item.discountVsRegularPct > 0 && (
                              <span className="ml-1 rounded-md bg-emerald-600 px-1.5 py-0.5 text-[11px] font-bold text-white">
                                -{item.discountVsRegularPct}%
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs font-medium text-slate-700">
                            {bestOffer.rawPriceText}
                          </p>
                        </div>

                        <div className="text-right text-[11px] text-slate-500">
                          <div>
                            Reg: ${bestOffer.regularPricePerUnit.toFixed(2)}/
                            {ingredient.standardUnit}
                          </div>
                          <div>
                            USDA Avg: ${ingredient.mountainBaselinePerUnit.toFixed(2)}/
                            {ingredient.standardUnit}
                          </div>
                        </div>
                      </div>

                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        {renderDealBadge(bestOffer.dealType)}
                        {bestOffer.dealConditions && (
                          <span className="text-[11px] text-slate-600">
                            {bestOffer.dealConditions}
                          </span>
                        )}
                      </div>

                      {/* v1.2 Ticket #25: Wholesale Club (Costco & Sam's Club) Benchmark Breakdown */}
                      {item.clubBenchmark && (
                        <div className="mt-2.5 rounded-lg border border-blue-100 bg-blue-50/50 px-2.5 py-2 text-[11px]">
                          <div className="flex items-center justify-between font-semibold text-slate-800">
                            <span>
                              Costco Bulk: ${item.clubBenchmark.costcoPricePerUnit.toFixed(2)}/
                              {ingredient.standardUnit}
                            </span>
                            <span>
                              Sam&apos;s Club: $
                              {item.clubBenchmark.samsClubPricePerUnit.toFixed(2)}/
                              {ingredient.standardUnit}
                            </span>
                          </div>
                          <div
                            className={`mt-0.5 text-[10px] font-bold ${
                              item.clubBenchmark.beatsClubBulk
                                ? 'text-emerald-700'
                                : 'text-amber-800'
                            }`}
                          >
                            {item.clubBenchmark.verdictLabel}
                          </div>
                        </div>
                      )}

                      <div className="mt-2.5 grid grid-cols-2 gap-2 rounded-lg border border-slate-100 bg-slate-50/70 p-2 text-xs">
                        <div
                          className={`rounded p-1.5 ${
                            bestOffer.store === 'KING_SOOPERS'
                              ? 'bg-blue-50/90 font-semibold text-blue-950 border border-blue-200'
                              : 'text-slate-600'
                          }`}
                        >
                          <div className="text-[10px] uppercase tracking-wider text-slate-500">
                            {resolveStoreBanner('KING_SOOPERS', currentZip)}
                          </div>
                          {kingSoopersOffer ? (
                            <div>
                              ${kingSoopersOffer.normalizedPricePerUnit.toFixed(2)}/
                              {ingredient.standardUnit}{' '}
                              <span className="text-[10px] font-normal">
                                (
                                {kingSoopersOffer.dealType === 'DIGITAL_COUPON'
                                  ? 'App Cpn'
                                  : 'Card'}
                                )
                              </span>
                            </div>
                          ) : (
                            <div>N/A</div>
                          )}
                        </div>

                        <div
                          className={`rounded p-1.5 ${
                            bestOffer.store === 'SAFEWAY'
                              ? 'bg-red-50/90 font-semibold text-red-950 border border-red-200'
                              : 'text-slate-600'
                          }`}
                        >
                          <div className="text-[10px] uppercase tracking-wider text-slate-500">
                            {resolveStoreBanner('SAFEWAY', currentZip)}
                          </div>
                          {safewayOffer ? (
                            <div>
                              ${safewayOffer.normalizedPricePerUnit.toFixed(2)}/
                              {ingredient.standardUnit}{' '}
                              <span className="text-[10px] font-normal">
                                (
                                {safewayOffer.dealType === 'DIGITAL_COUPON'
                                  ? 'for U Cpn'
                                  : 'Member'}
                                )
                              </span>
                            </div>
                          ) : (
                            <div>N/A</div>
                          )}
                        </div>
                      </div>

                      {/* v1.2 Ticket #24: Cycle Peak / Smart Substitution Recommendation */}
                      {item.cycleSignal?.status === 'CYCLE_PEAK_WAIT' &&
                        item.cycleSignal.substitutionSuggestion && (
                          <div className="mt-2.5 rounded-lg border border-rose-200 bg-rose-50/70 p-2 text-[11px] text-rose-950">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold">
                                💡 Smart Cycle Substitution:
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleTogglePin(
                                    item.cycleSignal!.substitutionSuggestion!
                                      .substituteIngredientId
                                  )
                                }
                                className="rounded bg-rose-700 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-rose-800"
                              >
                                Pin {item.cycleSignal.substitutionSuggestion.substituteName.split(' ')[0]} Instead
                              </button>
                            </div>
                            <p className="mt-1 text-[10px] text-rose-900">
                              {item.cycleSignal.substitutionSuggestion.reason}
                            </p>
                          </div>
                        )}

                      <div className="mt-2.5 flex items-start gap-1.5 text-[11px] text-slate-600">
                        {ingredient.usdaSignal.wholesaleChangePct <= 0 ? (
                          <TrendingDown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                        ) : (
                          <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                        )}
                        <span>
                          <strong className="text-slate-800">
                            USDA Wholesale (
                            {ingredient.usdaSignal.wholesaleChangePct > 0 ? '+' : ''}
                            {ingredient.usdaSignal.wholesaleChangePct}%):
                          </strong>{' '}
                          {ingredient.usdaSignal.note}
                        </span>
                      </div>

                      {/* v0.2 + v1.2 SQLite 6-Week Price History Mini-Chart */}
                      {item.priceHistory && item.priceHistory.length > 0 && (
                        <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50/80 p-2">
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span className="font-semibold text-slate-700">
                              6-Wk Range: Floor ${item.sixWeekLow.toFixed(2)} • Med $
                              {(item.sixWeekMedian ?? item.sixWeekLocalAvg).toFixed(2)} • Peak $
                              {(item.sixWeekHigh ?? item.sixWeekLocalAvg).toFixed(2)}
                            </span>
                            {bestOffer.normalizedPricePerUnit <= item.sixWeekLow + 0.02 && (
                              <span className="rounded bg-emerald-100 px-1.5 py-0.2 font-bold text-emerald-800">
                                ★ 6-Week Floor
                              </span>
                            )}
                          </div>
                          <div className="mt-1.5 grid grid-cols-6 gap-1 items-end h-9 pt-1">
                            {item.priceHistory.map((pt) => {
                              const maxP = Math.max(
                                ...item.priceHistory.map((h) => h.bestLocalPrice),
                                1
                              );
                              const heightPct = Math.max(
                                22,
                                Math.round((pt.bestLocalPrice / maxP) * 100)
                              );
                              const isCurrent = pt.weekStart === '2026-10-14';
                              return (
                                <div
                                  key={pt.weekStart}
                                  className="flex flex-col items-center justify-end h-full"
                                  title={`${pt.label}: Best $${pt.bestLocalPrice.toFixed(2)} (KS $${pt.kingSoopersPrice.toFixed(2)} | SW $${pt.safewayPrice.toFixed(2)})`}
                                >
                                  <div
                                    style={{ height: `${heightPct}%` }}
                                    className={`w-full rounded-t ${
                                      isCurrent ? 'bg-emerald-600' : 'bg-slate-300'
                                    }`}
                                  />
                                  <span className="mt-0.5 text-[9px] leading-none text-slate-500">
                                    ${pt.bestLocalPrice.toFixed(2)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer Action Buttons: Pin to Meal Prep + Have at Home + Buy 2 Freeze 1 Arbitrage */}
                    <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleTogglePin(ingredient.id)}
                          className={`flex items-center justify-center gap-1 rounded-xl px-2.5 py-2 text-xs font-bold transition ${
                            isPinned
                              ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
                              : 'bg-slate-900 text-white hover:bg-slate-800'
                          }`}
                        >
                          {isPinned ? (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              <span>Pinned</span>
                            </>
                          ) : (
                            <>
                              <Pin className="h-3.5 w-3.5" />
                              <span>Pin to Prep</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleToggleOnHand(ingredient.id)}
                          title="Mark as already in your Virtual Freezer/Pantry ($0 out-of-pocket cost)"
                          className={`flex items-center justify-center gap-1 rounded-xl border px-2.5 py-2 text-xs font-bold transition ${
                            isOnHand
                              ? 'border-sky-500 bg-sky-600 text-white shadow-xs'
                              : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          <Snowflake className="h-3.5 w-3.5" />
                          <span>
                            {inVirtualFreezer
                              ? 'In Freezer ($0)'
                              : isOnHand
                                ? 'On-Hand ($0)'
                                : 'Have at Home'}
                          </span>
                        </button>
                      </div>

                      {/* v1.2 Ticket #21: "Buy 2: Prep 1, Freeze 1" Action Button */}
                      {item.arbitragePrompt?.eligible && (
                        <button
                          type="button"
                          onClick={() => handleBuyTwoPrepOneFreezeOne(item)}
                          className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-sky-300 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-900 hover:bg-sky-100 transition"
                        >
                          <Snowflake className="h-3.5 w-3.5 text-sky-600" />
                          <span>
                            Buy 2: Prep 1, Freeze 1 (+{item.arbitragePrompt.recommendedFreezeQty}{' '}
                            {item.arbitragePrompt.unit} @ $
                            {bestOffer.normalizedPricePerUnit.toFixed(2)} • Save $
                            {item.arbitragePrompt.futureWeekSavings.toFixed(2)})
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 2: THE 3-DISH STEW & CASSEROLE MEAL PREP PLAN
           ========================================================= */}
        {activeTab === 'MEAL_PLAN' && (
          <div className="space-y-6">
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
                    Optimized around this week&apos;s lowest $/lb anchors in {data.cityLabel}, tailored to your Macro &amp; Dietary profile, and powered by $0 Virtual Freezer inventory.
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
                    <div className="text-[11px] text-slate-300 uppercase">Cost / Serving</div>
                    <div className="text-xl font-black text-emerald-300">
                      ${trioTotals.avgPerServing}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      across {trioTotals.totalServings} portions
                    </div>
                  </div>
                  <div className="border-x border-white/15 px-2">
                    <div className="text-[11px] text-slate-300 uppercase">
                      3-Dish Out-of-Pocket
                    </div>
                    <div className="text-xl font-black text-white">
                      ${trioTotals.totalBatchCost}
                    </div>
                    <div className="text-[10px] text-slate-400 line-through">
                      Reg ${trioTotals.totalRegularCost}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-amber-300 uppercase">Total Saved</div>
                    <div className="text-xl font-black text-amber-300">
                      ${trioTotals.totalSavings}
                    </div>
                    <div className="text-[10px] text-emerald-200">promos + freezer</div>
                  </div>
                </div>
              </div>

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
                      onClick={() => {
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
                      }}
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

              {/* AI Custom Chef Bar */}
              <div className="mt-4 border-t border-white/15 pt-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    type="text"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Optional AI Twist: e.g., 'Make 2 slow cooker stews and 1 high-protein sheet-pan roast, extra spicy'..."
                    className="flex-1 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2 text-xs text-white placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none"
                  />
                  <button
                    onClick={handleGenerateAiPlan}
                    disabled={aiLoading}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
                  >
                    {aiLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Generating with Gemini 2.5 Flash...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span>Remix 3-Dish Plan (Gemini Free Tier)</span>
                      </>
                    )}
                  </button>
                </div>

                {aiBannerMessage && (
                  <p className="mt-2 rounded-lg bg-white/10 px-3 py-1.5 text-xs text-amber-200">
                    {aiBannerMessage}
                  </p>
                )}
              </div>
            </section>

            {/* The 3 Recommended Batch Dishes */}
            <div className="space-y-4">
              {activeTrio.map((dish, index) => {
                const isExpanded = Boolean(expandedDishIds[dish.id]);
                const isSaved = Boolean(dish.savedInLibrary || savedRecipeIds[dish.id]);
                const hasFreezerPower =
                  (dish.poweredByFreezerCount && dish.poweredByFreezerCount > 0) ||
                  dish.matchedIngredients.some((m) => m.fromVirtualFreezer || m.isOnHand);

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
                            {hasFreezerPower && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-sky-600 px-2.5 py-0.5 text-xs font-bold text-white">
                                <Snowflake className="h-3.5 w-3.5" />
                                Powered by Virtual Freezer ($0 Stock)
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
                                Per Serving ({dish.servings} srv)
                              </div>
                              <div className="text-2xl font-black text-emerald-700">
                                ${dish.costPerServing.toFixed(2)}
                              </div>
                            </div>
                            <div className="border-l border-emerald-200 pl-3 text-xs text-slate-600">
                              <div>
                                Batch:{' '}
                                <strong className="text-slate-900">
                                  ${dish.totalBatchCost.toFixed(2)}
                                </strong>
                              </div>
                              <div className="text-emerald-700 font-semibold">
                                Save ${dish.totalBatchSavings.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 sm:p-5">
                      <h4 className="mb-2.5 text-xs font-bold tracking-wider text-slate-500 uppercase">
                        On-Sale Store Ingredients Used in This Batch ({dish.servings} Servings)
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
                                  <Snowflake className="h-3 w-3" />{' '}
                                  {ing.fromVirtualFreezer
                                    ? 'Virtual Freezer ($0)'
                                    : 'In Freezer/Pantry'}
                                </span>
                              ) : (
                                renderStoreBadge(ing.store)
                              )}
                            </div>
                            <div className="mt-1 font-bold text-slate-900">
                              {ing.ingredientName}
                            </div>
                            <div className="mt-1 flex items-baseline justify-between">
                              <span className="text-slate-600">
                                Need:{' '}
                                <strong>
                                  {ing.quantityUsed} {ing.unit}
                                </strong>{' '}
                                (@ ${ing.unitCost.toFixed(2)}/{ing.unit})
                              </span>
                              <span className="text-sm font-extrabold text-emerald-700">
                                ${ing.slotCost.toFixed(2)}
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
                            Pantry Staples (+${dish.estimatedPantryCost.toFixed(2)}):
                          </strong>{' '}
                          {dish.pantryStaples.join(' • ')}
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

            {/* Option to Browse All Evaluated Stew/Casserole Blueprints */}
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
                        onClick={() => {
                          setCustomAiDishes([
                            dish,
                            ...activeTrio.filter((d) => d.id !== dish.id).slice(0, 2),
                          ]);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="shrink-0 rounded-lg bg-slate-900 px-2.5 py-1.5 font-semibold text-white hover:bg-emerald-600"
                      >
                        Promote to Top 3
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 3: SHOPPING LIST, 1-TAP CURBSIDE CART BRIDGE & EXPORT
           ========================================================= */}
        {activeTab === 'SHOPPING_LIST' && (
          <div className="space-y-6">
            <section className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-5 text-white shadow-md no-print">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-300">
                    <Store className="h-3.5 w-3.5" />
                    <span>
                      Store Split Optimizer &amp; 1-Tap Curbside Cart Bridge (Tickets #7 &amp; #23)
                    </span>
                  </div>
                  <h2 className="mt-2 text-xl font-extrabold sm:text-2xl">
                    {shoppingPlan.tripComparison.recommendationHeadline}
                  </h2>
                  <p className="mt-1 text-xs text-slate-300 sm:text-sm">
                    {shoppingPlan.tripComparison.recommendationDetail}
                  </p>
                </div>

                <div className="text-right text-xs text-slate-300">
                  <div>Regular Shelf Price Without Promos:</div>
                  <div className="text-lg font-bold text-slate-400 line-through">
                    ${shoppingPlan.tripComparison.regularShelfTotal.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {/* Optimal 2-Store Split Card (v1.1) */}
                <button
                  onClick={() => setTripMode('SPLIT')}
                  className={`w-full flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border p-4 text-left transition gap-3 ${
                    tripMode === 'SPLIT'
                      ? 'border-emerald-400 bg-emerald-500/20 ring-2 ring-emerald-400/40 shadow-sm'
                      : 'border-white/15 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                        ⚡ Optimal 2-Store Split:{' '}
                        {shoppingPlan.tripComparison.bestTwoStoreSplit?.storeNames.join(
                          ' + '
                        ) || 'Multi-Store'}
                      </span>
                      {tripMode === 'SPLIT' && (
                        <span className="rounded-full bg-emerald-400 px-2 py-0.5 text-[10px] font-bold text-slate-950">
                          Active Cart
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-slate-300">
                      {shoppingPlan.tripComparison.bestTwoStoreSplit?.splitSummary ||
                        'Cheapest ingredient across stores'}
                    </div>
                  </div>
                  <div className="text-left sm:text-right shrink-0">
                    <div className="text-2xl font-black text-white">
                      $
                      {(
                        shoppingPlan.tripComparison.bestTwoStoreSplit?.total ??
                        shoppingPlan.tripComparison.optimalSplitTotal
                      ).toFixed(2)}
                    </div>
                    <div className="text-[11px] text-emerald-300 font-semibold">
                      Save $
                      {(
                        shoppingPlan.tripComparison.regularShelfTotal -
                        (shoppingPlan.tripComparison.bestTwoStoreSplit?.total ??
                          shoppingPlan.tripComparison.optimalSplitTotal)
                      ).toFixed(2)}{' '}
                      vs regular shelf
                    </div>
                  </div>
                </button>

                {/* Ranked 1-Stop Store Leaderboard (v1.1) */}
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Ranked 1-Stop Trips (All {shoppingPlan.items.length} Ingredients at 1 Store)
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {(shoppingPlan.tripComparison.singleStoreRankings || []).map(
                      (rank, idx) => {
                        const def = getStoreDefinition(rank.store);
                        const isSelected = tripMode === rank.store;
                        return (
                          <button
                            key={rank.store}
                            onClick={() => setTripMode(rank.store)}
                            className={`flex flex-col justify-between rounded-xl border p-3 text-left transition ${
                              isSelected
                                ? 'border-indigo-400 bg-indigo-500/25 ring-2 ring-indigo-400/40'
                                : 'border-white/15 bg-white/5 hover:bg-white/10'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-slate-300">
                                  #{idx + 1}
                                </span>
                                <span
                                  style={{
                                    backgroundColor: def.brandColor,
                                    color: '#ffffff',
                                  }}
                                  className="rounded-md px-2 py-0.5 text-[11px] font-bold shadow-xs"
                                >
                                  {rank.storeName}
                                </span>
                              </div>
                              {isSelected ? (
                                <span className="rounded-full bg-indigo-400 px-2 py-0.5 text-[10px] font-bold text-slate-950">
                                  Active
                                </span>
                              ) : rank.isBest ? (
                                <span className="rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 px-1.5 py-0.5 text-[10px] font-bold">
                                  🏆 Lowest 1-Stop
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-medium">
                                  +${rank.diffFromBest.toFixed(2)} vs #1
                                </span>
                              )}
                            </div>
                            <div className="mt-2 flex items-baseline justify-between">
                              <span className="text-xl font-black text-white">
                                ${rank.total.toFixed(2)}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                +$
                                {(
                                  rank.total -
                                  (shoppingPlan.tripComparison.bestTwoStoreSplit?.total ??
                                    shoppingPlan.tripComparison.optimalSplitTotal)
                                ).toFixed(2)}{' '}
                                vs split
                              </span>
                            </div>
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* v1.2 Ticket #23: Export to Notes / Keep & Printable Slip Action Bar */}
            <section className="rounded-2xl border border-emerald-300 bg-emerald-50/70 p-4 shadow-2xs no-print">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    1-Tap Curbside Cart Bridge &amp; Multi-Store Checklist Export (Ticket #23)
                  </h3>
                  <p className="text-xs text-slate-600">
                    Export your aisle-grouped checklist to Apple Notes, Google Keep, or Reminders—or use the 1-tap curbside search links below to load Walmart, Target, Kroger, or Instacart carts.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyShoppingListForNotes}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
                  >
                    {copiedChecklist ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Copied for Apple Notes / Keep!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span>Export to Notes / Keep (By Aisle)</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPrintSlipModal(!showPrintSlipModal)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100 transition"
                  >
                    <Printer className="h-4 w-4 text-slate-700" />
                    <span>
                      {showPrintSlipModal
                        ? 'Hide Printable Slip'
                        : 'Preview Printable Slip'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintShoppingSlip}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Print Checklist</span>
                  </button>
                </div>
              </div>
            </section>

            {/* v1.2 Ticket #23: High-Contrast Printable Shopping Slip */}
            {showPrintSlipModal && (
              <section className="rounded-2xl border-2 border-slate-900 bg-white p-5 text-black shadow-md">
                <div className="flex items-center justify-between border-b-2 border-black pb-3">
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight">
                      PantryBot Weekend In-Store &amp; Curbside Slip
                    </h3>
                    <p className="text-xs font-semibold text-slate-700">
                      {data.cityLabel} ({currentZip}) • {data.adCycleLabel} •{' '}
                      {activeTrio.length} Batch Dishes ({trioTotals.totalServings} Meals)
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold uppercase">Est. Basket Total</div>
                    <div className="text-xl font-black">
                      $
                      {(
                        shoppingPlan.tripComparison.bestTwoStoreSplit?.total ??
                        shoppingPlan.tripComparison.optimalSplitTotal
                      ).toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {(['PRODUCE', 'PROTEIN', 'DAIRY_EGGS'] as CommodityCategory[]).map(
                    (cat) => {
                      const catItems = resolvedShoppingItems.filter(
                        (i) => i.category === cat
                      );
                      if (catItems.length === 0) return null;
                      const catTitle =
                        cat === 'PRODUCE'
                          ? '🥬 Fresh Produce Aisle'
                          : cat === 'PROTEIN'
                            ? '🥩 Meat & Seafood Counter'
                            : '🧀 Dairy & Eggs Wall';
                      return (
                        <div key={cat} className="space-y-1.5">
                          <h4 className="border-b border-slate-400 pb-1 text-xs font-black uppercase">
                            {catTitle}
                          </h4>
                          {catItems.map((cItem) => (
                            <div
                              key={`print-${cItem.ingredientId}`}
                              className="flex items-start justify-between gap-2 text-xs py-1 border-b border-slate-100"
                            >
                              <div className="flex items-start gap-2">
                                <span className="inline-block h-3.5 w-3.5 border border-black mt-0.5 shrink-0" />
                                <div>
                                  <span className="font-bold">
                                    {cItem.ingredientName}
                                  </span>{' '}
                                  ({cItem.totalQuantityNeeded} {cItem.unit})
                                  <div className="text-[10px] text-slate-700">
                                    [{resolveStoreBanner(cItem.activeStore, currentZip)}] •{' '}
                                    {cItem.activeRawDealText}
                                    {cItem.activeDealType === 'DIGITAL_COUPON'
                                      ? ' • 📱 CLIP COUPON'
                                      : ''}
                                  </div>
                                </div>
                              </div>
                              <span className="font-black">
                                ${cItem.activeTotalCost.toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                  )}
                </div>
              </section>
            )}

            {/* Digital Coupon Pre-Flight Checklist (Grouped by Store App - v1.1) */}
            {digitalCouponItems.length > 0 && (
              <section className="rounded-2xl border border-amber-300 bg-amber-50/70 p-4 sm:p-5 shadow-2xs no-print">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-white">
                      <Smartphone className="h-4 w-4" />
                    </span>
                    <div>
                      <h3 className="text-sm font-extrabold text-amber-950 sm:text-base">
                        Digital Coupon Pre-Flight Checklist ({digitalCouponItems.length}{' '}
                        Coupons to Clip)
                      </h3>
                      <p className="text-xs text-amber-800">
                        Clip these in the respective store app before checkout to guarantee advertised promotional pricing.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 space-y-4">
                  {Array.from(
                    digitalCouponItems
                      .reduce((acc, cItem) => {
                        const def = getStoreDefinition(cItem.activeStore);
                        const appName =
                          def.couponAppLabel ||
                          `${resolveStoreBanner(cItem.activeStore, currentZip)} App`;
                        const list = acc.get(appName) || [];
                        list.push(cItem);
                        acc.set(appName, list);
                        return acc;
                      }, new Map<string, typeof digitalCouponItems>())
                      .entries()
                  ).map(([appName, appItems]) => (
                    <div
                      key={appName}
                      className="rounded-xl border border-amber-200/80 bg-white/70 p-3"
                    >
                      <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-amber-100">
                        <Smartphone className="h-3.5 w-3.5 text-amber-700" />
                        <span className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                          {appName} ({appItems.length}{' '}
                          {appItems.length === 1 ? 'coupon' : 'coupons'})
                        </span>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {appItems.map((cItem) => {
                          const couponKey = `${cItem.activeStore}-${cItem.ingredientId}`;
                          const isClipped = Boolean(clippedCoupons[couponKey]);
                          return (
                            <div
                              key={couponKey}
                              onClick={() => toggleClippedCoupon(couponKey)}
                              className={`flex cursor-pointer items-center justify-between rounded-xl border p-2.5 transition ${
                                isClipped
                                  ? 'border-emerald-300 bg-emerald-50/80 opacity-80'
                                  : 'border-amber-200 bg-white hover:border-amber-400'
                              }`}
                            >
                              <div className="space-y-0.5 pr-2">
                                <div className="flex items-center gap-1.5">
                                  {renderStoreBadge(cItem.activeStore)}
                                  <span className="text-xs font-bold text-slate-900">
                                    {cItem.ingredientName}
                                  </span>
                                </div>
                                <p className="text-xs font-semibold text-amber-900">
                                  {cItem.activeRawDealText}
                                </p>
                                {cItem.activeDealConditions && (
                                  <p className="text-[11px] text-slate-600">
                                    {cItem.activeDealConditions}
                                  </p>
                                )}
                              </div>

                              <button
                                type="button"
                                className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold ${
                                  isClipped
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                                }`}
                              >
                                {isClipped ? (
                                  <>
                                    <Check className="h-3.5 w-3.5" /> Clipped
                                  </>
                                ) : (
                                  <>
                                    <Smartphone className="h-3.5 w-3.5" /> Clip
                                  </>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Aggregated & Deduplicated Shopping List with 1-Tap Curbside Links */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 sm:text-lg">
                    Deduplicated 3-Dish Shopping List ({resolvedShoppingItems.length} Unique Store Staples)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Overlapping ingredients across your 3 batch dishes are automatically combined. Click any 1-tap curbside link to open the item directly in Walmart, Target, Kroger, or Instacart.
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2.5">
                {resolvedShoppingItems.map((item) => {
                  const isChecked = Boolean(checkedItems[item.ingredientId]);
                  const { primaryLink, bridgeLinks } = getItemCurbsideLinks(
                    item.activeStore,
                    item.ingredientName,
                    currentZip
                  );

                  return (
                    <div
                      key={item.ingredientId}
                      className={`flex flex-col justify-between gap-2.5 rounded-xl border p-3.5 transition lg:flex-row lg:items-center ${
                        item.isOnHand
                          ? 'border-sky-300 bg-sky-50/50'
                          : isChecked
                            ? 'border-slate-200 bg-slate-50 opacity-60'
                            : 'border-slate-200 bg-white hover:border-emerald-400'
                      }`}
                    >
                      <div className="flex flex-1 items-start gap-3">
                        <button
                          type="button"
                          onClick={() => toggleCheckedItem(item.ingredientId)}
                          className="mt-0.5 text-emerald-600"
                        >
                          {isChecked ? (
                            <CheckSquare className="h-5 w-5" />
                          ) : (
                            <Square className="h-5 w-5 text-slate-400" />
                          )}
                        </button>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {item.isOnHand ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-sky-600 px-2 py-0.5 text-xs font-bold text-white">
                                <Snowflake className="h-3 w-3" /> In Virtual Freezer / Pantry ($0)
                              </span>
                            ) : (
                              renderStoreBadge(item.activeStore)
                            )}
                            <span
                              onClick={() => toggleCheckedItem(item.ingredientId)}
                              className={`cursor-pointer text-sm font-bold ${
                                isChecked
                                  ? 'line-through text-slate-500'
                                  : 'text-slate-900'
                              }`}
                            >
                              {item.ingredientName}
                            </span>
                            {!item.isOnHand && renderDealBadge(item.activeDealType)}
                          </div>
                          <p className="text-xs text-slate-600">
                            <strong>
                              Total Needed: {item.totalQuantityNeeded} {item.unit}
                            </strong>{' '}
                            • Used in:{' '}
                            {item.usedInDishes
                              .map((u) => `${u.dishTitle} (${u.quantity} ${item.unit})`)
                              .join(' + ')}
                          </p>

                          {/* v1.2 Ticket #23: Direct 1-Tap Curbside Search Links */}
                          {!item.isOnHand && (
                            <div className="pt-1 flex flex-wrap items-center gap-1.5 no-print">
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                1-Tap Curbside:
                              </span>
                              <a
                                href={primaryLink.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  backgroundColor: primaryLink.brandColor,
                                  color: '#ffffff',
                                }}
                                className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold shadow-2xs hover:opacity-90"
                              >
                                <span>🛒 {primaryLink.shortLabel}</span>
                                <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                              {bridgeLinks
                                .filter((b) => b.provider !== primaryLink.provider)
                                .map((link) => (
                                  <a
                                    key={link.provider}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-100"
                                  >
                                    <span>{link.shortLabel}</span>
                                    <ExternalLink className="h-2.5 w-2.5 text-slate-400" />
                                  </a>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-2 lg:border-none lg:pt-0 lg:text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleOnHand(item.ingredientId)}
                          className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold transition no-print ${
                            item.isOnHand
                              ? 'border-sky-500 bg-sky-600 text-white'
                              : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {item.isOnHand ? '❄️ On-Hand ($0)' : 'Have at Home?'}
                        </button>

                        <div className="text-xs text-slate-500">
                          <div>{item.activeRawDealText}</div>
                        </div>
                        <div className="text-base font-extrabold text-emerald-700 min-w-[60px] text-right">
                          ${item.activeTotalCost.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Pantry &amp; Spice Cabinet Check (Est. $
                  {shoppingPlan.tripComparison.estimatedPantryTotal.toFixed(2)} total across 3 dishes)
                </h4>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {shoppingPlan.pantryChecklist.map((pantryItem) => {
                    const pKey = `pantry-${pantryItem}`;
                    const pChecked = Boolean(checkedItems[pKey]);
                    return (
                      <button
                        key={pKey}
                        type="button"
                        onClick={() => toggleCheckedItem(pKey)}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                          pChecked
                            ? 'border-emerald-300 bg-emerald-100/70 text-emerald-900 line-through'
                            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {pChecked ? (
                          <Check className="h-3 w-3 text-emerald-700" />
                        ) : null}
                        <span>{pantryItem}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* =========================================================
            TAB 4: USDA, 6-WEEK CYCLE SIGNALS & WHOLESALE CLUB RADAR
           ========================================================= */}
        {activeTab === 'RADAR' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-emerald-400">
                  <Radar className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Predictive 6-Week Cycle Signals, USDA Wholesale &amp; Club Bulk Radar
                  </h2>
                  <p className="mt-1 text-xs text-slate-600 sm:text-sm">
                    Combines 6-week SQLite longitudinal price history, USDA shipping-point momentum, and Costco / Sam&apos;s Club bulk benchmarks to show when to stock up and freeze vs. when to wait or substitute.
                  </p>
                </div>
              </div>

              {/* v1.2 Ticket #24: Stock Up Alert (6-Week Low) vs Cycle Peak Substitution Grid */}
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
                  <div className="flex items-center gap-2 text-emerald-950">
                    <Snowflake className="h-5 w-5 text-emerald-600" />
                    <h3 className="font-bold">
                      🟢 Stock Up Alert (Confirmed 6-Week Price Floors)
                    </h3>
                  </div>
                  <p className="mt-1 text-xs text-emerald-800">
                    These staples are at or within pennies of their 6-week SQLite price floor. Ideal candidates for &ldquo;Buy 2: Prep 1, Freeze 1&rdquo; multi-week arbitrage.
                  </p>

                  <div className="mt-3 space-y-2.5">
                    {(data.marketRadar.stockUpCycleLows || data.commodities.slice(0, 6))
                      .slice(0, 6)
                      .map((item) => (
                        <div
                          key={`floor-${item.ingredient.id}`}
                          className="flex items-center justify-between rounded-xl border border-emerald-200 bg-white p-3 shadow-2xs text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              {renderStoreBadge(item.bestOffer.store)}
                              <span className="font-bold text-slate-900">
                                {item.ingredient.name}
                              </span>
                            </div>
                            <div className="mt-1 text-slate-600">
                              Now{' '}
                              <strong className="text-emerald-700">
                                ${item.bestOffer.normalizedPricePerUnit.toFixed(2)}/
                                {item.ingredient.standardUnit}
                              </strong>{' '}
                              (6-Wk Range: ${item.sixWeekLow.toFixed(2)} – $
                              {(item.sixWeekHigh ?? item.bestOffer.regularPricePerUnit).toFixed(2)})
                            </div>
                          </div>

                          {item.arbitragePrompt?.eligible && (
                            <button
                              type="button"
                              onClick={() => handleBuyTwoPrepOneFreezeOne(item)}
                              className="shrink-0 rounded-lg bg-sky-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-sky-700"
                            >
                              ❄️ Buy 2 / Freeze 1
                            </button>
                          )}
                        </div>
                      ))}
                  </div>
                </div>

                <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-4">
                  <div className="flex items-center gap-2 text-rose-950">
                    <ArrowLeftRight className="h-5 w-5 text-rose-600" />
                    <h3 className="font-bold">
                      🔴 Cycle Peak / Wait &amp; Smart Substitution Advisor (Ticket #24)
                    </h3>
                  </div>
                  <p className="mt-1 text-xs text-rose-800">
                    Wholesale prices are dropping rapidly or current retail is near its 6-week peak. Swap in a 6-week floor alternative this week and wait for next Wednesday&apos;s ad drop.
                  </p>

                  <div className="mt-3 space-y-2.5">
                    {(data.marketRadar.cyclePeakWaitList || []).map((item) => (
                      <div
                        key={`peak-${item.ingredient.id}`}
                        className="rounded-xl border border-rose-200 bg-white p-3 shadow-2xs text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">
                            {item.ingredient.name}
                          </span>
                          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-900">
                            🔴 Wait / Swap (Wholesale {item.ingredient.usdaSignal.wholesaleChangePct}%)
                          </span>
                        </div>
                        <div className="mt-1 text-slate-600">
                          Current Retail:{' '}
                          <strong>
                            ${item.bestOffer.normalizedPricePerUnit.toFixed(2)}/
                            {item.ingredient.standardUnit}
                          </strong>{' '}
                          • 6-Wk Median: $
                          {(item.sixWeekMedian ?? item.sixWeekLocalAvg).toFixed(2)}
                        </div>
                        {item.cycleSignal?.substitutionSuggestion && (
                          <div className="mt-1.5 flex items-center justify-between gap-2 rounded-lg bg-rose-50 p-2 text-[11px] text-rose-950">
                            <span>{item.cycleSignal.substitutionSuggestion.reason}</span>
                            <button
                              type="button"
                              onClick={() =>
                                handleTogglePin(
                                  item.cycleSignal!.substitutionSuggestion!
                                    .substituteIngredientId
                                )
                              }
                              className="shrink-0 rounded bg-rose-700 px-2 py-1 text-[10px] font-bold text-white hover:bg-rose-800"
                            >
                              Pin Swap
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* v1.2 Ticket #25: Wholesale Club Price Normalizer Matrix (Costco & Sam's Club) */}
              <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50/30 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-blue-700" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Wholesale Club Price Normalizer: Supermarket Ads vs. Costco &amp; Sam&apos;s Club Bulk (Ticket #25)
                      </h3>
                      <p className="text-xs text-slate-600">
                        Side-by-side $/lb and $/doz benchmark confirming which weekly supermarket loss-leaders genuinely beat buying bulk packs at Costco or Sam&apos;s Club.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-blue-200 text-[11px] font-bold uppercase text-slate-600">
                        <th className="py-2 pr-3">Commodity</th>
                        <th className="py-2 px-2">Best Supermarket Deal</th>
                        <th className="py-2 px-2">Costco (Kirkland)</th>
                        <th className="py-2 px-2">Sam&apos;s Club</th>
                        <th className="py-2 pl-2 text-right">Club Normalizer Verdict</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-100">
                      {data.commodities.slice(0, 12).map((item) => {
                        const cb = item.clubBenchmark;
                        if (!cb) return null;
                        return (
                          <tr key={`club-${item.ingredient.id}`} className="bg-white/60">
                            <td className="py-2 pr-3 font-bold text-slate-900">
                              {item.ingredient.name}
                            </td>
                            <td className="py-2 px-2">
                              <div className="flex items-center gap-1.5">
                                {renderStoreBadge(item.bestOffer.store)}
                                <span className="font-extrabold text-slate-900">
                                  ${item.bestOffer.normalizedPricePerUnit.toFixed(2)}/
                                  {item.ingredient.standardUnit}
                                </span>
                              </div>
                            </td>
                            <td className="py-2 px-2 text-slate-700">
                              <strong>
                                ${cb.costcoPricePerUnit.toFixed(2)}/{item.ingredient.standardUnit}
                              </strong>
                              <div className="text-[10px] text-slate-500">
                                {cb.costcoPackDescription}
                              </div>
                            </td>
                            <td className="py-2 px-2 text-slate-700">
                              <strong>
                                ${cb.samsClubPricePerUnit.toFixed(2)}/
                                {item.ingredient.standardUnit}
                              </strong>
                              <div className="text-[10px] text-slate-500">
                                {cb.samsClubPackDescription}
                              </div>
                            </td>
                            <td className="py-2 pl-2 text-right">
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                                  cb.beatsClubBulk
                                    ? 'bg-emerald-100 text-emerald-900'
                                    : 'bg-amber-100 text-amber-900'
                                }`}
                              >
                                {cb.verdictLabel}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Original USDA Spiking vs Dropping Section */}
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
                  <div className="flex items-center gap-2 text-amber-900">
                    <TrendingUp className="h-5 w-5 text-amber-600" />
                    <h3 className="font-bold">
                      Buy Now &amp; Freeze (Wholesale Spiking, Local Retail Still Cheap)
                    </h3>
                  </div>
                  <p className="mt-1 text-xs text-amber-800">
                    USDA wholesale indexes rose this week on these items, but local stores still have an active loss-leader promo through Tuesday.
                  </p>

                  <div className="mt-3 space-y-3">
                    {data.marketRadar.buyBeforeSpike.map((item) => (
                      <div
                        key={item.ingredient.id}
                        className="rounded-xl border border-amber-200 bg-white p-3 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">
                            {item.ingredient.name}
                          </span>
                          {renderStoreBadge(item.bestOffer.store)}
                        </div>
                        <div className="mt-1 flex items-baseline gap-2">
                          <span className="text-base font-extrabold text-emerald-700">
                            ${item.bestOffer.normalizedPricePerUnit.toFixed(2)}/
                            {item.ingredient.standardUnit}
                          </span>
                          <span className="text-xs text-amber-700 font-semibold">
                            (USDA Wholesale +{item.ingredient.usdaSignal.wholesaleChangePct}%
                            this week)
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-600">
                          {item.ingredient.usdaSignal.note}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-sky-200 bg-sky-50/40 p-4">
                  <div className="flex items-center gap-2 text-sky-950">
                    <TrendingDown className="h-5 w-5 text-sky-600" />
                    <h3 className="font-bold">
                      Hold Off 7 Days (Wholesale Crashing, Local Retail Still High)
                    </h3>
                  </div>
                  <p className="mt-1 text-xs text-sky-800">
                    USDA shipping-point prices dropped sharply on these items, but local circulars haven&apos;t passed the savings along yet.
                  </p>

                  <div className="mt-3 space-y-3">
                    {data.marketRadar.holdOffDropping.map((item) => (
                      <div
                        key={item.ingredient.id}
                        className="rounded-xl border border-sky-200 bg-white p-3 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">
                            {item.ingredient.name}
                          </span>
                          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-900">
                            Wholesale {item.ingredient.usdaSignal.wholesaleChangePct}%
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs">
                          <span className="text-slate-600">
                            Current Local Shelf:{' '}
                            <strong className="text-slate-900">
                              ${item.currentLocalPrice.toFixed(2)}/
                              {item.ingredient.standardUnit}
                            </strong>
                          </span>
                          <span className="text-emerald-700 font-semibold">
                            Target Next Ad: ~${item.expectedSaleTarget.toFixed(2)}/
                            {item.ingredient.standardUnit}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-600">{item.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Data Pipeline Status Footer */}
              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Info className="h-4 w-4 text-emerald-600" />
                  <span>
                    v1.2 Active Data Pipeline, SQLite History, Virtual Freezer &amp; Store Locations
                  </span>
                </div>
                <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <strong>SQLite History DB:</strong>{' '}
                    <code>{data.sqliteStats.dbPath}</code> —{' '}
                    <span className="text-emerald-700 font-semibold">
                      {data.sqliteStats.totalHistoricalOfferRows} offer rows &amp;{' '}
                      {data.sqliteStats.totalUsdaSnapshotRows} USDA rows (
                      {data.sqliteStats.trackedWeeksCount} weeks)
                    </span>
                  </div>
                  <div>
                    <strong>Local Circulars ({data.zipCode}):</strong> Supermarket Weekly Flyers —{' '}
                    <span className="text-emerald-700 font-semibold">
                      {data.dataSourcesActive.flippLive
                        ? `Live Circular Feed Connected for ${data.cityLabel}`
                        : `Weekly Circular Dataset (${data.cityLabel})`}
                    </span>
                  </div>
                  <div>
                    <strong>Nearby Supermarkets ({data.zipCode}):</strong>{' '}
                    {data.nearbyKingSoopersLocations &&
                    data.nearbyKingSoopersLocations.length > 0
                      ? data.nearbyKingSoopersLocations
                          .map(
                            (loc) =>
                              `${loc.name} (#${loc.locationId}, ${loc.distanceMiles} mi)`
                          )
                          .join(' • ')
                      : `Kroger, Albertsons, ALDI, Walmart, Target & Sprouts`}
                  </div>
                  <div>
                    <strong>USDA MARS &amp; Club Normalizer:</strong> Specialty Crops (
                    <code>3324</code>), Beef (<code>3228</code>), Pork (<code>2868</code>),
                    Chicken (<code>2756</code>), Dairy (<code>2995</code>) + Costco / Sam&apos;s Bulk
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
