'use client';

import type { MouseEvent, ReactNode, Ref } from 'react';
import { useShellContext } from '@/modules/shell/app-context';
import { pathOf, type Destination } from '@/modules/shell/navigation';

// v2.0 M3 Phase B.3c: a real link (an <a href>, so it opens in a new tab, can be copied and is announced as a link) that
// navigates through the Shell context instead of reloading the page. The Shell's navigateTo also sets the Shop view and
// remembers where the Pantry was opened from. A modified or non-primary click is left to the browser.
interface AppLinkProps {
  to: Destination;
  className?: string;
  title?: string;
  ref?: Ref<HTMLAnchorElement>;
  children?: ReactNode;
}

export default function AppLink({ to, className, title, ref, children }: AppLinkProps) {
  const { navigateTo } = useShellContext();
  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigateTo(to);
  }
  return <a ref={ref} href={pathOf(to)} onClick={onClick} className={className} title={title}>{children}</a>;
}
