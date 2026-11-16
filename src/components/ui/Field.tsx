import type { ReactNode } from 'react';
import { cx } from './cx';

export interface FieldChrome {
  label: string;
  hint?: string;
  error?: string;
}

/** ids and aria wiring shared by TextField and Select. */
export function fieldIds(id: string, { hint, error }: Pick<FieldChrome, 'hint' | 'error'>) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  return { hintId, errorId, describedBy };
}

export function FieldShell({ id, label, hint, error, children, className }: FieldChrome & { id: string; children: ReactNode; className?: string }) {
  const { hintId, errorId } = fieldIds(id, { hint, error });
  return (
    <div className={cx('flex flex-col gap-1', className)}>
      <label htmlFor={id} className="text-sm font-semibold text-ink">{label}</label>
      {children}
      {hint && <p id={hintId} className="text-sm text-muted">{hint}</p>}
      {error && <p id={errorId} className="text-sm font-semibold text-danger">{error}</p>}
    </div>
  );
}

/** Control boundary: the strong border token (3:1), never the decorative one. */
export const controlBox =
  'min-h-touch w-full rounded-control border border-border-strong bg-surface px-3 text-base text-ink disabled:opacity-50 aria-[invalid=true]:border-danger';
