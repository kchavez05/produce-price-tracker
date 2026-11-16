import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const metadata: Metadata = { title: 'Design System — PantryBot', robots: { index: false, follow: false } };

/** Development-only style guide (v2.0 M1). Production builds return 404 and do not load the guide. */
export default async function DesignPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  const { default: DesignGuide } = await import('./DesignGuide');
  return <DesignGuide />;
}
