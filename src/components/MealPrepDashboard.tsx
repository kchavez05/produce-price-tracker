'use client';

import React from 'react';
import type { DashboardPayload, RecommendedDish } from '@/types/domain';
import AppProvider from '@/modules/shell/AppProvider';
import DashboardShell from '@/modules/shell/DashboardShell';

interface Props {
  initialData: DashboardPayload;
  barcodeEnabled?: boolean; speechConfigured?: boolean;
  cameraEnabled?: boolean;
  initialAccountId?: string | null;
  initialPrivateRecipes?: RecommendedDish[];
}

// v2.0 M3 Phase B.1e: the dashboard is the provider plus the shell, which still shows the tabs. Phase B.3 moves the
// provider into the route group's layout and the default export goes away.
export default function MealPrepDashboard({ initialData, barcodeEnabled = false, speechConfigured = false, cameraEnabled = false, initialAccountId = null, initialPrivateRecipes = [] }: Props) {
  return (
    <AppProvider initialData={initialData} initialAccountId={initialAccountId} initialPrivateRecipes={initialPrivateRecipes}>
      <DashboardShell barcodeEnabled={barcodeEnabled} speechConfigured={speechConfigured} cameraEnabled={cameraEnabled} />
    </AppProvider>
  );
}
