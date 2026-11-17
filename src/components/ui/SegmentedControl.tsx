import { useId } from 'react';
import { cx } from './cx';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  /** Accessible name of the group. */
  label: string;
  options: ReadonlyArray<SegmentOption<T>>;
  value: T;
  onChange: (value: T) => void;
  name?: string;
  className?: string;
}

/**
 * Native radio group styled as segments, so arrow keys, roving focus and screen reader
 * semantics come from the platform. Segments are identified by their text; the track fill is subtle.
 */
export function SegmentedControl<T extends string>({ label, options, value, onChange, name, className }: SegmentedControlProps<T>) {
  const generated = useId();
  const group = name ?? generated;
  return (
    <div role="radiogroup" aria-label={label} className={cx('inline-flex gap-0.5 rounded-control bg-chip p-0.5', className)}>
      {options.map((option) => (
        <label
          key={option.value}
          className="relative flex min-h-touch min-w-touch cursor-pointer items-center justify-center rounded-[8px] px-3 text-sm font-semibold text-ink has-[:checked]:bg-surface has-[:checked]:shadow-card has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus"
        >
          <input
            type="radio"
            name={group}
            value={option.value}
            checked={option.value === value}
            onChange={() => onChange(option.value)}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}
