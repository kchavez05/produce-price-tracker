'use client';

import { ChefHat, LogIn } from 'lucide-react';
import { IconButton } from '@/components/ui';
import { useAccountContext, useShellContext } from '@/modules/shell/app-context';

// v2.0 M4-1b: the header is the brand and the account avatar, as in the wireframes. ZIP, alerts and the store filter moved
// to TemporaryControls (until Settings holds them). The avatar is the same account control the Sign In button was (it opens
// the account dialog; M4-2a points it at Settings). Its name is "Sign In" for a guest and the display name when signed in,
// and the sync status is kept as a coloured dot plus the accessible description.
const SYNC_DOT: Record<string, string> = {
  ERROR: 'bg-danger',
  SYNCING: 'bg-warning animate-pulse',
  OFFLINE_QUEUED: 'bg-warning',
};

export default function HeaderPrimary() {
  const { userSync } = useAccountContext();
  const { showAccountModal, setShowAccountModal, setAccountIntent } = useShellContext();
  const signedIn = userSync.authenticated;
  const name = signedIn ? userSync.profile?.displayName || 'Account' : 'Sign In';
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-control bg-accent text-on-accent">
          <ChefHat className="size-5" aria-hidden="true" />
        </span>
        <span className="text-lg font-bold tracking-tight text-ink">PantryBot</span>
      </div>

      {/* v1.3 Ticket #26 & #29: the account and cloud sync control */}
      <div className="relative">
        <IconButton
          label={name}
          aria-expanded={showAccountModal}
          onClick={() => { setAccountIntent('account'); setShowAccountModal(!showAccountModal); }}
          className={`rounded-pill border border-border-strong ${showAccountModal ? 'bg-accent text-on-accent' : 'bg-chip'}`}
          title={
            signedIn
              ? `Signed in as ${userSync.profile?.displayName} (${userSync.profile?.email})`
              : 'Sign In with Google or Apple to sync across devices'
          }
          icon={signedIn
            ? <span className="text-sm font-bold">{name.slice(0, 1).toUpperCase()}</span>
            : <LogIn className="size-5" />}
        />
        {signedIn && (
          <span
            aria-hidden="true"
            data-sync-status={userSync.syncStatus}
            className={`pointer-events-none absolute -right-0.5 -top-0.5 size-3 rounded-full border-2 border-surface ${SYNC_DOT[userSync.syncStatus] ?? 'bg-save'}`}
          />
        )}
      </div>
    </div>
  );
}
