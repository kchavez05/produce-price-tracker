import type { Metadata } from 'next';
import PantryDrawer from '@/modules/pantry/PantryDrawer';
import { isSpeechPipelineConfigured } from '@/lib/ai/speech/providers';

export const metadata: Metadata = { title: 'Ingredient Detail — PantryBot' };

// Ingredient Detail (v2.0 M4-4b) is the Pantry at a path that names an entry; PantryDrawer reads the entry id from the path.
// The page-level flags are the same as the Pantry's own page.
export default function Page() {
  return (
    <PantryDrawer
      speechConfigured={isSpeechPipelineConfigured()}
      barcodeEnabled={process.env.PANTRYBOT_BARCODE_LOOKUP_ENABLED === 'true'}
      cameraEnabled={process.env.PANTRYBOT_BARCODE_CAMERA_ENABLED === 'true'}
    />
  );
}
