import { readProfilePantryAvailability } from '@/lib/pantry/server';
import { loadInventoryState } from '@/lib/supabase/session';
import { isSpeechPipelineConfigured } from '@/lib/ai/speech/providers';
import MealPrepDashboard from '@/components/MealPrepDashboard';
import { buildDashboardPayload } from '@/lib/scoring-and-matcher';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const inventory = await loadInventoryState();
  const onHandIngredientIds = await readProfilePantryAvailability(inventory.profile).catch(() => []);
  const initialData = await buildDashboardPayload({
    savedRecipes: inventory.savedRecipes,
    zipCode: '80542',
    storeFilter: 'ALL',
    pinnedIngredientIds: [],
    onHandIngredientIds,
  });

  return <MealPrepDashboard speechConfigured={isSpeechPipelineConfigured()} initialData={initialData} barcodeEnabled={process.env.PANTRYBOT_BARCODE_LOOKUP_ENABLED === 'true'}
    cameraEnabled={process.env.PANTRYBOT_BARCODE_CAMERA_ENABLED === 'true'}
    initialPrivateRecipes={inventory.savedRecipes}
    initialAccountId={inventory.profile && !inventory.profile.id.startsWith('guest-') ? inventory.profile.id : null} />;
}
