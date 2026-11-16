import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cx, focusRing } from './cx';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label' | 'children'> {
  /** Accessible name. Required: an icon alone has no name. */
  label: string;
  icon: ReactNode;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, icon, className, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      {...rest}
      ref={ref}
      type={type}
      aria-label={label}
      className={cx(
        'inline-flex size-touch items-center justify-center rounded-control text-ink disabled:opacity-50',
        focusRing,
        className,
      )}
    >
      <span aria-hidden="true" className="inline-flex">{icon}</span>
    </button>
  );
});
