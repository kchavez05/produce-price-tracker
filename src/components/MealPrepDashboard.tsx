'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  CommodityCategory,
  DashboardPayload,
  DealType,
  RecommendedDish,
  ScoredCommodity,
  StoreChain,
} from '@/types/domain';
import { buildShoppingListAndStoreComparison } from '@/lib/shopping-list';
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
  const [expandedDishIds, setExpandedDishIds] = useState<Record<string, boolean>>({
    [initialData.recommendedTrio[0]?.id || '']: true,
  });
  const [showAllBlueprints, setShowAllBlueprints] = useState(false);

  // Shopping list & coupon checklist interactive state (v0.3)
  const [tripMode, setTripMode] = useState<'SPLIT' | 'KING_SOOPERS' | 'SAFEWAY'>('SPLIT');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [clippedCoupons, setClippedCoupons] = useState<Record<string, boolean>>({});

  // AI Custom Chef state
  const [customPrompt, setCustomPrompt] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiBannerMessage, setAiBannerMessage] = useState<string | null>(null);
  const [customAiDishes, setCustomAiDishes] = useState<RecommendedDish[] | null>(null);

  // Load persisted shopping list & coupon state from localStorage
  useEffect(() => {
    try {
      const savedChecked = localStorage.getItem('mead_checked_items_v03');
      if (savedChecked) setCheckedItems(JSON.parse(savedChecked));
      const savedClipped = localStorage.getItem('mead_clipped_coupons_v03');
      if (savedClipped) setClippedCoupons(JSON.parse(savedClipped));
    } catch {
      // Ignore storage errors
    }
  }, []);

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
    nextStore: 'ALL' | StoreChain,
    nextPinned: string[]
  ) {
    try {
      const params = new URLSearchParams({
        zip: '80542',
        store: nextStore,
        pinned: nextPinned.join(','),
      });
      const res = await fetch(`/api/dashboard?${params.toString()}`);
      if (res.ok) {
        const updated: DashboardPayload = await res.json();
        setData(updated);
      }
    } catch {
      // Ignore network hiccup
    }
  }

  function handleTogglePin(ingredientId: string) {
    const exists = pinnedIds.includes(ingredientId);
    const nextPinned = exists
      ? pinnedIds.filter((id) => id !== ingredientId)
      : [...pinnedIds, ingredientId];
    setPinnedIds(nextPinned);
    setCustomAiDishes(null);
    syncDashboard(storeFilter, nextPinned);
  }

  function handleStoreChange(nextStore: 'ALL' | StoreChain) {
    setStoreFilter(nextStore);
    if (nextStore === 'KING_SOOPERS') setTripMode('KING_SOOPERS');
    else if (nextStore === 'SAFEWAY') setTripMode('SAFEWAY');
    else setTripMode('SPLIT');
    setCustomAiDishes(null);
    syncDashboard(nextStore, pinnedIds);
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
          customPreference: customPrompt,
          storeFilter,
          geminiApiKey,
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
    const totalServings = activeTrio.reduce((acc, d) => acc + d.servings, 0) || 18;
    const avgPerServing = totalBatchCost / totalServings;

    return {
      totalBatchCost: totalBatchCost.toFixed(2),
      totalRegularCost: totalRegularCost.toFixed(2),
      totalSavings: totalSavings.toFixed(2),
      totalServings,
      avgPerServing: avgPerServing.toFixed(2),
    };
  }, [activeTrio]);

  // v0.3 Aggregated Shopping List, Coupon Pre-Flight, and Store Trip Optimizer
  const shoppingPlan = useMemo(
    () => buildShoppingListAndStoreComparison(activeTrio, data.commodities),
    [activeTrio, data.commodities]
  );

  // Resolve each shopping item's active store/cost based on user's selected tripMode
  const resolvedShoppingItems = useMemo(() => {
    return shoppingPlan.items.map((item) => {
      const store: StoreChain =
        tripMode === 'KING_SOOPERS'
          ? 'KING_SOOPERS'
          : tripMode === 'SAFEWAY'
            ? 'SAFEWAY'
            : item.optimalStore;

      const unitCost =
        store === 'KING_SOOPERS'
          ? item.kingSoopersUnitCost
          : item.safewayUnitCost;
      const totalCost =
        store === 'KING_SOOPERS'
          ? item.kingSoopersTotalCost
          : item.safewayTotalCost;
      const rawDealText =
        store === 'KING_SOOPERS'
          ? item.kingSoopersRawDealText
          : item.safewayRawDealText;
      const dealType =
        store === 'KING_SOOPERS'
          ? item.kingSoopersDealType
          : item.safewayDealType;
      const dealConditions =
        store === 'KING_SOOPERS'
          ? item.kingSoopersDealConditions
          : item.safewayDealConditions;

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
        (i) => i.activeDealType === 'DIGITAL_COUPON' || i.activeDealType === 'MULTI_BUY'
      ),
    [resolvedShoppingItems]
  );

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
    if (store === 'KING_SOOPERS') {
      return (
        <span className="inline-flex items-center rounded-md bg-blue-700 px-2 py-0.5 text-xs font-bold text-white shadow-xs">
          King Soopers
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-md bg-red-600 px-2 py-0.5 text-xs font-bold text-white shadow-xs">
        Safeway
      </span>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
                  <ChefHat className="h-5 w-5" />
                </span>
                <div>
                  <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                    Mead Meal-Prep Value Tracker
                  </h1>
                  <p className="flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                    <span>{data.cityLabel} (80542)</span>
                    <span>•</span>
                    <span>{data.adCycleLabel}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Store Filter & API Settings */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs font-medium">
                <button
                  onClick={() => handleStoreChange('ALL')}
                  className={`rounded-md px-2.5 py-1.5 transition ${
                    storeFilter === 'ALL'
                      ? 'bg-white font-semibold text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Best Overall (KS + Safeway)
                </button>
                <button
                  onClick={() => handleStoreChange('KING_SOOPERS')}
                  className={`rounded-md px-2.5 py-1.5 transition ${
                    storeFilter === 'KING_SOOPERS'
                      ? 'bg-blue-700 font-semibold text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  King Soopers
                </button>
                <button
                  onClick={() => handleStoreChange('SAFEWAY')}
                  className={`rounded-md px-2.5 py-1.5 transition ${
                    storeFilter === 'SAFEWAY'
                      ? 'bg-red-600 font-semibold text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Safeway
                </button>
              </div>

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

          {/* Optional API Key Drawer */}
          {showKeyModal && (
            <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-slate-700">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-slate-900">
                    Optional Free-Tier Gemini 2.5 Flash Key (Zero Cost via Google AI Studio)
                  </p>
                  <p className="text-slate-600">
                    The app runs 100% free out-of-the-box using the built-in Stew/Casserole Algorithmic Matcher. Paste a free Gemini key here (or in <code className="rounded bg-white px-1 py-0.5">.env.local</code>) to enable custom AI recipe remixing.
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

          {/* Primary Navigation Tabs (v0.3 includes Shopping List & Coupon Optimizer) */}
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
                <span>3. Shopping List &amp; Coupons</span>
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
                <span>4. USDA Radar</span>
              </button>
            </div>

            {pinnedIds.length > 0 && (
              <div className="hidden items-center gap-2 md:flex">
                <span className="text-xs font-medium text-slate-600">
                  Pinned ({pinnedIds.length}):
                </span>
                <button
                  onClick={() => setActiveTab('MEAL_PLAN')}
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  <span>View 3 Dishes</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => {
                    setPinnedIds([]);
                    syncDashboard(storeFilter, []);
                  }}
                  className="text-xs text-slate-500 underline hover:text-slate-800"
                >
                  Clear
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
                        Splurge Value Alerts (Normally Expensive Cuts at Deep Discount)
                      </h2>
                      <p className="text-xs text-slate-300">
                        Ranked separately from everyday cheap staples—ideal when you want a premium roast, steak, or seafood at 40–54% off.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {data.splurgeAlerts.slice(0, 4).map((item) => {
                    const isPinned = pinnedIds.includes(item.ingredient.id);
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
                        </div>

                        <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2">
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
                      e.target.value as 'VALUE_SCORE' | 'LOWEST_PRICE' | 'BIGGEST_DISCOUNT'
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
                const { ingredient, bestOffer, kingSoopersOffer, safewayOffer } = item;

                return (
                  <div
                    key={ingredient.id}
                    className={`flex flex-col justify-between rounded-2xl border bg-white p-4 transition shadow-2xs hover:shadow-md ${
                      isPinned
                        ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                        : item.actionTag === 'WAIT_NEXT_WEEK'
                          ? 'border-amber-200 bg-amber-50/20'
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
                            Reg: ${bestOffer.regularPricePerUnit.toFixed(2)}/{ingredient.standardUnit}
                          </div>
                          <div>
                            USDA Avg: ${ingredient.mountainBaselinePerUnit.toFixed(2)}/{ingredient.standardUnit}
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

                      <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg border border-slate-100 bg-slate-50/70 p-2 text-xs">
                        <div
                          className={`rounded p-1.5 ${
                            bestOffer.store === 'KING_SOOPERS'
                              ? 'bg-blue-50/90 font-semibold text-blue-950 border border-blue-200'
                              : 'text-slate-600'
                          }`}
                        >
                          <div className="text-[10px] uppercase tracking-wider text-slate-500">
                            King Soopers
                          </div>
                          {kingSoopersOffer ? (
                            <div>
                              ${kingSoopersOffer.normalizedPricePerUnit.toFixed(2)}/
                              {ingredient.standardUnit}{' '}
                              <span className="text-[10px] font-normal">
                                ({kingSoopersOffer.dealType === 'DIGITAL_COUPON' ? 'App Cpn' : 'Card'})
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
                            Safeway
                          </div>
                          {safewayOffer ? (
                            <div>
                              ${safewayOffer.normalizedPricePerUnit.toFixed(2)}/
                              {ingredient.standardUnit}{' '}
                              <span className="text-[10px] font-normal">
                                ({safewayOffer.dealType === 'DIGITAL_COUPON' ? 'for U Cpn' : 'Member'})
                              </span>
                            </div>
                          ) : (
                            <div>N/A</div>
                          )}
                        </div>
                      </div>

                      <div className="mt-2.5 flex items-start gap-1.5 text-[11px] text-slate-600">
                        {ingredient.usdaSignal.wholesaleChangePct <= 0 ? (
                          <TrendingDown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                        ) : (
                          <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                        )}
                        <span>
                          <strong className="text-slate-800">
                            USDA Wholesale ({ingredient.usdaSignal.wholesaleChangePct > 0 ? '+' : ''}
                            {ingredient.usdaSignal.wholesaleChangePct}%):
                          </strong>{' '}
                          {ingredient.usdaSignal.note}
                        </span>
                      </div>

                      {/* v0.2 SQLite 6-Week Price History Mini-Chart */}
                      {item.priceHistory && item.priceHistory.length > 0 && (
                        <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50/80 p-2">
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span className="font-semibold text-slate-700">
                              6-Wk SQLite History (Avg ${item.sixWeekLocalAvg.toFixed(2)}/{ingredient.standardUnit})
                            </span>
                            {bestOffer.normalizedPricePerUnit <= item.sixWeekLow + 0.02 && (
                              <span className="rounded bg-emerald-100 px-1.5 py-0.2 font-bold text-emerald-800">
                                ★ 6-Week Cycle Low
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

                    <div className="mt-4 border-t border-slate-100 pt-3">
                      <button
                        onClick={() => handleTogglePin(ingredient.id)}
                        className={`flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                          isPinned
                            ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
                            : 'bg-slate-900 text-white hover:bg-slate-800'
                        }`}
                      >
                        {isPinned ? (
                          <>
                            <Check className="h-4 w-4" />
                            <span>Pinned to 3-Dish Meal Plan</span>
                          </>
                        ) : (
                          <>
                            <Pin className="h-4 w-4" />
                            <span>Pin Anchor to Meal Prep</span>
                          </>
                        )}
                      </button>
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
                    <span>Low-Effort Reheatable Batch Trio (Stews, Braises &amp; Casseroles)</span>
                  </div>
                  <h2 className="mt-2 text-xl font-extrabold sm:text-2xl">
                    Your 3-Dish Weekend Meal Prep Plan ({trioTotals.totalServings} Total Meals)
                  </h2>
                  <p className="mt-1 text-xs text-slate-300 sm:text-sm">
                    Optimized around this week&apos;s lowest $/lb anchors across King Soopers &amp; Safeway in Mead/Longmont.
                  </p>
                  <div className="mt-3">
                    <button
                      onClick={() => setActiveTab('SHOPPING_LIST')}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-500 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-400"
                    >
                      <ListChecks className="h-4 w-4" />
                      <span>Open Deduplicated Shopping List &amp; Coupon Checklist</span>
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
                    <div className="text-[10px] text-slate-400">across 18 portions</div>
                  </div>
                  <div className="border-x border-white/15 px-2">
                    <div className="text-[11px] text-slate-300 uppercase">3-Dish Total</div>
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
                    <div className="text-[10px] text-emerald-200">with coupons/cards</div>
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
                    placeholder="Optional AI Twist: e.g., 'Make 2 slow cooker stews and 1 high-protein breakfast casserole, extra spicy'..."
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
                        </div>

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

                    <div className="p-4 sm:p-5">
                      <h4 className="mb-2.5 text-xs font-bold tracking-wider text-slate-500 uppercase">
                        On-Sale Store Ingredients Used in This Batch
                      </h4>
                      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                        {dish.matchedIngredients.map((ing, i) => (
                          <div
                            key={`${dish.id}-ing-${i}`}
                            className={`rounded-xl border p-3 text-xs ${
                              ing.isUserPinned
                                ? 'border-emerald-400 bg-emerald-50/40'
                                : 'border-slate-200 bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-semibold text-slate-500">
                                {ing.slotLabel}
                              </span>
                              {renderStoreBadge(ing.store)}
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
                              {ing.dealType === 'DIGITAL_COUPON' && (
                                <span className="font-semibold text-amber-700">
                                  📱 App Coupon
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
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

            {/* Option to Browse All 8 Evaluated Stew/Casserole Blueprints */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Want to Swap a Dish? Browse All {data.allRankedDishes.length} Cost-Ranked Stews &amp; Casseroles
                  </h3>
                  <p className="text-xs text-slate-500">
                    Every blueprint is dynamically priced using this week&apos;s Mead, CO King Soopers and Safeway circulars.
                  </p>
                </div>
                <button
                  onClick={() => setShowAllBlueprints(!showAllBlueprints)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {showAllBlueprints ? 'Hide Full Matrix' : 'Show All 8 Dishes'}
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
                          {dish.appliance}
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
            TAB 3: SHOPPING LIST, COUPON PRE-FLIGHT & STORE OPTIMIZER (v0.3)
           ========================================================= */}
        {activeTab === 'SHOPPING_LIST' && (
          <div className="space-y-6">
            {/* Ticket #7: 1-Store vs 2-Store Trip Cost Optimizer */}
            <section className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-5 text-white shadow-md">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-300">
                    <Store className="h-3.5 w-3.5" />
                    <span>Store Split vs. 1-Stop Trip Optimizer (Ticket #7)</span>
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

              {/* 3 Interactive Trip Mode Cards */}
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <button
                  onClick={() => setTripMode('SPLIT')}
                  className={`flex flex-col justify-between rounded-xl border p-3.5 text-left transition ${
                    tripMode === 'SPLIT'
                      ? 'border-emerald-400 bg-emerald-500/20 ring-2 ring-emerald-400/40'
                      : 'border-white/15 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                      Optimal 2-Store Split
                    </span>
                    {tripMode === 'SPLIT' && (
                      <span className="rounded-full bg-emerald-400 px-2 py-0.5 text-[10px] font-bold text-slate-950">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-2xl font-black text-white">
                    ${shoppingPlan.tripComparison.optimalSplitTotal.toFixed(2)}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-300">
                    Cherry-pick lowest price per item across King Soopers &amp; Safeway (Save $
                    {(
                      shoppingPlan.tripComparison.regularShelfTotal -
                      shoppingPlan.tripComparison.optimalSplitTotal
                    ).toFixed(2)}
                    )
                  </div>
                </button>

                <button
                  onClick={() => setTripMode('KING_SOOPERS')}
                  className={`flex flex-col justify-between rounded-xl border p-3.5 text-left transition ${
                    tripMode === 'KING_SOOPERS'
                      ? 'border-blue-400 bg-blue-500/25 ring-2 ring-blue-400/40'
                      : 'border-white/15 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                      1-Stop: King Soopers Only
                    </span>
                    {tripMode === 'KING_SOOPERS' && (
                      <span className="rounded-full bg-blue-400 px-2 py-0.5 text-[10px] font-bold text-slate-950">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-2xl font-black text-white">
                    ${shoppingPlan.tripComparison.kingSoopersOnlyTotal.toFixed(2)}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-300">
                    Buy all {shoppingPlan.items.length} ingredients at Firestone / Longmont King Soopers (+$
                    {(
                      shoppingPlan.tripComparison.kingSoopersOnlyTotal -
                      shoppingPlan.tripComparison.optimalSplitTotal
                    ).toFixed(2)}{' '}
                    vs split)
                  </div>
                </button>

                <button
                  onClick={() => setTripMode('SAFEWAY')}
                  className={`flex flex-col justify-between rounded-xl border p-3.5 text-left transition ${
                    tripMode === 'SAFEWAY'
                      ? 'border-red-400 bg-red-500/25 ring-2 ring-red-400/40'
                      : 'border-white/15 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-red-300">
                      1-Stop: Safeway Only
                    </span>
                    {tripMode === 'SAFEWAY' && (
                      <span className="rounded-full bg-red-400 px-2 py-0.5 text-[10px] font-bold text-slate-950">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-2xl font-black text-white">
                    ${shoppingPlan.tripComparison.safewayOnlyTotal.toFixed(2)}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-300">
                    Buy all {shoppingPlan.items.length} ingredients at Longmont Safeway (+$
                    {(
                      shoppingPlan.tripComparison.safewayOnlyTotal -
                      shoppingPlan.tripComparison.optimalSplitTotal
                    ).toFixed(2)}{' '}
                    vs split)
                  </div>
                </button>
              </div>
            </section>

            {/* Ticket #6: Digital Coupon Pre-Flight Checklist */}
            {digitalCouponItems.length > 0 && (
              <section className="rounded-2xl border border-amber-300 bg-amber-50/70 p-4 sm:p-5 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-white">
                      <Smartphone className="h-4 w-4" />
                    </span>
                    <div>
                      <h3 className="text-sm font-extrabold text-amber-950 sm:text-base">
                        Digital Coupon Pre-Flight Checklist ({digitalCouponItems.length} Coupons to Clip)
                      </h3>
                      <p className="text-xs text-amber-800">
                        Clip these in the King Soopers or Safeway for U app before heading to checkout so you get the advertised promo price.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                  {digitalCouponItems.map((cItem) => {
                    const couponKey = `${cItem.activeStore}-${cItem.ingredientId}`;
                    const isClipped = Boolean(clippedCoupons[couponKey]);
                    return (
                      <div
                        key={couponKey}
                        onClick={() => toggleClippedCoupon(couponKey)}
                        className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition ${
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
                              <Smartphone className="h-3.5 w-3.5" /> Clip in App
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Ticket #5: Aggregated & Deduplicated Shopping List */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 sm:text-lg">
                    Deduplicated 3-Dish Shopping List ({resolvedShoppingItems.length} Unique Store Staples)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Overlapping ingredients across your 3 batch dishes are automatically combined into single store quantities. Tap any row as you shop.
                  </p>
                </div>
                {Object.values(checkedItems).some(Boolean) && (
                  <button
                    onClick={() => {
                      setCheckedItems({});
                      try {
                        localStorage.removeItem('mead_checked_items_v03');
                      } catch {
                        // Ignore
                      }
                    }}
                    className="text-xs font-semibold text-slate-500 underline hover:text-slate-800"
                  >
                    Uncheck All
                  </button>
                )}
              </div>

              <div className="mt-4 space-y-2.5">
                {resolvedShoppingItems.map((item) => {
                  const isChecked = Boolean(checkedItems[item.ingredientId]);
                  return (
                    <div
                      key={item.ingredientId}
                      onClick={() => toggleCheckedItem(item.ingredientId)}
                      className={`flex cursor-pointer flex-col justify-between gap-2 rounded-xl border p-3.5 transition sm:flex-row sm:items-center ${
                        isChecked
                          ? 'border-slate-200 bg-slate-50 opacity-60'
                          : 'border-slate-200 bg-white hover:border-emerald-400'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 text-emerald-600">
                          {isChecked ? (
                            <CheckSquare className="h-5 w-5" />
                          ) : (
                            <Square className="h-5 w-5 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            {renderStoreBadge(item.activeStore)}
                            <span
                              className={`text-sm font-bold ${
                                isChecked
                                  ? 'line-through text-slate-500'
                                  : 'text-slate-900'
                              }`}
                            >
                              {item.ingredientName}
                            </span>
                            {renderDealBadge(item.activeDealType)}
                          </div>
                          <p className="mt-1 text-xs text-slate-600">
                            <strong>
                              Total Needed: {item.totalQuantityNeeded} {item.unit}
                            </strong>{' '}
                            • Used in:{' '}
                            {item.usedInDishes
                              .map((u) => `${u.dishTitle} (${u.quantity} ${item.unit})`)
                              .join(' + ')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-2 sm:border-none sm:pt-0 sm:text-right">
                        <div className="text-xs text-slate-500">
                          <div>{item.activeRawDealText}</div>
                          <div>
                            (${item.activeUnitCost.toFixed(2)}/{item.unit})
                          </div>
                        </div>
                        <div className="text-base font-extrabold text-emerald-700">
                          ${item.activeTotalCost.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pantry Staples Verification Checklist */}
              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Pantry &amp; Spice Cabinet Check (Est. ${shoppingPlan.tripComparison.estimatedPantryTotal.toFixed(2)} total across 3 dishes)
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
            TAB 4: USDA COMMODITY & WHOLESALE RADAR
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
                    USDA Wholesale vs. Local Retail Arbitrage Radar
                  </h2>
                  <p className="mt-1 text-xs text-slate-600 sm:text-sm">
                    Wholesale terminal and shipping-point price movements typically lead retail supermarket circulars by <strong>7 to 14 days</strong>. Use this view to know what to stock up on before retail prices jump, and what to skip until next Wednesday&apos;s ad.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
                  <div className="flex items-center gap-2 text-amber-900">
                    <TrendingUp className="h-5 w-5 text-amber-600" />
                    <h3 className="font-bold">
                      Buy Now &amp; Freeze (Wholesale Spiking, Local Retail Still Cheap)
                    </h3>
                  </div>
                  <p className="mt-1 text-xs text-amber-800">
                    USDA wholesale indexes rose this week on these items, but King Soopers or Safeway still have an active loss-leader promo through Tuesday.
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
                            (USDA Wholesale +{item.ingredient.usdaSignal.wholesaleChangePct}% this week)
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
                    USDA shipping-point prices dropped sharply on these items, but neither King Soopers nor Safeway has passed the savings into the weekly circular yet.
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
                              ${item.currentLocalPrice.toFixed(2)}/{item.ingredient.standardUnit}
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
                  <span>v0.2 Active Data Pipeline, SQLite History &amp; Store Locations</span>
                </div>
                <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <strong>SQLite History DB:</strong>{' '}
                    <code>{data.sqliteStats.dbPath}</code> —{' '}
                    <span className="text-emerald-700 font-semibold">
                      {data.sqliteStats.totalHistoricalOfferRows} offer rows &amp;{' '}
                      {data.sqliteStats.totalUsdaSnapshotRows} USDA rows ({data.sqliteStats.trackedWeeksCount} weeks)
                    </span>
                  </div>
                  <div>
                    <strong>Local Circulars (80542):</strong> King Soopers &amp; Safeway —{' '}
                    <span className="text-emerald-700 font-semibold">
                      {data.dataSourcesActive.flippLive
                        ? 'Live Flipp Circular Feed Connected'
                        : 'Mead 80542 Weekly Circular Dataset'}
                    </span>
                  </div>
                  <div>
                    <strong>King Soopers Stores Near 80542:</strong>{' '}
                    {data.nearbyKingSoopersLocations
                      .map((loc) => `${loc.name} (#${loc.locationId}, ${loc.distanceMiles} mi)`)
                      .join(' • ')}
                  </div>
                  <div>
                    <strong>USDA MARS Reports:</strong> Specialty Crops (<code>3324</code>), Beef (<code>3228</code>), Pork (<code>2868</code>), Chicken (<code>2756</code>), Dairy (<code>2995</code>)
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
