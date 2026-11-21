'use client';

import AccountModal from '@/modules/shell/AccountModal';
import {
  useAccountContext, useLocationContext, usePreferencesContext, useShellContext,
} from '@/modules/shell/app-context';

// v2.0 M3 Phase B.2d: the account dialog, moved verbatim from MealPrepDashboard's header. Since v2.0 M4-6a this is the signed-in account panel
// only, shown on Settings under "Manage Account" (signing in is the SignInSheet, hosted by SignInHost). It reads the account, location and
// preferences from the contexts and hands them to AccountModal, which stays a presentational component with its own tests. The open state
// lives in the Shell context.
export default function AccountDialog() {
  const { userSync, pantry } = useAccountContext();
  const { currentZip } = useLocationContext();
  const { macroGoal, dietaryConstraints, applianceFilter, activeStores } = usePreferencesContext();
  const { showAccountModal, setShowAccountModal, accountIntent, handleForceCloudSync } = useShellContext();
  return (
    <AccountModal
      isOpen={showAccountModal && userSync.authenticated && accountIntent === 'account'}
      onClose={() => setShowAccountModal(false)}
      profile={userSync.profile}
      storageMode={userSync.storageMode}
      syncStatus={userSync.syncStatus}
      lastSyncedIso={userSync.lastSyncedIso}
      authLoading={userSync.authLoading}
      currentZip={currentZip}
      activeStores={activeStores}
      macroGoal={macroGoal}
      dietaryConstraints={dietaryConstraints}
      applianceFilter={applianceFilter}
      pantryItemCount={pantry.entries.filter((entry) => !entry.deletedAtIso).length}
      onSignOut={userSync.signOut}
      onForceSync={handleForceCloudSync}
      onExportData={userSync.exportAccountDataJson}
      onDeleteAccount={userSync.deleteAccountAndData}
    />
  );
}
