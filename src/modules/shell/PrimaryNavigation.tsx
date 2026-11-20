'use client';

import type { ReactNode } from 'react';
import { ChefHat, Refrigerator, ShoppingBag } from 'lucide-react';
import { IconRail, Sidebar, TabBar, type NavItem, type NavLinkRenderer } from '@/components/ui';
import { useAccountContext, useShellContext, useShopContext } from '@/modules/shell/app-context';
import AppLink from '@/modules/shell/AppLink';
import { isTabModule, type Destination, type TabModule } from '@/modules/shell/navigation';

// v2.0 M4-1a: the app's final navigation, replacing M3's temporary four-pill strip. Three tabs in the order Shop, Pantry,
// Plan (spec section 3), shown as a bottom tab bar on compact widths, an icon rail on medium widths and a sidebar on wide
// widths (the `medium:` and `wide:` variants in globals.css; a viewport 500 px tall or less keeps the compact layout). All
// three are real links through AppLink, so navigation still goes through navigateTo and a link can be opened in a new tab.
// Only the layout for the current width is displayed; the others are `display: none` and so out of the accessibility tree.
// Shop opens on the view it was left on (Deals, Trip or Radar), as the other state does.

interface ModuleItem extends NavItem { id: TabModule }

function useNavigation() {
  const { module } = useShellContext();
  const { shopView } = useShopContext();
  const { pantry } = useAccountContext();
  const pantryCount = pantry.entries.filter((entry) => entry.available && !entry.deletedAtIso).length;
  const items: ModuleItem[] = [
    { id: 'shop', label: 'Shop', icon: <ShoppingBag className="size-5" /> },
    { id: 'pantry', label: 'Pantry', icon: <Refrigerator className="size-5" />, badge: `(${pantryCount})` },
    { id: 'plan', label: 'Plan', icon: <ChefHat className="size-5" /> },
  ];
  const destination = (id: TabModule): Destination =>
    id === 'shop' ? { module: 'shop', view: shopView } : { module: id };
  const renderLink: NavLinkRenderer<ModuleItem> = (item, props) => (
    <AppLink to={destination(item.id)} {...props} />
  );
  // Settings and Welcome are not tabs, so no tab is current there.
  return { module: isTabModule(module) ? module : null, items, renderLink };
}

/** The icon rail (medium widths) and the sidebar (wide widths): placed before the page content. */
export function SideNavigation(): ReactNode {
  const { module, items, renderLink } = useNavigation();
  return (
    <>
      <div className="no-print sticky top-0 hidden h-screen shrink-0 self-start medium:block wide:hidden">
        <IconRail label="Primary" items={items} current={module} renderLink={renderLink} className="h-full" />
      </div>
      <div className="no-print sticky top-0 hidden h-screen shrink-0 self-start wide:block">
        <Sidebar label="Primary" items={items} current={module} renderLink={renderLink} className="h-full" />
      </div>
    </>
  );
}

/** The bottom tab bar (compact widths): placed after the page content. */
export function BottomNavigation(): ReactNode {
  const { module, items, renderLink } = useNavigation();
  return (
    <div className="no-print fixed inset-x-0 bottom-0 z-40 medium:hidden">
      <TabBar label="Primary" items={items} current={module} renderLink={renderLink} />
    </div>
  );
}
