'use client';

import VirtualPantry from '@/modules/pantry/VirtualPantry';
import { useAccountContext, useShellContext } from '@/modules/shell/app-context';

// v2.0 M3 Phase B.2d: the Pantry module's entry point, moved verbatim from MealPrepDashboard's header drawer. Since B.3b
// the Pantry is a module of its own: this is its page, shown while the module is current (the shell decides), and
// closing it returns to the module it was opened from. It reads the
// private pantry (owner, entries and the save, delete, retry, resolve and import actions) from the Account context and
// the drawer state from the Shell context, and hands them to VirtualPantry, which stays a presentational component with
// its own tests. The drawer is remounted when the pantry owner changes (the key below), so a half-typed entry never
// carries over to another account. The three flags are page-level configuration, not state, so they stay props.
interface PantryDrawerProps {
  speechConfigured?: boolean;
  barcodeEnabled?: boolean;
  cameraEnabled?: boolean;
}

export default function PantryDrawer({ speechConfigured = false, barcodeEnabled = false, cameraEnabled = false }: PantryDrawerProps) {
  const { pantry, pantryAccountId } = useAccountContext();
  const { closePantry, pantryTrigger, showAiSignIn } = useShellContext();
  return (
    <>
      <VirtualPantry speechConfigured={speechConfigured} onAiSignIn={showAiSignIn} owner={pantry.owner} barcodeEnabled={barcodeEnabled} cameraEnabled={cameraEnabled}
        key={pantry.owner ?? `loading:${pantryAccountId ?? 'guest'}`}
        entries={pantry.entries} acceptedCatalogIds={pantry.acceptedCatalogIds} status={pantry.status} error={pantry.error} guest={pantry.guest} hasLegacyEdits={pantry.hasLegacyEdits}
        importDuplicates={pantry.importDuplicates}
        guestEntries={pantry.guestEntries} conflicts={pantry.conflicts}
        onSave={pantry.save} onDelete={pantry.remove} onRetry={pantry.retry} onResolve={pantry.resolve}
        onImportGuest={pantry.importGuest} onReviewLegacy={pantry.reviewLegacy} onImportLegacy={pantry.importLegacy}
        onClose={() => { closePantry(); pantryTrigger.current?.focus(); }}
      />
    </>
  );
}
