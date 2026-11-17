import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cx, focusRing } from './cx';

export interface ChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-pressed'> {
  /** When provided the chip is a toggle and exposes aria-pressed. */
  selected?: boolean;
}

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  { selected, className, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      {...rest}
      ref={ref}
      type={type}
      aria-pressed={selected}
      className={cx(
        'inline-flex min-h-touch items-center rounded-control px-3 text-sm font-semibold disabled:opacity-50',
        focusRing,
        selected ? 'bg-accent text-on-accent' : 'bg-chip text-ink',
        className,
      )}
    />
  );
});
