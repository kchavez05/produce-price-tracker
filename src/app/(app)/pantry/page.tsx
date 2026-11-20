import type { Metadata } from 'next';
import PantryDrawer from '@/modules/pantry/PantryDrawer';
import { isSpeechPipelineConfigured } from '@/lib/ai/speech/providers';

export const metadata: Metadata = { title: 'Pantry — PantryBot' };

// The three flags are page-level configuration read on the server, as the old home page did.
export default function Page() {
  return (
    <PantryDrawer
      speechConfigured={isSpeechPipelineConfigured()}
      barcodeEnabled={process.env.PANTRYBOT_BARCODE_LOOKUP_ENABLED === 'true'}
      cameraEnabled={process.env.PANTRYBOT_BARCODE_CAMERA_ENABLED === 'true'}
    />
  );
}
