'use client';

import { useEffect, useRef, useState } from 'react';
import { Banner, Button, Sheet } from '@/components/ui';
import AppLink from '@/modules/shell/AppLink';
import type { CloudStorageMode, SyncStatus } from '@/types/domain';

// v2.0 M4-6b (spec decision 8): the two sheets behind the Settings Account section, replacing the signed-in half of the old
// AccountModal. Sync status explains where the account's data lives and what syncs, with Sync Now; delete is the two-step erasure
// (the row opens the sheet, and the destructive button inside it is the second, explicit step) with the export offered first. They
// take their data and actions as props from SettingsPage, which reads them from the same contexts as before: no sync, export or
// delete logic lives here.

const STATUS_COPY: Record<SyncStatus, string> = {
  IDLE: 'All changes synced.',
  SYNCED: 'All changes synced.',
  SYNCING: 'Syncing now.',
  OFFLINE_QUEUED: 'Offline. Your changes are queued on this device and will sync when you are back online.',
  ERROR: 'The last sync failed. Your changes stay on this device and are retried. Try Sync Now.',
};

/** Runs the export and remembers for a few seconds that it worked, so the button can say so. */
export function useExport(onExport: () => Promise<boolean>) {
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  async function run() {
    if (await onExport()) {
      setDone(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setDone(false), 3500);
    }
  }
  return { done, run };
}

interface SyncStatusSheetProps {
  open: boolean;
  onClose: () => void;
  syncStatus: SyncStatus;
  storageMode: CloudStorageMode;
  lastSyncedIso: string | null;
  currentZip: string;
  storeCount: number;
  pantryItemCount: number;
  preferencesSummary: string;
  onSyncNow: () => Promise<void>;
}

export function SyncStatusSheet({
  open, onClose, syncStatus, storageMode, lastSyncedIso, currentZip, storeCount, pantryItemCount, preferencesSummary, onSyncNow,
}: SyncStatusSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} title="Sync status" closeLabel="Close sync status">
      <div className="space-y-4 text-sm text-ink">
        <div className="space-y-1">
          <p role="status">{STATUS_COPY[syncStatus]}</p>
          <p className="text-muted" suppressHydrationWarning>
            {lastSyncedIso
              ? `Last synced: ${new Date(lastSyncedIso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : 'Session active'}
          </p>
          <p className="text-muted">
            {storageMode === 'SUPABASE_RLS'
              ? 'Stored in your private cloud account, isolated to you by row-level security.'
              : 'Stored in this server’s local database, isolated to your account.'}
          </p>
        </div>
        <Button variant="primary" className="w-full" disabled={syncStatus === 'SYNCING'} onClick={() => void onSyncNow()}>Sync Now</Button>

        <section aria-label="What syncs" className="space-y-2 rounded-card bg-chip p-4">
          <h3 className="font-semibold">What syncs</h3>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            <dt className="text-muted">Home ZIP</dt><dd>{currentZip}</dd>
            <dt className="text-muted">My Stores</dt><dd>{storeCount} chains</dd>
            <dt className="text-muted">Virtual Pantry</dt><dd>{pantryItemCount} ingredients</dd>
            <dt className="text-muted">Meal prep</dt><dd>{preferencesSummary}</dd>
          </dl>
        </section>

        <p className="text-muted">
          A pantry change that could not be saved to your account stays queued here, and you can review your pantry in the{' '}
          <AppLink to={{ module: 'pantry' }} className="font-semibold text-accent underline">Pantry</AppLink>.
        </p>
      </div>
    </Sheet>
  );
}

interface DeleteAccountSheetProps {
  open: boolean;
  onClose: () => void;
  authLoading: boolean;
  onExport: () => Promise<boolean>;
  onDelete: () => Promise<boolean>;
}

export function DeleteAccountSheet({ open, onClose, authLoading, onExport, onDelete }: DeleteAccountSheetProps) {
  const exported = useExport(onExport);
  const [failed, setFailed] = useState(false);
  async function confirm() {
    setFailed(false);
    if (await onDelete()) onClose();
    else setFailed(true);
  }
  function close() { setFailed(false); onClose(); }
  return (
    <Sheet open={open} onClose={close} title="Permanently wipe account?" closeLabel="Close delete account">
      <div className="space-y-4 text-sm text-ink">
        <p>
          This permanently removes your account, your Virtual Pantry, your saved recipes and your preferences, and clears them from this
          device. It cannot be undone.
        </p>
        {failed && <Banner tone="error" title="Your account was not deleted">Something went wrong. Try again in a moment.</Banner>}
        <Button variant="secondary" className="w-full" onClick={() => void exported.run()}>
          {exported.done ? 'Downloaded .JSON!' : 'Export My Grocery Data'}
        </Button>
        <p className="text-xs text-muted">Export first if you want a copy: it is a portable JSON file of your pantry, preferences and saved recipes.</p>
        <div className="flex flex-col gap-2">
          <Button variant="destructive" className="w-full border border-danger" disabled={authLoading} onClick={() => void confirm()}>Yes, Purge All</Button>
          <Button variant="secondary" className="w-full" onClick={close}>Cancel</Button>
        </div>
      </div>
    </Sheet>
  );
}
