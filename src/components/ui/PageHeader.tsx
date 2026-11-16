import type { ReactNode } from 'react';
import { cx } from './cx';

export interface PageHeaderProps {
  /** Title Case, and not a repeat of the tab label (spec section 6a). */
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <header className={cx('flex items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        <h1 className="text-[28px] font-bold leading-tight text-ink">{title}</h1>
        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
