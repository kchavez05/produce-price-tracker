import { forwardRef, useId, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { FieldShell, controlBox, fieldIds, type FieldChrome } from './Field';
import { cx, focusRing } from './cx';

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'aria-label'>, FieldChrome {}

/** Native select (best on iOS); options are passed as children. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, id, className, children, ...rest },
  ref,
) {
  const generated = useId();
  const selectId = id ?? generated;
  const { describedBy } = fieldIds(selectId, { hint, error });
  return (
    <FieldShell id={selectId} label={label} hint={hint} error={error}>
      <div className="relative">
        <select
          {...rest}
          ref={ref}
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cx(controlBox, focusRing, 'appearance-none pr-10', className)}
        >
          {children}
        </select>
        <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
      </div>
    </FieldShell>
  );
});
