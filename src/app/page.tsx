import MealPrepDashboard from '@/components/MealPrepDashboard';
import { buildDashboardPayload } from '@/lib/scoring-and-matcher';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const initialData = await buildDashboardPayload({
    zipCode: '80542',
    storeFilter: 'ALL',
    pinnedIngredientIds: [],
  });

  return <MealPrepDashboard initialData={initialData} />;
}
