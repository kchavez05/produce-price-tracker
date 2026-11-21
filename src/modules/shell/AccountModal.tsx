'use client';

// v2.0 M4-6a: this is now the signed-in account panel only (sync, profile summary, export, delete); signing in is the SignInSheet. M4-6b moves
// what is left into the Settings Account section.

import React, { useState } from 'react';
import {
  CloudStorageMode,
  CookingVesselArchetype,
  DietaryConstraint,
  MacroGoal,
  StoreChain,
  SyncStatus,
  UserProfile,
} from '@/types/domain';
import {
  ShieldCheck,
  Download,
  Trash2,
  LogOut,
  RefreshCw,
  Check,
  AlertTriangle,
  Cloud,
  Database,
} from 'lucide-react';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  storageMode: CloudStorageMode;
  syncStatus: SyncStatus;
  lastSyncedIso: string | null;
  authLoading: boolean;
  currentZip: string;
  activeStores: StoreChain[];
  macroGoal: MacroGoal;
  dietaryConstraints: DietaryConstraint[];
  applianceFilter: CookingVesselArchetype;
  pantryItemCount: number;
  onSignOut: () => Promise<void>;
  onForceSync: () => Promise<void>;
  onExportData: () => Promise<boolean>;
  onDeleteAccount: () => Promise<boolean>;
}

export default function AccountModal({
  isOpen,
  onClose,
  profile,
  storageMode,
  syncStatus,
  lastSyncedIso,
  authLoading,
  currentZip,
  activeStores,
  macroGoal,
  dietaryConstraints,
  applianceFilter,
  pantryItemCount,
  onSignOut,
  onForceSync,
  onExportData,
  onDeleteAccount,
}: AccountModalProps) {
  const [exportSuccess, setExportSuccess] = useState(false);
  const [confirmDeleteStep, setConfirmDeleteStep] = useState(false);

  if (!isOpen) return null;

  async function handleExportClick() {
    const ok = await onExportData();
    if (ok) {
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3500);
    }
  }

  async function handleConfirmDeleteAccount() {
    const ok = await onDeleteAccount();
    if (ok) {
      setConfirmDeleteStep(false);
      onClose();
    }
  }

  const initials = profile?.displayName
    ? profile.displayName
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'PB';

  return (
    <div className="mt-3 rounded-xl border border-violet-300 bg-white p-4 shadow-lg text-xs text-slate-700">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600 text-white">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div>
            <h3 className="font-bold text-sm text-slate-900">Account, Cloud Sync &amp; Privacy Controls (v1.3)</h3>
            <p className="text-[11px] text-slate-500">
              Manage cross-device sync, export your grocery archive, or exercise Right-to-be-Forgotten deletion.
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 text-sm font-bold px-2 py-0.5"
          aria-label="Close account panel"
        >
          ✕
        </button>
      </div>

        <div className="mt-3 space-y-3">
          {/* Guest-to-Account Migration Prompt (Ticket #28) */}

          <div className="grid gap-3 lg:grid-cols-12">
            {/* Signed-In Profile Summary */}
            <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-slate-50 p-3.5 flex flex-col justify-between">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 text-white font-bold text-sm shadow-xs shrink-0">
                    {initials}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 text-sm">
                        {profile?.displayName}
                      </span>
                      <span className="rounded-md bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-900 border border-violet-200 uppercase">
                        {profile?.provider === 'apple'
                          ? 'Apple SSO'
                          : 'Google SSO'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {profile?.email}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
                      {storageMode === 'SUPABASE_RLS' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-900">
                          <Cloud className="h-3 w-3" />
                          PostgreSQL RLS Cloud
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 font-semibold text-sky-900">
                          <Database className="h-3 w-3" />
                          Multi-Tenant SQLite
                        </span>
                      )}
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-600 font-medium">
                        {syncStatus === 'SYNCING'
                          ? 'Syncing...'
                          : syncStatus === 'OFFLINE_QUEUED'
                            ? 'Offline (Queued)'
                            : 'All changes synced'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between gap-2">
                <span
                  className="text-[11px] text-slate-500"
                  suppressHydrationWarning
                >
                  {lastSyncedIso
                    ? `Last synced: ${new Date(lastSyncedIso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : 'Session active'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onForceSync}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Sync Now</span>
                  </button>
                  <button
                    type="button"
                    disabled={authLoading}
                    onClick={onSignOut}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition"
                  >
                    <LogOut className="h-3 w-3" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Synced Kitchen & Grocery State */}
            <div className="lg:col-span-4 rounded-xl border border-slate-200 bg-white p-3.5 flex flex-col justify-between">
              <div>
                <div className="font-bold text-slate-900 text-xs">
                  Synced Personalization Profile
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                    <div className="text-slate-400 text-[10px]">Home ZIP</div>
                    <div className="font-bold text-slate-900">{currentZip}</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                    <div className="text-slate-400 text-[10px]">My Stores</div>
                    <div className="font-bold text-slate-900">
                      {activeStores.length} Chains
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                    <div className="text-slate-400 text-[10px]">
                      {'Virtual Pantry'}
                    </div>
                    <div className="font-bold text-sky-800">
                      {pantryItemCount} {'ingredients'}
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                    <div className="text-slate-400 text-[10px]">
                      Nutrition / Vessel
                    </div>
                    <div className="font-bold text-emerald-800 truncate">
                      {macroGoal === 'ANY' ? 'Balanced' : macroGoal} •{' '}
                      {dietaryConstraints.length} Rules
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-2 text-[10px] text-slate-400">
                Appliance preference: <strong>{applianceFilter}</strong>
              </div>
            </div>

            {/* Self-Serve GDPR / CCPA Privacy Controls (Ticket #29) */}
            <div className="lg:col-span-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 flex flex-col justify-between">
              <div>
                <div className="font-bold text-slate-900 text-xs">
                  Self-Serve Data &amp; Privacy
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Export a portable JSON copy of your grocery data or delete
                  your account.
                </p>

                <button
                  type="button"
                  onClick={handleExportClick}
                  className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-900 hover:bg-emerald-100 transition"
                >
                  {exportSuccess ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Downloaded .JSON!</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-3.5 w-3.5" />
                      <span>Export My Grocery Data</span>
                    </>
                  )}
                </button>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-200">
                {!confirmDeleteStep ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteStep(true)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-rose-700 hover:bg-rose-50 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete Account &amp; Data</span>
                  </button>
                ) : (
                  <div className="rounded-lg border border-rose-300 bg-rose-50 p-2">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-rose-900">
                      <AlertTriangle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                      <span>Permanently wipe account?</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={authLoading}
                        onClick={handleConfirmDeleteAccount}
                        className="flex-1 rounded-md bg-rose-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-rose-700"
                      >
                        Yes, Purge All
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteStep(false)}
                        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[10px] font-semibold text-slate-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}
