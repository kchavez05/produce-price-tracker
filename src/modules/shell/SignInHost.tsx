'use client';

import SignInSheet from '@/modules/shell/SignInSheet';
import { useAccountContext, useShellContext } from '@/modules/shell/app-context';

// v2.0 M4-6a: the one place the sign-in sheet is mounted, in the app's frame so it opens from every screen. The Shell context holds whether it
// is open and why (`accountIntent`): Settings' Sign In opens it with the account intent, and every "Sign in to use" prompt (the Plan's AI Chef,
// voice entry) opens it with the AI intent through `showAiSignIn`. It is shown for a signed-out visitor, and for the AI intent also when the
// account is signed in but cannot use AI (a local or demo profile), so that case is never a dead end, as before.
export default function SignInHost() {
  const { userSync } = useAccountContext();
  const { showAccountModal, setShowAccountModal, accountIntent } = useShellContext();
  return (
    <SignInSheet
      open={showAccountModal && (!userSync.authenticated || accountIntent === 'ai')}
      intent={accountIntent}
      onClose={() => setShowAccountModal(false)}
      authLoading={userSync.authLoading}
      supabaseConfigured={userSync.supabaseConfigured}
      onSignIn={userSync.signInWithProvider}
    />
  );
}
