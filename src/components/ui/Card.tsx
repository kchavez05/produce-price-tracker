import { forwardRef, type HTMLAttributes } from 'react';
import { cx } from './cx';

export interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: 'div' | 'section' | 'article';
  /** Inner padding; `none` for cards whose children (such as list rows) bring their own. */
  padding?: 'none' | 'normal';
}

export const Card = forwardRef<HTMLElement, CardProps>(function Card(
  { as: Tag = 'div', padding = 'normal', className, ...rest },
  ref,
) {
  return (
    <Tag
      {...rest}
      ref={ref as never}
      className={cx('rounded-card bg-surface text-ink shadow-card', padding === 'normal' && 'p-4', className)}
    />
  );
});
