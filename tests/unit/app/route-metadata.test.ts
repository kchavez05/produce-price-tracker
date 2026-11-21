import { isValidElement, Children, type ReactElement, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

// v2.0 M4-1b: each app screen has its own page title (WCAG 2.4.2), the viewport lets the page extend under the iPhone status
// bar and home indicator (viewport-fit=cover, with the shell padding for the insets), and the site footer is on the static
// pages, not on the app screens.
vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => undefined }) }));
vi.mock('next/navigation', () => ({ redirect: vi.fn(), notFound: vi.fn() }));
vi.mock('@vercel/analytics/next', () => ({ Analytics: () => null }));
import AppFooter from '@/components/AppFooter';
import DocumentShell from '@/components/document/DocumentShell';
import RootLayout, { viewport } from '@/app/layout';
import { metadata as shopMeta } from '@/app/(app)/shop/page';
import { metadata as planMeta } from '@/app/(app)/plan/page';
import { metadata as pantryMeta } from '@/app/(app)/pantry/page';
import { metadata as dealMeta } from '@/app/(app)/shop/deal/[id]/page';
import TermsPage from '@/app/terms/page';
import PrivacyPage from '@/app/privacy/page';

function contains(node: ReactNode, type: unknown): boolean {
  if (isValidElement(node)) {
    if (node.type === type) return true;
    return Children.toArray((node as ReactElement<{ children?: ReactNode }>).props.children).some((child) => contains(child, type));
  }
  return false;
}

describe('route metadata', () => {
  it('gives each app screen its own title', () => {
    expect([shopMeta.title, planMeta.title, pantryMeta.title, dealMeta.title]).toEqual(['Shop — PantryBot', 'Plan — PantryBot', 'Pantry — PantryBot', 'Deal Detail — PantryBot']);
  });

  it('lets the page extend under the status bar and home indicator', () => {
    expect(viewport.viewportFit).toBe('cover');
  });
});

describe('the site footer', () => {
  it('is not in the root layout, so the app screens do not show it', () => {
    const tree = RootLayout({ children: 'page' });
    expect(contains(tree, AppFooter)).toBe(false);
  });

  it('is rendered by the static pages, through the document shell (the legal pages) or directly', () => {
    expect(contains(TermsPage(), DocumentShell)).toBe(true);
    expect(contains(PrivacyPage(), DocumentShell)).toBe(true);
    expect(contains(DocumentShell({ label: 'Legal', badge: null, title: 'T', dates: 'D', children: null }), AppFooter)).toBe(true);
  });
});
