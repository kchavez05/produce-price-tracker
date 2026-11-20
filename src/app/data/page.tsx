import type { Metadata } from 'next';
import { Suspense } from 'react';
import { explorerCatalog } from '@/lib/explorer/catalog';
import AppFooter from '@/components/AppFooter';
import DataExplorer from '@/components/explorer/DataExplorer';
import './explorer.css';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Explore the data | PantryBot',
  description:
    'Follow grocery prices from USDA reports and store advertisements to PantryBot value scores. Explore source rows, ingredient mappings, and price history.',
};
export default function DataPage() {
  return (
    <>
    <Suspense
      fallback={<main className="p-12">Loading the data explorer…</main>}
    >
      <DataExplorer
        catalog={explorerCatalog()}
        today={new Intl.DateTimeFormat('en-CA', {
          timeZone: 'America/Denver',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(new Date())}
      />
    </Suspense>
    <AppFooter />
    </>
  );
}
