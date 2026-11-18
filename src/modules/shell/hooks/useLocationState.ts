import { useState } from 'react';
import type { DashboardPayload } from '@/types/domain';

// Moved verbatim from MealPrepDashboard (v2.0 M3 Phase A.5a): plain state only. ZIP submit, persistence and the
// dashboard refetch stay in the dashboard.
export function useLocationState(initialData: Pick<DashboardPayload, 'zipCode'>) {
  const [currentZip, setCurrentZip] = useState(initialData.zipCode || '80542');
  const [showZipModal, setShowZipModal] = useState(false);
  const [zipInput, setZipInput] = useState(initialData.zipCode || '80542');
  const [zipLoading, setZipLoading] = useState(false);
  const [zipError, setZipError] = useState<string | null>(null);
  return {
    currentZip, setCurrentZip, showZipModal, setShowZipModal, zipInput, setZipInput,
    zipLoading, setZipLoading, zipError, setZipError,
  };
}
