import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';
import { cx } from './cx';

export type BannerTone = 'info' | 'warning' | 'error';

export interface BannerProps {
  tone?: BannerTone;
  title?: string;
  children: ReactNode;
  /** Adds a dismiss button. */
  onDismiss?: () => void;
  dismissLabel?: string;
  className?: string;
}

const tones: Record<BannerTone, string> = {
  info: 'bg-chip text-ink',
  warning: 'bg-warning-bg text-warning',
  error: 'bg-danger-bg text-danger',
};

/** Errors and warnings interrupt (`role="alert"`); info is announced politely (`role="status"`). */
export function Banner({ tone = 'info', title, children, onDismiss, dismissLabel = 'Dismiss', className }: BannerProps) {
  return (
    <div role={tone === 'info' ? 'status' : 'alert'} className={cx('flex items-start gap-2 rounded-card p-3', tones[tone], className)}>
      <div className="flex-1 text-sm">
        {title && <p className="font-semibold">{title}</p>}
        <div>{children}</div>
      </div>
      {onDismiss && <IconButton label={dismissLabel} icon={<X className="size-4" />} onClick={onDismiss} className="-m-2" />}
    </div>
  );
}
