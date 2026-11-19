'use client';

import { MapPin, RefreshCw } from 'lucide-react';
import { useLocationContext } from '@/modules/shell/app-context';

// Moved verbatim from MealPrepDashboard (v2.0 M3 Phase A.2). Since Phase B.2c it reads the app's state from the
// context hooks instead of props; the markup is unchanged.

export default function ZipPanel() {
  const {
    currentZip, zipInput, zipLoading, zipError, setZipInput, setZipError, setShowZipModal, handleZipSubmit: onSubmit,
  } = useLocationContext();
  const onZipInputChange = (value: string) => {
    setZipInput(value);
    setZipError(null);
  };
  const onClose = () => setShowZipModal(false);
  return (
    <div className="mt-3 rounded-xl border border-emerald-300 bg-white p-4 shadow-lg text-xs text-slate-700">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-emerald-600" />
          <span className="font-bold text-sm text-slate-900">
            Change Grocery Location (ZIP Code)
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 text-sm font-bold px-2 py-0.5"
        >
          ✕
        </button>
      </div>

      <p className="mt-2 text-slate-600 text-xs">
        Enter your 5-digit US ZIP code to fetch weekly supermarket circulars, digital coupons, and price trends for your local area.
      </p>

      <form onSubmit={onSubmit} className="mt-3 flex flex-wrap items-center gap-2">
        <input
          type="text"
          maxLength={5}
          pattern="[0-9]{5}"
          value={zipInput}
          onChange={(e) => onZipInputChange(e.target.value.replace(/\D/g, ''))}
          placeholder="e.g. 80542, 80501, 80202, 90210"
          className="w-40 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-900 focus:border-emerald-600 focus:outline-none"
        />
        <button
          type="submit"
          disabled={zipLoading}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 font-bold text-white hover:bg-emerald-700 transition disabled:opacity-50"
        >
          {zipLoading ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              <span>Updating...</span>
            </>
          ) : (
            <span>Update Location</span>
          )}
        </button>
      </form>

      {zipError && (
        <p className="mt-1.5 text-xs font-semibold text-red-600">{zipError}</p>
      )}

      <div className="mt-3 pt-2.5 border-t border-slate-100">
        <span className="text-[11px] font-semibold text-slate-500">
          Quick-select popular areas:
        </span>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {[
            { zip: '80542', label: 'Mead / Firestone, CO' },
            { zip: '80501', label: 'Longmont, CO' },
            { zip: '80202', label: 'Denver, CO' },
            { zip: '80302', label: 'Boulder, CO' },
            { zip: '80525', label: 'Fort Collins, CO' },
            { zip: '90210', label: 'Los Angeles, CA' },
            { zip: '75001', label: 'Dallas, TX' },
            { zip: '98101', label: 'Seattle, WA' },
            { zip: '60601', label: 'Chicago, IL' },
          ].map((preset) => (
            <button
              key={preset.zip}
              type="button"
              onClick={() => {
                onSubmit(undefined, preset.zip);
              }}
              className={`rounded-md px-2 py-1 text-[11px] font-medium border transition ${
                currentZip === preset.zip
                  ? 'bg-emerald-100 border-emerald-400 text-emerald-900 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {preset.label} ({preset.zip})
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
