'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AuthProviderType,
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
  Lock,
  Cloud,
  Database,
  ArrowRightLeft,
} from 'lucide-react';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  authenticated: boolean;
  profile: UserProfile | null;
  storageMode: CloudStorageMode;
  supabaseConfigured: boolean;
  syncStatus: SyncStatus;
  lastSyncedIso: string | null;
  authLoading: boolean;
  hasGuestDataToMerge: boolean;
  guestFreezerCount: number;
  currentZip: string;
  activeStores: StoreChain[];
  macroGoal: MacroGoal;
  dietaryConstraints: DietaryConstraint[];
  applianceFilter: CookingVesselArchetype;
  freezerItemCount: number;
  pantryEnabled?: boolean;
  onSignIn: (provider: AuthProviderType) => Promise<void>;
  onSignOut: () => Promise<void>;
  onMergeGuestData: () => Promise<boolean>;
  onDismissMergePrompt: () => void;
  onForceSync: () => Promise<void>;
  onExportData: () => Promise<boolean>;
  onDeleteAccount: () => Promise<boolean>;
}

export default function AccountModal({
  isOpen,
  onClose,
  authenticated,
  profile,
  storageMode,
  supabaseConfigured,
  syncStatus,
  lastSyncedIso,
  authLoading,
  hasGuestDataToMerge,
  guestFreezerCount,
  currentZip,
  activeStores,
  macroGoal,
  dietaryConstraints,
  applianceFilter,
  freezerItemCount,
  pantryEnabled = false,
  onSignIn,
  onSignOut,
  onMergeGuestData,
  onDismissMergePrompt,
  onForceSync,
  onExportData,
  onDeleteAccount,
}: AccountModalProps) {
  const [exportSuccess, setExportSuccess] = useState(false);
  const [confirmDeleteStep, setConfirmDeleteStep] = useState(false);
  const [merging, setMerging] = useState(false);
  const [mergeError, setMergeError] = useState<string | null>(null);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleExportClick() {
    const ok = await onExportData();
    if (ok) {
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3500);
    }
  }

  async function handleMergeClick() {
    setMerging(true);
    setMergeError(null);
    try {
      if (!(await onMergeGuestData())) {
        setMergeError('Unable to save the guest import locally. Please retry.');
        return;
      }
      setStatusBanner(
        'Guest inventory is saved locally; account sync will retry if needed.'
      );
      setTimeout(() => setStatusBanner(null), 4000);
    } finally {
      setMerging(false);
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
            <h3 className="font-bold text-sm text-slate-900">
              {authenticated
                ? 'Account, Cloud Sync & Privacy Controls (v1.3)'
                : pantryEnabled ? 'Sign In to Sync Your Virtual Pantry & Preferences' : 'Sign In to Sync Your Virtual Freezer & Preferences'}
            </h3>
            <p className="text-[11px] text-slate-500">
              {authenticated
                ? 'Manage cross-device sync, export your grocery archive, or exercise Right-to-be-Forgotten deletion.'
                : 'One-tap Google or Apple SSO with strict PII minimization and PostgreSQL Row-Level Security.'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 text-sm font-bold px-2 py-0.5"
          aria-label="Close account modal"
        >
          ✕
        </button>
      </div>

      {mergeError && <p role="alert" className="mt-3 text-sm font-semibold text-rose-700">{mergeError}</p>}
      {statusBanner && (
        <div className="mt-3 flex items-center justify-between rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-emerald-900 font-semibold">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{statusBanner}</span>
          </div>
          <button
            onClick={() => setStatusBanner(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {!authenticated ? (
        <div className="mt-3 grid gap-4 lg:grid-cols-12">
          {/* SSO Sign-In Buttons */}
          <div className="lg:col-span-6 flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-slate-900 text-xs">
                  Passwordless Single Sign-On (SSO)
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-900 border border-violet-200">
                  <Lock className="h-2.5 w-2.5" />
                  HttpOnly + PKCE
                </span>
              </div>
              <p className="mt-1.5 text-[11px] text-slate-600 leading-relaxed">
                Sign in to back up your <strong>{pantryEnabled ? 'Virtual Pantry' : 'Virtual Freezer'}</strong>,{' '}
                <strong>My Stores</strong> filter, and{' '}
                <strong>Macro/Dietary profile</strong> across your phone, tablet,
                and desktop.
              </p>

              <div className="mt-3.5 space-y-2.5">
                {/* Google SSO Button */}
                <button
                  type="button"
                  disabled={authLoading}
                  onClick={() => onSignIn('google')}
                  className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-50 disabled:opacity-50 transition"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                    />
                  </svg>
                  <span>
                    {authLoading ? 'Connecting...' : 'Continue with Google'}
                  </span>
                </button>

                {/* Apple HIG Sign-In Button (Ticket #30) */}
                <button
                  type="button"
                  disabled={authLoading}
                  onClick={() => onSignIn('apple')}
                  className="flex w-full items-center justify-center gap-2.5 rounded-lg bg-black px-4 py-2.5 text-xs font-bold text-white shadow-2xs hover:bg-neutral-900 disabled:opacity-50 transition"
                >
                  <svg
                    className="h-4 w-4 fill-current"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                  </svg>
                  <span>
                    {authLoading ? 'Connecting...' : 'Sign in with Apple'}
                  </span>
                </button>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
              <span>
                By signing in, you agree to our{' '}
                <Link
                  href="/privacy"
                  className="font-semibold text-violet-700 underline hover:text-violet-900"
                >
                  Privacy Policy
                </Link>{' '}
                &amp;{' '}
                <Link
                  href="/terms"
                  className="font-semibold text-violet-700 underline hover:text-violet-900"
                >
                  Terms
                </Link>
                .
              </span>
              <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                {supabaseConfigured
                  ? '☁️ Live Supabase OAuth Active'
                  : '🛡️ Zero-Key Local Auth Ready'}
              </span>
            </div>
          </div>

          {/* Data Security & PII Minimization Architecture Card */}
          <div className="lg:col-span-6 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 font-bold text-emerald-950 text-xs">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Strict PII Minimization &amp; Security Architecture</span>
              </div>
              <ul className="mt-2.5 space-y-2 text-[11px] text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-emerald-700">✓</span>
                  <span>
                    <strong>Minimal PII Footprint:</strong> We only store an
                    opaque account UUID, email address, and your grocery
                    preferences. No passwords, street addresses, or phone
                    numbers.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-emerald-700">✓</span>
                  <span>
                    <strong>PostgreSQL Row-Level Security (RLS):</strong> Every
                    freezer item and preference row is isolated at the database
                    engine layer via <code>auth.uid() = user_id</code>.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-emerald-700">✓</span>
                  <span>
                    <strong>Full Self-Serve Ownership:</strong> Download a
                    complete <code>.json</code> archive of your data or
                    permanently purge your account in 2 clicks anytime.
                  </span>
                </li>
              </ul>
            </div>

            <div className="mt-3 rounded-lg bg-white/90 border border-emerald-200 px-3 py-2 text-[11px] text-slate-600">
              <strong>Guest Mode Always Available:</strong> You can continue
              using PantryBot 100% anonymously without an account. Signing in is
              only needed to sync across devices.
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          {/* Guest-to-Account Migration Prompt (Ticket #28) */}
          {hasGuestDataToMerge && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-white shrink-0">
                  <ArrowRightLeft className="h-4 w-4" />
                </span>
                <div>
                  <div className="font-bold text-amber-950 text-xs">
                    Local Guest Data Detected on This Device
                  </div>
                  <p className="text-[11px] text-amber-900">
                    We found{' '}
                    <strong>
                      {guestFreezerCount > 0
                        ? `${guestFreezerCount} local Virtual Freezer item(s)`
                        : 'saved local grocery preferences'}
                    </strong>{' '}
                    from your anonymous session. Merge them into your account?
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={merging}
                  onClick={handleMergeClick}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-50 transition"
                >
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                  <span>{merging ? 'Merging...' : 'Merge into Account'}</span>
                </button>
                <button
                  type="button"
                  onClick={onDismissMergePrompt}
                  className="rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition"
                >
                  Skip
                </button>
              </div>
            </div>
          )}

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
                      {pantryEnabled ? 'Virtual Pantry' : 'Virtual Freezer'}
                    </div>
                    <div className="font-bold text-sky-800">
                      {freezerItemCount} {pantryEnabled ? 'ingredients' : 'Cut(s) Banked'}
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
      )}
    </div>
  );
}
