import type { ReactNode } from 'react';
import { NavList, type NavItem } from './NavItems';
import { cx } from './cx';

export interface SidebarProps<T extends NavItem = NavItem> {
  label: string;
  items: ReadonlyArray<T>;
  current: T['id'];
  onSelect: (id: T['id']) => void;
  /** Optional header, such as the app name. */
  header?: ReactNode;
  className?: string;
}

/** Side navigation for regular widths (iPad, desktop). */
export function Sidebar<T extends NavItem>({ label, items, current, onSelect, header, className }: SidebarProps<T>) {
  return (
    <div className={cx('flex w-60 flex-col gap-2 border-r border-border bg-surface p-3', className)}>
      {header}
      <NavList label={label} items={items} current={current} onSelect={onSelect} orientation="vertical" />
    </div>
  );
}
