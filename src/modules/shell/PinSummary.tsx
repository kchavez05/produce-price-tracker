'use client';

import { ArrowRight } from 'lucide-react';
import { useAccountContext, usePreferencesContext } from '@/modules/shell/app-context';
import AppLink from '@/modules/shell/AppLink';

// The pins and availability summary with its "View 3 Dishes" shortcut, moved verbatim from the temporary tab strip
// (PrimaryNav, removed in v2.0 M4-1a) when the navigation became the TabBar, icon rail and Sidebar. The summary and the
// shortcut are unchanged; the Shop redesign (M4-3a) decides where they finally live.
export default function PinSummary() {
  const { pinnedIds } = usePreferencesContext();
  const { effectiveOnHandIds } = useAccountContext();
  if (pinnedIds.length === 0 && effectiveOnHandIds.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-2.5">
      <div className="hidden items-center gap-2 md:flex">
        <span className="text-xs font-medium text-slate-600">
          {pinnedIds.length > 0 && `${pinnedIds.length} Pinned`}
          {pinnedIds.length > 0 && effectiveOnHandIds.length > 0 && ' • '}
          {effectiveOnHandIds.length > 0 &&
            (`${effectiveOnHandIds.length} marked available`)}
        </span>
        <AppLink
          to={{ module: 'plan' }}
          className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
        >
          <span>View 3 Dishes</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </AppLink>
      </div>
    </div>
  );
}
