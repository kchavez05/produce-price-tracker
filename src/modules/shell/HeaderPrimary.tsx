'use client';

import { ChefHat, LogIn } from 'lucide-react';
import AppLink from '@/modules/shell/AppLink';
import { useAccountContext, useShellContext } from '@/modules/shell/app-context';

// v2.0 M4-1b: the header is the brand and the account avatar, as in the wireframes. Since M4-2a the avatar is a link straight
// to Settings (owner decision 2, no separate menu); sign-in, sync and the rest of the account live there. It is named
// "Account and settings" and described by the sync status for a signed-in user. The status is a coloured dot for sighted
// users and, for everyone, a visually hidden description the link points at (aria-describedby), so a failed sync or changes
// queued offline are never colour-only.
const SYNC_DOT: Record<string, string> = {
  ERROR: 'bg-danger',
  SYNCING: 'bg-warning animate-pulse',
  OFFLINE_QUEUED: 'bg-warning',
};

const SYNC_TEXT: Record<string, string> = {
  ERROR: 'Sync failed. Your changes are saved on this device and will retry.',
  SYNCING: 'Syncing your changes.',
  OFFLINE_QUEUED: 'Offline. Your changes are queued and will sync when you reconnect.',
};

/** The sentence that describes a sync status to assistive technology (a synced or idle account reads as synced). */
export function describeSync(status: string): string {
  return SYNC_TEXT[status] ?? 'Signed in. Your changes are synced.';
}

export default function HeaderPrimary() {
  const { userSync } = useAccountContext();
  const { module } = useShellContext();
  const signedIn = userSync.authenticated;
  const syncDescription = signedIn ? describeSync(userSync.syncStatus) : undefined;
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-control bg-accent text-on-accent">
          <ChefHat className="size-5" aria-hidden="true" />
        </span>
        <span className="text-lg font-bold tracking-tight text-ink">PantryBot</span>
      </div>

      {/* v1.3 Ticket #26 & #29: the account and cloud sync entry, now Settings */}
      <div className="relative">
        <AppLink
          to={{ module: 'settings' }}
          aria-label="Account and settings"
          aria-current={module === 'settings' ? 'page' : undefined}
          aria-describedby={syncDescription ? 'account-sync-status' : undefined}
          className={`inline-flex size-touch items-center justify-center rounded-pill border border-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${module === 'settings' ? 'bg-accent text-on-accent' : 'bg-chip text-ink'}`}
          title={
            signedIn
              ? `Account and settings. Signed in as ${userSync.profile?.displayName} (${userSync.profile?.email})`
              : 'Account and settings. Sign in with Google or Apple to sync across devices.'
          }
        >
          {signedIn
            ? <span aria-hidden="true" className="text-sm font-bold">{(userSync.profile?.displayName || 'Account').slice(0, 1).toUpperCase()}</span>
            : <LogIn aria-hidden="true" className="size-5" />}
        </AppLink>
        {syncDescription && <span id="account-sync-status" className="sr-only">{syncDescription}</span>}
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
