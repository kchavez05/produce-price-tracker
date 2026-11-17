import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { FieldShell, controlBox, fieldIds, type FieldChrome } from './Field';
import { cx, focusRing } from './cx';

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'aria-label'>, FieldChrome {}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hint, error, id, className, ...rest },
  ref,
) {
  const generated = useId();
  const inputId = id ?? generated;
  const { describedBy } = fieldIds(inputId, { hint, error });
  return (
    <FieldShell id={inputId} label={label} hint={hint} error={error}>
      <input
        {...rest}
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cx(controlBox, focusRing, className)}
      />
    </FieldShell>
  );
});
