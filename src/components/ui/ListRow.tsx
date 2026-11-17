import type { HTMLAttributes, ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { cx, focusRing } from './cx';

/** Divided list container; use with ListRow. */
export function List({ className, ...rest }: HTMLAttributes<HTMLUListElement>) {
  return <ul {...rest} className={cx('divide-y divide-border', className)} />;
}

export interface ListRowProps {
  title: string;
  subtitle?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  /** Makes the whole row a button (and shows a chevron unless `trailing` is given). */
  onClick?: () => void;
  className?: string;
}

export function ListRow({ title, subtitle, leading, trailing, onClick, className }: ListRowProps) {
  const body = (
    <>
      {leading && <span aria-hidden="true" className="inline-flex shrink-0">{leading}</span>}
      <span className="flex min-w-0 flex-1 flex-col text-left">
        <span className="text-base text-ink">{title}</span>
        {subtitle && <span className="text-sm text-muted">{subtitle}</span>}
      </span>
      {trailing ?? (onClick && <ChevronRight aria-hidden="true" className="size-4 text-muted" />)}
    </>
  );
  const row = 'flex min-h-touch w-full items-center gap-3 py-2';
  return (
    <li className={className}>
      {onClick ? (
        <button type="button" onClick={onClick} className={cx(row, 'rounded-control', focusRing)}>{body}</button>
      ) : (
        <div className={row}>{body}</div>
      )}
    </li>
  );
}
