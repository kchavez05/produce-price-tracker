'use client';

import { Bell, MapPin } from 'lucide-react';
import { useDashboardContext, useLocationContext, useShellContext } from '@/modules/shell/app-context';

// The ZIP and Smart Alerts controls, moved verbatim from the header (v2.0 M4-1b). They have no home in the new design until
// Settings (M4-2a) holds the location and the Shop shows a read-only location line (M4-3a), which removes this component
// (M4 decision 19). Only the wrapper changed: the controls now sit in the page, not in the sticky header.
export default function TemporaryControls() {
  const { data } = useDashboardContext();
  const { currentZip, showZipModal, setShowZipModal } = useLocationContext();
  const { showAlertsModal, handleToggleAlertsModal } = useShellContext();
  return (
    <div className="flex flex-wrap items-center gap-2 pb-2.5">
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
    </div>
  );
}
