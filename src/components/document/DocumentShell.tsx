import type { ReactNode } from 'react';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui';
import AppFooter from '@/components/AppFooter';
import TokenScope from '@/design/TokenScope';
import BackLink from './BackLink';

// v2.0 M4-8a (spec decision 7): the one shell for the document pages. A header with Back and a short label, a readable measure (a 3xl
// column), the article in a card with its badge, title and dates, and the site footer, all on the design tokens so the page follows the theme.
// `TokenScope` opts the page into the token color scheme until the root layout adopts the tokens (M4-10). The legal pages use it now; the
// docs page joins in M4-8b.
interface DocumentShellProps {
  /** The short label in the header ("Legal"). */
  label: string;
  /** The badge above the title: an element built with `Badge`. */
  badge: ReactNode;
  title: string;
  /** The effective and updated dates line. */
  dates: string;
  children: ReactNode;
}

export default function DocumentShell({ label, badge, title, dates, children }: DocumentShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-bg text-ink">
      <TokenScope />
      <header className="no-print border-b border-border bg-surface pt-[env(safe-area-inset-top)]">
        <div className="mx-auto grid max-w-3xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-1.5">
          <BackLink />
          <p className="text-base font-bold">{label}</p>
          <span aria-hidden="true" />
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:py-10">
        <Card as="article" className="p-6 sm:p-10">
          <header className="border-b border-border pb-6">
            {badge}
            <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
            <p className="mt-1.5 text-sm text-muted">{dates}</p>
          </header>
          <div className="mt-6 space-y-6 text-base leading-relaxed text-ink">{children}</div>
        </Card>
      </main>
      <AppFooter />
    </div>
  );
}

export function DocSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  );
}

/** A highlighted disclaimer: the title in the warning color, the text in ink on the warning background. */
export function DocCallout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-card bg-warning-bg p-4 text-ink">
      <h2 className="flex items-center gap-2 text-base font-bold text-warning">
        <AlertCircle aria-hidden="true" className="size-4 shrink-0" />
        <span>{title}</span>
      </h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed">{children}</div>
    </section>
  );
}

export function DocList({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-1.5 pl-5">{children}</ul>;
}

export function InlineCode({ children }: { children: ReactNode }) {
  return <code className="rounded-pill bg-chip px-1.5 py-0.5 text-sm">{children}</code>;
}

const linkClass = 'font-semibold text-accent underline underline-offset-2';

/** An in-app link (a Link), or an external or mail link (an anchor). */
export function DocLink({ href, children }: { href: string; children: ReactNode }) {
  return href.startsWith('/') ? <Link href={href} className={linkClass}>{children}</Link> : <a href={href} className={linkClass}>{children}</a>;
}
