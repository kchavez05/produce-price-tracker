'use client';

import type { MouseEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

// v2.0 M4-8a: the Back link of the document pages (legal, docs). They are reached from many places (Settings About, the sign-in sheet's
// agreement line, the footer of the other static pages), so Back returns to the previous page when there is one, and goes to Settings when
// the page was opened on its own (a new tab or a typed address). Modified clicks are left to the browser.
export default function BackLink({ fallback = '/settings' }: { fallback?: string }) {
  const router = useRouter();
  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (window.history.length > 1) {
      event.preventDefault();
      router.back();
    }
  }
  return (
    <Link
      href={fallback}
      onClick={onClick}
      className="inline-flex min-h-touch items-center gap-1 justify-self-start rounded-control text-base font-semibold text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      <ChevronLeft aria-hidden="true" className="size-5" />
      <span>Back</span>
    </Link>
  );
}
