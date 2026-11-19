'use client';

import AccountModal from '@/modules/shell/AccountModal';
import {
  useAccountContext, useLocationContext, usePreferencesContext, useShellContext,
} from '@/modules/shell/app-context';

// v2.0 M3 Phase B.2d: the account dialog, moved verbatim from MealPrepDashboard's header. It reads the account, location
// and preferences from the contexts and hands them to AccountModal, which stays a presentational component with its own
// tests. The dialog's open state and intent live in the Shell context, so the AI sign-in prompt can open it from anywhere.
export default function AccountDialog() {
  const { userSync, pantry } = useAccountContext();
  const { currentZip } = useLocationContext();
  const { macroGoal, dietaryConstraints, applianceFilter, activeStores } = usePreferencesContext();
  const { showAccountModal, setShowAccountModal, accountIntent, handleForceCloudSync } = useShellContext();
  return (
    <AccountModal
      isOpen={showAccountModal}
      intent={accountIntent}
      onClose={() => setShowAccountModal(false)}
      authenticated={userSync.authenticated}
      profile={userSync.profile}
      storageMode={userSync.storageMode}
      supabaseConfigured={userSync.supabaseConfigured}
      syncStatus={userSync.syncStatus}
      lastSyncedIso={userSync.lastSyncedIso}
      authLoading={userSync.authLoading}
      currentZip={currentZip}
      activeStores={activeStores}
      macroGoal={macroGoal}
      dietaryConstraints={dietaryConstraints}
      applianceFilter={applianceFilter}
      pantryItemCount={pantry.entries.filter((entry) => !entry.deletedAtIso).length}
      onSignIn={userSync.signInWithProvider}
      onSignOut={userSync.signOut}
      onForceSync={handleForceCloudSync}
      onExportData={userSync.exportAccountDataJson}
      onDeleteAccount={userSync.deleteAccountAndData}
    />
  );
}
