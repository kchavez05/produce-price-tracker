'use client';

import DishDetailView from '@/modules/plan/DishDetailView';
import PlanBlueprints from '@/modules/plan/PlanBlueprints';
import PlanDishes from '@/modules/plan/PlanDishes';
import PlanHeader from '@/modules/plan/PlanHeader';
import { useAppRouter } from '@/modules/shell/app-router';
import { dishIdOfPath } from '@/modules/shell/navigation';

// v2.0 M3 Phase B.3c: the /plan page (the 3-dish meal prep plan).
//
// v2.0 M4-5b: Dish Detail is this page at /plan/dish/<dish id>. Below 1024 px it replaces the page (the list column is hidden and the
// detail is the screen, with a Back link). From 1024 px the Plan is two columns, the list (380 px) and the open dish as a pane (the
// wireframe iPad Plan), with a short prompt in the pane until a dish is chosen.
export default function PlanPage() {
  const { pathname } = useAppRouter();
  const dishId = dishIdOfPath(pathname);
  return (
    <div className="wide:grid wide:grid-cols-[380px_minmax(0,1fr)] wide:items-start wide:gap-6">
      <div className={`min-w-0 space-y-4 ${dishId !== null ? 'hidden wide:block' : ''}`}>
        <PlanHeader />

        {/* The 3 Recommended Batch Dishes */}
        <PlanDishes selectedId={dishId} />

        {/* Option to Browse All Evaluated Stew/Casserole Blueprints */}
        <PlanBlueprints />
      </div>
      <section aria-label="Dish detail" className={`min-w-0 wide:sticky wide:top-4 ${dishId !== null ? '' : 'hidden wide:block'}`}>
        {dishId !== null
          ? <DishDetailView dishId={dishId} />
          : <p className="rounded-card bg-chip p-6 text-center text-sm text-muted">Choose a dish to see its ingredients and method.</p>}
      </section>
    </div>
  );
}
