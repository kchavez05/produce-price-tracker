import type { Metadata } from 'next';
import PlanPage from '@/modules/plan/PlanPage';

export const metadata: Metadata = { title: 'Plan — PantryBot' };

export default function Page() {
  return <PlanPage />;
}
