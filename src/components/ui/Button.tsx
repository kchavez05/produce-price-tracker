import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cx, focusRing } from './cx';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'destructive';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Shows a spinner, sets aria-busy and blocks activation. The label stays visible. */
  loading?: boolean;
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-on-accent',
  secondary: 'bg-surface text-ink border border-border-strong',
  quiet: 'bg-transparent text-accent',
  destructive: 'bg-transparent text-danger',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', loading = false, disabled, className, type = 'button', children, ...rest },
  ref,
) {
  return (
    <button
      {...rest}
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        'inline-flex min-h-touch items-center justify-center gap-2 rounded-control px-4 text-base font-semibold disabled:opacity-50',
        focusRing,
        variants[variant],
        className,
      )}
    >
      {loading && <Loader2 aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />}
      {children}
    </button>
  );
});
