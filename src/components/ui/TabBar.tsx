import { NavList, type NavItem, type NavLinkRenderer } from './NavItems';
import { cx } from './cx';

export interface TabBarProps<T extends NavItem = NavItem> {
  /** Accessible name of the navigation landmark. */
  label: string;
  items: ReadonlyArray<T>;
  current: T['id'];
  /** Called with the item id when an item is chosen (button items). Not used when renderLink is given. */
  onSelect?: (id: T['id']) => void;
  /** Render each item as a link (or any element) instead of a button. */
  renderLink?: NavLinkRenderer<T>;
  className?: string;
}

/** Bottom navigation for compact widths. Respects the iPhone home-indicator inset. */
export function TabBar<T extends NavItem>({ label, items, current, onSelect, renderLink, className }: TabBarProps<T>) {
  return (
    <NavList
      label={label} items={items} current={current} onSelect={onSelect} renderLink={renderLink} orientation="horizontal"
      className={cx('border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]', className)}
    />
  );
}
