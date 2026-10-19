'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import {
  AuthProviderType,
  CloudStorageMode,
  FreezerItem,
  SyncStatus,
  UserDataExportArchive,
  UserPreferences,
  UserProfile,
  UserSyncPayload,
} from '@/types/domain';

const SYNC_QUEUE_STORAGE_KEY = 'pantrybot_sync_queue_v13';
const MERGE_DISMISSED_KEY = 'pantrybot_guest_merge_dismissed_v13';

interface QueuedSyncMutation {
  preferences?: Partial<UserPreferences>;
  freezerItems?: FreezerItem[];
  mergeMode?: boolean;
  queuedAtIso: string;
}

export interface UseUserSyncOptions {
  onCloudStateHydrated?: (payload: UserSyncPayload) => void;
}

export function useUserSync(options?: UseUserSyncOptions) {
  const onHydrated = options?.onCloudStateHydrated;
  const [authenticated, setAuthenticated] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [storageMode, setStorageMode] = useState<CloudStorageMode>(
    'SQLITE_LOCAL_FALLBACK'
  );
  const [supabaseConfigured, setSupabaseConfigured] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('IDLE');
  const [lastSyncedIso, setLastSyncedIso] = useState<string | null>(null);
  const [hasGuestDataToMerge, setHasGuestDataToMerge] = useState(false);
  const [guestFreezerCount, setGuestFreezerCount] = useState(0);
  const [authLoading, setAuthLoading] = useState(false);

  const checkLocalGuestData = useCallback((cloudFreezerCount: number) => {
    try {
      const dismissed = sessionStorage.getItem(MERGE_DISMISSED_KEY);
      if (dismissed === 'true') {
        setHasGuestDataToMerge(false);
        return;
      }

      const rawFreezer = localStorage.getItem('pantrybot_virtual_freezer_v12');
      let localFreezerItems: FreezerItem[] = [];
      if (rawFreezer) {
        const parsed = JSON.parse(rawFreezer);
        if (Array.isArray(parsed)) {
          localFreezerItems = parsed as FreezerItem[];
        }
      }

      const rawOnHand = localStorage.getItem('mead_on_hand_ids_v04');
      let localOnHandCount = 0;
      if (rawOnHand) {
        const parsed = JSON.parse(rawOnHand);
        if (Array.isArray(parsed)) {
          localOnHandCount = parsed.length;
        }
      }

      const totalLocalCount = localFreezerItems.length + localOnHandCount;
      setGuestFreezerCount(localFreezerItems.length);

      if (localFreezerItems.length > 0 && cloudFreezerCount === 0) {
        setHasGuestDataToMerge(true);
      } else if (totalLocalCount > 0 && cloudFreezerCount === 0) {
        setHasGuestDataToMerge(true);
      } else {
        setHasGuestDataToMerge(false);
      }
    } catch {
      setHasGuestDataToMerge(false);
    }
  }, []);

  const refreshSyncState = useCallback(async () => {
    try {
      const res = await fetch('/api/sync');
      if (!res.ok) return;
      const payload = (await res.json()) as UserSyncPayload;
      setAuthenticated(payload.authenticated);
      setProfile(payload.profile);
      setPreferences(payload.preferences);
      setStorageMode(payload.storageMode);
      setSupabaseConfigured(payload.supabaseConfigured);
      setLastSyncedIso(payload.syncedAtIso);

      if (payload.authenticated) {
        setSyncStatus('SYNCED');
        checkLocalGuestData(payload.freezerItems.length);
        if (onHydrated) {
          onHydrated(payload);
        }
      } else {
        setSyncStatus('IDLE');
        setHasGuestDataToMerge(false);
      }
    } catch {
      // Offline or initial fetch skipped
    }
  }, [checkLocalGuestData, onHydrated]);

  const pushCloudSync = useCallback(
    async (mutation: {
      preferences?: Partial<UserPreferences>;
      freezerItems?: FreezerItem[];
      mergeMode?: boolean;
    }): Promise<UserSyncPayload | null> => {
      if (!authenticated) return null;

      // Queue offline if browser has no network connectivity
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        try {
          const rawExisting = localStorage.getItem(SYNC_QUEUE_STORAGE_KEY);
          let existing: Partial<QueuedSyncMutation> = {};
          if (rawExisting) {
            try {
              existing = JSON.parse(rawExisting) as Partial<QueuedSyncMutation>;
            } catch {
              // Ignore malformed existing queue JSON
            }
          }
          const queued: QueuedSyncMutation = {
            preferences: {
              ...existing.preferences,
              ...mutation.preferences,
            },
            freezerItems: mutation.freezerItems ?? existing.freezerItems,
            mergeMode: mutation.mergeMode ?? existing.mergeMode,
            queuedAtIso: new Date().toISOString(),
          };
          localStorage.setItem(SYNC_QUEUE_STORAGE_KEY, JSON.stringify(queued));
          setSyncStatus('OFFLINE_QUEUED');
        } catch {
          // Ignore storage error
        }
        return null;
      }

      setSyncStatus('SYNCING');
      try {
        const res = await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mutation),
        });
        if (!res.ok) {
          setSyncStatus('ERROR');
          return null;
        }
        const updated = (await res.json()) as UserSyncPayload;
        setProfile(updated.profile);
        setPreferences(updated.preferences);
        setLastSyncedIso(updated.syncedAtIso);
        setSyncStatus('SYNCED');
        return updated;
      } catch {
        setSyncStatus('OFFLINE_QUEUED');
        return null;
      }
    },
    [authenticated]
  );

  useEffect(() => {
    refreshSyncState();
  }, [refreshSyncState]);

  // Flush offline queue automatically when browser reconnects
  useEffect(() => {
    async function handleOnline() {
      if (!authenticated) return;
      try {
        const raw = localStorage.getItem(SYNC_QUEUE_STORAGE_KEY);
        if (!raw) return;
        const queued = JSON.parse(raw) as QueuedSyncMutation;
        localStorage.removeItem(SYNC_QUEUE_STORAGE_KEY);
        await pushCloudSync({
          preferences: queued.preferences,
          freezerItems: queued.freezerItems,
          mergeMode: queued.mergeMode,
        });
      } catch {
        // Ignore
      }
    }

    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [authenticated, pushCloudSync]);

  const signInWithProvider = useCallback(
    async (provider: AuthProviderType) => {
      setAuthLoading(true);
      try {
        const supabase = createBrowserSupabaseClient();
        if (supabase) {
          const redirectTo = `${window.location.origin}/auth/callback`;
          const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
              redirectTo,
            },
          });
          if (!error) {
            return;
          }
          console.error(
            'Supabase OAuth login failed, falling back to local mode:',
            error
          );
        }

        // Zero-Key Offline / Local SSO Fallback
        const res = await fetch('/api/account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'SIGN_IN_LOCAL',
            provider,
          }),
        });

        if (res.ok) {
          const payload = (await res.json()) as UserSyncPayload;
          setAuthenticated(payload.authenticated);
          setProfile(payload.profile);
          setPreferences(payload.preferences);
          setStorageMode(payload.storageMode);
          setSupabaseConfigured(payload.supabaseConfigured);
          setLastSyncedIso(payload.syncedAtIso);
          setSyncStatus('SYNCED');
          checkLocalGuestData(payload.freezerItems.length);
          if (onHydrated) {
            onHydrated(payload);
          }
        }
      } finally {
        setAuthLoading(false);
      }
    },
    [checkLocalGuestData, onHydrated]
  );

  const signOut = useCallback(async () => {
    setAuthLoading(true);
    try {
      const supabase = createBrowserSupabaseClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
      await fetch('/api/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SIGN_OUT' }),
      });
      setAuthenticated(false);
      setProfile(null);
      setPreferences(null);
      setSyncStatus('IDLE');
      setHasGuestDataToMerge(false);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const dismissGuestMergePrompt = useCallback(() => {
    setHasGuestDataToMerge(false);
    try {
      sessionStorage.setItem(MERGE_DISMISSED_KEY, 'true');
    } catch {
      // Ignore
    }
  }, []);

  const exportAccountDataJson = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/account');
      if (!res.ok) return false;
      const archive = (await res.json()) as UserDataExportArchive;
      const blob = new Blob([JSON.stringify(archive, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStamp = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `pantrybot-user-data-${dateStamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
    } catch {
      return false;
    }
  }, []);

  const deleteAccountAndData = useCallback(async (): Promise<boolean> => {
    setAuthLoading(true);
    try {
      const res = await fetch('/api/account', {
        method: 'DELETE',
      });
      if (!res.ok) return false;

      // Clear local storage keys to complete Right to be Forgotten purge
      try {
        localStorage.removeItem('pantrybot_virtual_freezer_v12');
        localStorage.removeItem('pantrybot_nutrition_profile_v12');
        localStorage.removeItem('pantrybot_active_stores');
        localStorage.removeItem('pantrybot_user_zip');
        localStorage.removeItem('mead_on_hand_ids_v04');
        localStorage.removeItem(SYNC_QUEUE_STORAGE_KEY);
        sessionStorage.removeItem(MERGE_DISMISSED_KEY);
      } catch {
        // Ignore
      }

      setAuthenticated(false);
      setProfile(null);
      setPreferences(null);
      setSyncStatus('IDLE');
      setHasGuestDataToMerge(false);
      return true;
    } catch {
      return false;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  return {
    authenticated,
    profile,
    preferences,
    storageMode,
    supabaseConfigured,
    syncStatus,
    lastSyncedIso,
    hasGuestDataToMerge,
    guestFreezerCount,
    authLoading,
    signInWithProvider,
    signOut,
    pushCloudSync,
    dismissGuestMergePrompt,
    exportAccountDataJson,
    deleteAccountAndData,
  };
}
