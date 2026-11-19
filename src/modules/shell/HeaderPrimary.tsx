'use client';

import { Bell, ChefHat, DoorOpen, LogIn, MapPin, UserCheck } from 'lucide-react';
import {
  useAccountContext, useDashboardContext, useLocationContext, useShellContext,
} from '@/modules/shell/app-context';

// Moved verbatim from MealPrepDashboard (v2.0 M3 Phase A.4, header). Since Phase B.2c it reads the app's state from the
// context hooks instead of props; the markup is unchanged.

export default function HeaderPrimary() {
  const { data } = useDashboardContext();
  const { currentZip, showZipModal, setShowZipModal } = useLocationContext();
  const { userSync, pantry: { entries: pantryEntries } } = useAccountContext();
  const {
    showPantry, showAccountModal, showAlertsModal, pantryTrigger, setShowPantry, setShowAccountModal, setAccountIntent,
    handleToggleAlertsModal,
  } = useShellContext();
  return (
    <div className="flex items-center justify-between gap-3">
      {/* Brand + Active ZIP Selector */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
            <ChefHat className="h-5 w-5" />
          </span>
          <h1 className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
            <span>PantryBot</span>
            <span className="hidden rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200 lg:inline-block">
              v1.7 AI Meal Prep
            </span>
          </h1>
        </div>

        <span className="hidden text-slate-300 sm:inline">|</span>

        <button
          onClick={() => setShowZipModal(!showZipModal)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-emerald-800 border border-slate-200/90 transition"
          title="Click to change your ZIP code"
        >
          <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span className="truncate max-w-[150px] sm:max-w-none">
            {data.cityLabel} ({currentZip})
          </span>
          <span className="text-[11px] font-semibold text-emerald-700 underline ml-0.5">
            Change
          </span>
        </button>
      </div>

      {/* Top-Right Utility Controls & User Account CTA */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Virtual Pantry drawer trigger */}
        <button
          ref={pantryTrigger}
          onClick={() => setShowPantry(!showPantry)}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
            showPantry
              ? 'border-sky-600 bg-sky-600 text-white shadow-xs'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
          title={'Open Virtual Pantry'}
        >
          <DoorOpen
            className={`h-3.5 w-3.5 ${
              showPantry ? 'text-white' : 'text-sky-500'
            }`}
          />
          <span className="hidden sm:inline">{'Virtual Pantry'}</span>
          <span className="sm:hidden">{'Pantry'}</span>
          <span>({pantryEntries.filter((entry) => entry.available && !entry.deletedAtIso).length})</span>
        </button>

        <button
          onClick={handleToggleAlertsModal}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
            showAlertsModal
              ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
              : 'border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
          }`}
          title="Preview Smart Push Notifications & Friday Weekend Meal-Prep Digest"
        >
          <Bell className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Smart Alerts</span>
        </button>


        <span
          className="hidden h-5 w-px bg-slate-200 sm:inline-block"
          aria-hidden="true"
        />

        {/* v1.3 Ticket #26 & #29: Top-Right User Account & Cloud Sync Trigger */}
        <button
          onClick={() => { setAccountIntent('account'); setShowAccountModal(!showAccountModal); }}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition shadow-2xs ${
            showAccountModal
              ? 'border-violet-700 bg-violet-600 text-white'
              : userSync.authenticated
                ? 'border-violet-300 bg-violet-50/90 text-violet-950 hover:bg-violet-100'
                : 'border-violet-600 bg-violet-600 text-white hover:bg-violet-700'
          }`}
          title={
            userSync.authenticated
              ? `Signed in as ${userSync.profile?.displayName} (${userSync.profile?.email})`
              : 'Sign In with Google or Apple to sync across devices'
          }
        >
          {userSync.authenticated ? (
            <>
              <span
                className={`h-2 w-2 rounded-full ${
                  userSync.syncStatus === 'ERROR'
                    ? 'bg-rose-500'
                    : userSync.syncStatus === 'SYNCING'
                      ? 'bg-amber-400 animate-pulse'
                      : userSync.syncStatus === 'OFFLINE_QUEUED'
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                }`}
              />
              <UserCheck
                className={`h-3.5 w-3.5 ${
                  showAccountModal ? 'text-white' : 'text-violet-700'
                }`}
              />
              <span className="max-w-[120px] truncate">
                {userSync.profile?.displayName || 'Account'}
              </span>
            </>
          ) : (
            <>
              <LogIn className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
