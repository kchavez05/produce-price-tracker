'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import {
  AuthProviderType,
  CloudStorageMode,
  SyncStatus,
  UserDataExportArchive,
  SyncedUserPreferences,
  UserProfile,
  UserSyncPayload,
} from '@/types/domain';

import { createSyncQueue, clearSyncQueue, prepareSyncMutation, syncQueueKey, SyncMutation } from '@/lib/sync/queue';
import { clearLegacyInventoryCache } from '@/lib/pantry/legacy-sync';

export interface UseUserSyncOptions {
  onCloudStateHydrated?: (payload: UserSyncPayload) => void;
  onSyncAcknowledged?: () => void;
}

export function useUserSync(options?: UseUserSyncOptions) {
  const onHydrated = options?.onCloudStateHydrated;
  const onAcknowledgedRef = useRef(options?.onSyncAcknowledged);
  useEffect(() => { onAcknowledgedRef.current = options?.onSyncAcknowledged; }, [options?.onSyncAcknowledged]);
  const queueRef = useRef<ReturnType<typeof createSyncQueue> | null>(null);
  const lastPayloadRef = useRef<UserSyncPayload | null>(null);
  const activeUserRef = useRef<string | null>(null);
  function getQueue() {
    if (!queueRef.current) queueRef.current = createSyncQueue(localStorage);
    return queueRef.current;
  }
  const [authenticated, setAuthenticated] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [preferences, setPreferences] = useState<SyncedUserPreferences | null>(null);
  const [storageMode, setStorageMode] = useState<CloudStorageMode>(
    'SQLITE_LOCAL_FALLBACK'
  );
  const [supabaseConfigured, setSupabaseConfigured] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('IDLE');
  const [lastSyncedIso, setLastSyncedIso] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const refreshSyncState = useCallback(async () => {
    try {
      const res = await fetch('/api/sync');
      if (!res.ok) return;
      const payload = await getQueue().overlay((await res.json()) as UserSyncPayload);
      lastPayloadRef.current = payload;
      activeUserRef.current = payload.profile?.id ?? null;
      setAuthenticated(payload.authenticated);
      setProfile(payload.profile);
      setPreferences(payload.preferences);
      setStorageMode(payload.storageMode);
      setSupabaseConfigured(payload.supabaseConfigured);
      setLastSyncedIso(payload.syncedAtIso);

      if (payload.authenticated) {
        setSyncStatus(localStorage.getItem(syncQueueKey(payload.profile!.id)) ? 'OFFLINE_QUEUED' : 'SYNCED');
        if (onHydrated) {
          onHydrated(payload);
        }
      } else {
        setSyncStatus('IDLE');
      }
    } catch {
      // Offline or initial fetch skipped
    }
  }, [onHydrated]);

  const flushQueue = useCallback(async (userId: string): Promise<UserSyncPayload | null> => {
    if (!navigator.onLine || activeUserRef.current !== userId) return null;
    try {
      setSyncStatus('SYNCING');
      const updated = await getQueue().flush(userId, async (mutation) => {
        if (activeUserRef.current !== userId) return null;
        const res = await fetch('/api/sync', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mutation),
        });
        return res.ok ? await res.json() as UserSyncPayload : null;
      });
      if (activeUserRef.current !== userId) return null;
      if (updated) {
        lastPayloadRef.current = updated;
        setProfile(updated.profile);
        setPreferences(updated.preferences);
        setLastSyncedIso(updated.syncedAtIso);
        onAcknowledgedRef.current?.();
        // Acknowledgment is not initial hydration: replacing the dashboard here
        // would roll back local selections and edits made during this request.
      }
      setSyncStatus(localStorage.getItem(syncQueueKey(userId)) ? 'OFFLINE_QUEUED' : 'SYNCED');
      return updated;
    } catch {
      if (activeUserRef.current === userId) setSyncStatus('OFFLINE_QUEUED');
      return null;
    }
  }, []);

  const pushCloudSync = useCallback(async (mutation: SyncMutation, onQueued?: (prepared: SyncMutation) => void): Promise<UserSyncPayload | null> => {
    const userId = profile?.id;
    if (!authenticated || !userId || activeUserRef.current !== userId) return null;
    try {
      const current = lastPayloadRef.current;
      const prepared = current ? prepareSyncMutation(mutation, current) : mutation;
      await getQueue().enqueue(userId, prepared);
      if (activeUserRef.current !== userId) return null;
      const latest = lastPayloadRef.current;
      if (latest) lastPayloadRef.current = {
        ...latest,
        preferences: latest.preferences ? { ...latest.preferences, ...prepared.preferences } : null,
      };
      setSyncStatus('OFFLINE_QUEUED');
      onQueued?.(prepared);
    } catch {
      setSyncStatus('ERROR');
      return null;
    }
    return flushQueue(userId);
  }, [authenticated, profile?.id, flushQueue]);

  useEffect(() => {
    refreshSyncState();
  }, [refreshSyncState]);

  // Retry on reconnect, after sign-in/reload, and while a failed request is queued.
  useEffect(() => {
    const userId = profile?.id;
    if (!authenticated || !userId) return;
    const ownerId = userId;
    function retry() {
      try {
        if (localStorage.getItem(syncQueueKey(ownerId))) void flushQueue(ownerId);
      } catch {
        setSyncStatus('ERROR');
      }
    }
    retry();
    window.addEventListener('online', retry);
    const timer = window.setInterval(retry, 30_000);
    return () => {
      window.removeEventListener('online', retry);
      window.clearInterval(timer);
    };
  }, [authenticated, profile?.id, flushQueue]);

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
          const payload = await getQueue().overlay((await res.json()) as UserSyncPayload);
          lastPayloadRef.current = payload;
          activeUserRef.current = payload.profile?.id ?? null;
          setAuthenticated(payload.authenticated);
          setProfile(payload.profile);
          setPreferences(payload.preferences);
          setStorageMode(payload.storageMode);
          setSupabaseConfigured(payload.supabaseConfigured);
          setLastSyncedIso(payload.syncedAtIso);
          setSyncStatus('SYNCED');
          if (onHydrated) {
            onHydrated(payload);
          }
        }
      } finally {
        setAuthLoading(false);
      }
    },
    [onHydrated]
  );

  const signOut = useCallback(async () => {
    activeUserRef.current = null;
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
      activeUserRef.current = null;
      setAuthenticated(false);
      setProfile(null);
      setPreferences(null);
      setSyncStatus('IDLE');
      window.location.reload();
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const exportAccountDataJson = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/account');
      if (!res.ok) return false;
      const archive = (await res.json()) as UserDataExportArchive;
      if (activeUserRef.current !== archive.profile.id) return false;
      const { pantryBrowserExport } = await import('@/lib/pantry/browser-export');
      const browserPantryRecovery = pantryBrowserExport(localStorage, `account:${archive.profile.id}`);
      if (activeUserRef.current !== archive.profile.id) return false;
      const blob = new Blob([JSON.stringify({ ...archive, browserPantryRecovery }, null, 2)], {
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
    const userId = profile?.id;
    if (!userId || activeUserRef.current !== userId) return false;
    setAuthLoading(true);
    try {
      const res = await fetch('/api/account', {
        method: 'DELETE', headers: { 'x-pantrybot-account-id': userId },
      });
      if (!res.ok) return false;
      const deleted = await res.json() as { purgedUserId?: string };
      if (deleted.purgedUserId !== userId) return false;

      // Clear local storage keys to complete Right to be Forgotten purge
      activeUserRef.current = null;
      let localCleanupComplete = true;
      try {
        clearLegacyInventoryCache(localStorage, userId);
        localStorage.removeItem('pantrybot_nutrition_profile_v12');
        localStorage.removeItem('pantrybot_active_stores');
        localStorage.removeItem('pantrybot_user_zip');
        {
          const { clearPantryQueue } = await import('@/lib/pantry/queue');
          clearPantryQueue(localStorage, `account:${userId}`);
          await clearSyncQueue(localStorage, userId);
        }
        sessionStorage.removeItem('pantrybot_guest_merge_dismissed_v13');
      } catch {
        localCleanupComplete = false;
      }

      activeUserRef.current = null;
      setAuthenticated(false);
      setProfile(null);
      setPreferences(null);
      setSyncStatus('IDLE');
      return localCleanupComplete;
    } catch {
      return false;
    } finally {
      setAuthLoading(false);
    }
  }, [profile]);

  return {
    authenticated,
    profile,
    preferences,
    storageMode,
    supabaseConfigured,
    syncStatus,
    lastSyncedIso,
    authLoading,
    signInWithProvider,
    signOut,
    pushCloudSync,
    exportAccountDataJson,
    deleteAccountAndData,
  };
}
