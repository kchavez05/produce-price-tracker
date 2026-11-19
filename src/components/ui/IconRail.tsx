import { NavList, type NavItem, type NavLinkRenderer } from './NavItems';
import { cx } from './cx';

export interface IconRailProps<T extends NavItem = NavItem> {
  label: string;
  items: ReadonlyArray<T>;
  current: T['id'];
  /** Called with the item id when an item is chosen (button items). Not used when renderLink is given. */
  onSelect?: (id: T['id']) => void;
  /** Render each item as a link (or any element) instead of a button. */
  renderLink?: NavLinkRenderer<T>;
  className?: string;
}

/** Narrow side navigation for medium widths (iPad portrait, iPad mini): the icon with its label beneath. */
export function IconRail<T extends NavItem>({ label, items, current, onSelect, renderLink, className }: IconRailProps<T>) {
  return (
    <NavList
      label={label} items={items} current={current} onSelect={onSelect} renderLink={renderLink} orientation="rail"
      className={cx('w-20 border-r border-border bg-surface p-2', className)}
    />
  );
}
