import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { cx, focusRing } from './cx';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'aria-label'> {
  label: string;
}

/** The whole row is the 44px target; the label is part of the control. */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, id, className, ...rest },
  ref,
) {
  const generated = useId();
  const inputId = id ?? generated;
  return (
    <div className={cx('flex min-h-touch items-center gap-3', className)}>
      <input
        {...rest}
        ref={ref}
        id={inputId}
        type="checkbox"
        className={cx('size-5 shrink-0 accent-accent disabled:opacity-50', focusRing)}
      />
      <label htmlFor={inputId} className="flex min-h-touch flex-1 items-center text-base text-ink">{label}</label>
    </div>
  );
});
