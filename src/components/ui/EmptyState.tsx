import type { ReactNode } from 'react';
import { cx } from './cx';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  /** Typically a Button. */
  action?: ReactNode;
  headingLevel?: 2 | 3;
  className?: string;
}

export function EmptyState({ title, description, icon, action, headingLevel = 2, className }: EmptyStateProps) {
  const Heading = `h${headingLevel}` as 'h2' | 'h3';
  return (
    <div className={cx('flex flex-col items-center gap-2 px-4 py-8 text-center', className)}>
      {icon && <span aria-hidden="true" className="text-muted">{icon}</span>}
      <Heading className="text-lg font-bold text-ink">{title}</Heading>
      {description && <p className="max-w-sm text-sm text-muted">{description}</p>}
      {action}
    </div>
  );
}
