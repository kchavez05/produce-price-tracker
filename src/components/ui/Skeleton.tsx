import { cx } from './cx';

/**
 * Loading placeholder, hidden from assistive tech. Pair a group of skeletons with a
 * VisuallyHidden `role="status"` message so the loading state is still announced.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cx('animate-pulse rounded-control bg-chip motion-reduce:animate-none', className ?? 'h-4 w-full')} />;
}
