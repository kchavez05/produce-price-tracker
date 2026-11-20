import type { ReactNode } from 'react';
import { NavList, type NavItem, type NavLinkRenderer } from './NavItems';
import { cx } from './cx';

export interface SidebarProps<T extends NavItem = NavItem> {
  label: string;
  items: ReadonlyArray<T>;
  /** The current item's id, or null when none is current (such as on a screen that is not a tab). */
  current: T['id'] | null;
  /** Called with the item id when an item is chosen (button items). Not used when renderLink is given. */
  onSelect?: (id: T['id']) => void;
  /** Render each item as a link (or any element) instead of a button. */
  renderLink?: NavLinkRenderer<T>;
  /** Optional header, such as the app name. */
  header?: ReactNode;
  className?: string;
}

/** Side navigation for regular widths (iPad, desktop). */
export function Sidebar<T extends NavItem>({ label, items, current, onSelect, renderLink, header, className }: SidebarProps<T>) {
  return (
    <div className={cx('flex w-60 flex-col gap-2 border-r border-border bg-surface p-3', className)}>
      {header}
      <NavList label={label} items={items} current={current} onSelect={onSelect} renderLink={renderLink} orientation="vertical" />
    </div>
  );
}
