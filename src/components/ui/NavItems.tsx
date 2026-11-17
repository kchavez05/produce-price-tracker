import type { ReactNode } from 'react';
import { cx, focusRing } from './cx';

export interface NavItem {
  id: string;
  label: string;
  icon?: ReactNode;
}

/** Shared by TabBar and Sidebar: a labelled nav landmark; the current item uses aria-current. */
export function NavList<T extends NavItem>({
  label, items, current, onSelect, orientation, className,
}: {
  label: string; items: ReadonlyArray<T>; current: string; onSelect: (id: T['id']) => void;
  orientation: 'horizontal' | 'vertical'; className?: string;
}) {
  return (
    <nav aria-label={label} className={className}>
      <ul className={cx('flex', orientation === 'horizontal' ? 'flex-row justify-around' : 'flex-col gap-1')}>
        {items.map((item) => {
          const active = item.id === current;
          return (
            <li key={item.id} className={orientation === 'horizontal' ? 'flex-1' : undefined}>
              <button
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => onSelect(item.id)}
                className={cx(
                  'flex min-h-touch w-full items-center justify-center gap-1 rounded-control px-3 text-sm font-semibold',
                  orientation === 'horizontal' ? 'flex-col py-1 text-xs' : 'flex-row justify-start gap-3',
                  active ? 'text-accent' : 'text-muted',
                  focusRing,
                )}
              >
                {item.icon && <span aria-hidden="true" className="inline-flex">{item.icon}</span>}
                <span>{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
