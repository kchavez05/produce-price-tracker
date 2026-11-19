'use client';

import PlanBlueprints from '@/modules/plan/PlanBlueprints';
import PlanDishes from '@/modules/plan/PlanDishes';
import PlanHeader from '@/modules/plan/PlanHeader';

// v2.0 M3 Phase B.3c: the /plan page (the 3-dish meal prep plan).
export default function PlanPage() {
  return (
    <div className="space-y-6">
      <PlanHeader />

      {/* The 3 Recommended Batch Dishes */}
      <PlanDishes />

      {/* Option to Browse All Evaluated Stew/Casserole Blueprints */}
      <PlanBlueprints />
    </div>
  );
}
