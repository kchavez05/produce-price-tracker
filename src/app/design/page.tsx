import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import AppFooter from '@/components/AppFooter';
import { designGuideEnabled } from '@/design/guide-access';

export const metadata: Metadata = { title: 'Design System — PantryBot', robots: { index: false, follow: false } };

/**
 * Development-only style guide (v2.0 M1). Production builds return 404 and do not load the guide,
 * except the browser-test build (see `designGuideEnabled`); Vercel production never serves it.
 */
export default async function DesignPage() {
  if (!designGuideEnabled()) notFound();
  const { default: DesignGuide } = await import('./DesignGuide');
  return (
    <>
      <DesignGuide />
      <AppFooter />
    </>
  );
}
