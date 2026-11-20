import type { ReactNode } from 'react';
import { cx, focusRing } from './cx';

export interface NavItem {
  id: string;
  label: string;
  icon?: ReactNode;
  /** Optional trailing text, such as a count. It is part of the item's accessible name. */
  badge?: ReactNode;
}

/** What a link renderer receives: everything the item needs except the destination, which the renderer owns. */
export interface NavLinkProps {
  className: string;
  'aria-current'?: 'page';
  children: ReactNode;
}
export type NavLinkRenderer<T extends NavItem> = (item: T, props: NavLinkProps) => ReactNode;

export type NavOrientation = 'horizontal' | 'vertical' | 'rail';

/**
 * Shared by TabBar, IconRail and Sidebar: a labelled nav landmark; the current item uses aria-current. Items are buttons
 * that call onSelect, or, when renderLink is given, whatever element it returns (the app passes real links so navigation
 * stays a link: it can be opened in a new tab and copied).
 */
export function NavList<T extends NavItem>({
  label, items, current, onSelect, renderLink, orientation, className,
}: {
  label: string; items: ReadonlyArray<T>; current: string | null; onSelect?: (id: T['id']) => void;
  renderLink?: NavLinkRenderer<T>; orientation: NavOrientation; className?: string;
}) {
  return (
    <nav aria-label={label} className={className}>
      <ul className={cx('flex', orientation === 'horizontal' ? 'flex-row justify-around' : 'flex-col gap-1')}>
        {items.map((item) => {
          const active = item.id === current;
          const itemClass = cx(
            'flex min-h-touch w-full items-center justify-center gap-1 rounded-control px-3 text-sm font-semibold',
            orientation === 'horizontal' && 'flex-col py-1 text-xs',
            orientation === 'rail' && 'flex-col py-1 text-xs',
            orientation === 'vertical' && 'flex-row justify-start gap-3',
            active ? 'text-accent' : 'text-muted',
            focusRing,
          );
          const content = (
            <>
              {item.icon && <span aria-hidden="true" className="inline-flex">{item.icon}</span>}
              <span>{item.label}</span>
              {item.badge != null && <span className="text-xs font-normal">{item.badge}</span>}
            </>
          );
          return (
            <li key={item.id} className={orientation === 'horizontal' ? 'flex-1' : undefined}>
              {renderLink ? renderLink(item, { className: itemClass, 'aria-current': active ? 'page' : undefined, children: content }) : (
                <button
                  type="button"
                  aria-current={active ? 'page' : undefined}
                  onClick={() => onSelect?.(item.id)}
                  className={itemClass}
                >
                  {content}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
