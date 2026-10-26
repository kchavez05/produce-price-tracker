import { loadInventoryState } from '@/lib/supabase/session';
import MealPrepDashboard from '@/components/MealPrepDashboard';
import { buildDashboardPayload } from '@/lib/scoring-and-matcher';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const inventory = await loadInventoryState();
  const initialData = await buildDashboardPayload({
    freezerInventory: inventory.freezerItems,
    savedRecipes: inventory.savedRecipes,
    zipCode: '80542',
    storeFilter: 'ALL',
    pinnedIngredientIds: [],
  });

  return <MealPrepDashboard initialData={initialData} />;
}
