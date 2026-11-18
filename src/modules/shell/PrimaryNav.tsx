import { ArrowRight, Flame, ListChecks, Radar, ShoppingBag } from 'lucide-react';
import type { buildShoppingListAndStoreComparison } from '@/lib/shopping-list';
import type { DashboardPayload } from '@/types/domain';

// Moved verbatim from MealPrepDashboard (v2.0 M3 Phase A.4, header); state and handlers stay in the dashboard.

type ActiveTab = 'BOARD' | 'MEAL_PLAN' | 'SHOPPING_LIST' | 'RADAR';

interface PrimaryNavProps {
  data: Pick<DashboardPayload, 'commodities'>;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  pinnedIds: string[];
  effectiveOnHandIds: string[];
  shoppingPlan: Pick<ReturnType<typeof buildShoppingListAndStoreComparison>, 'items' | 'pantryNeeds'>;
  trioTotals: { avgPerServing: string };
}

export default function PrimaryNav({ data, activeTab, setActiveTab, pinnedIds, effectiveOnHandIds, shoppingPlan, trioTotals }: PrimaryNavProps) {
  return (
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
            {shoppingPlan.items.length + shoppingPlan.pantryNeeds.length} items
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
              (`${effectiveOnHandIds.length} marked available`)}
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
  );
}
