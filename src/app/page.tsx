import { readProfilePantryAvailability } from '@/lib/pantry/server';
import { loadInventoryState } from '@/lib/supabase/session';
import MealPrepDashboard from '@/components/MealPrepDashboard';
import { buildDashboardPayload } from '@/lib/scoring-and-matcher';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const inventory = await loadInventoryState();
  const pantryEnabled = process.env.PANTRYBOT_PANTRY_ENABLED === 'true';
  const onHandIngredientIds = pantryEnabled ? await readProfilePantryAvailability(inventory.profile).catch(() => []) : [];
  const initialData = await buildDashboardPayload({
    freezerInventory: pantryEnabled ? [] : inventory.freezerItems,
    savedRecipes: inventory.savedRecipes,
    zipCode: '80542',
    storeFilter: 'ALL',
    pinnedIngredientIds: [],
    onHandIngredientIds,
  });

  return <MealPrepDashboard initialData={initialData} pantryEnabled={pantryEnabled}
    initialPrivateRecipes={inventory.savedRecipes}
    initialAccountId={inventory.profile && !inventory.profile.id.startsWith('guest-') ? inventory.profile.id : null} />;
}
