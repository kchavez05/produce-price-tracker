import type { Metadata } from 'next';
import PlanPage from '@/modules/plan/PlanPage';

export const metadata: Metadata = { title: 'Dish Detail — PantryBot' };

// Dish Detail (v2.0 M4-5b) is the Plan at a path that names a dish; PlanPage reads the dish id from the path.
export default function Page() {
  return <PlanPage />;
}
