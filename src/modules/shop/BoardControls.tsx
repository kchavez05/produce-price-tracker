'use client';

import { useShopContext } from '@/modules/shell/app-context';

// Moved verbatim from MealPrepDashboard (v2.0 M3 Phase A.3, Board tab). Since Phase B.2a it reads the app's state from the
// context hooks instead of props; the markup is unchanged.

export default function BoardControls() {
  const { categoryFilter, setCategoryFilter, sortMode, setSortMode } = useShopContext();
  return (
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
  );
}
