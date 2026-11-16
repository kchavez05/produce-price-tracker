import type { HTMLAttributes } from 'react';
import { cx } from './cx';

export type BadgeTone = 'neutral' | 'accent' | 'save' | 'warning' | 'danger';

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-chip text-ink',
  accent: 'bg-accent text-on-accent',
  save: 'bg-save-bg text-save',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
};

/** Status is always carried by the text, never by color alone. */
export function Badge({ tone = 'neutral', className, ...rest }: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return <span {...rest} className={cx('inline-flex items-center rounded-pill px-2 py-0.5 text-xs font-semibold', tones[tone], className)} />;
}
