import { NavList, type NavItem } from './NavItems';
import { cx } from './cx';

export interface TabBarProps<T extends NavItem = NavItem> {
  /** Accessible name of the navigation landmark. */
  label: string;
  items: ReadonlyArray<T>;
  current: T['id'];
  onSelect: (id: T['id']) => void;
  className?: string;
}

/** Bottom navigation for compact widths. Respects the iPhone home-indicator inset. */
export function TabBar<T extends NavItem>({ label, items, current, onSelect, className }: TabBarProps<T>) {
  return (
    <NavList
      label={label} items={items} current={current} onSelect={onSelect} orientation="horizontal"
      className={cx('border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]', className)}
    />
  );
}
