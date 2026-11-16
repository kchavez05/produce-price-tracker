'use client';

import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';
import { cx } from './cx';

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  /** Accessible name and visible heading. */
  title: string;
  children: ReactNode;
  /** `sheet` slides from the bottom on compact widths; `dialog` is centered. */
  variant?: 'sheet' | 'dialog';
  /** Element to focus on open; defaults to the first focusable element, else the panel. */
  initialFocusRef?: RefObject<HTMLElement | null>;
  closeLabel?: string;
}

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Modal sheet/dialog, hand-built: `aria-modal`, focus moves in on open, Tab is trapped,
 * Escape and backdrop press close, page scroll is locked and focus returns to the opener.
 */
export function Sheet({ open, onClose, title, children, variant = 'sheet', initialFocusRef, closeLabel = 'Close' }: SheetProps) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const target = initialFocusRef?.current ?? panel.current?.querySelector<HTMLElement>(FOCUSABLE) ?? panel.current;
    target?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      if (opener && opener.isConnected) opener.focus();
    };
  }, [open, initialFocusRef]);

  if (!open || typeof document === 'undefined') return null;

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== 'Tab' || !panel.current) return;
    const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((item) => !item.hidden);
    if (items.length === 0) { event.preventDefault(); panel.current.focus(); return; }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === panel.current)) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && active === last) { event.preventDefault(); first.focus(); }
  }

  return createPortal(
    <div
      className={cx('fixed inset-0 z-50 flex bg-overlay', variant === 'sheet' ? 'items-end justify-center' : 'items-center justify-center p-4')}
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className={cx(
          'flex max-h-[90vh] w-full max-w-lg flex-col bg-surface text-ink shadow-sheet outline-none',
          variant === 'sheet' ? 'rounded-t-card' : 'rounded-card',
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2">
          <h2 id={titleId} className="text-lg font-bold">{title}</h2>
          <IconButton label={closeLabel} icon={<X className="size-5" />} onClick={onClose} />
        </div>
        <div className="overflow-y-auto p-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
