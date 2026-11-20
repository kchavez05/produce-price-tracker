// v2.0 M3 Phase B.3: where the user is in the app. The URL is the source of truth for the module; the Shop view is state.
//  - module: Shop, Plan, Pantry or Settings, derived from the path (/shop, /plan, /pantry, /settings). The first three are the
//    tabs; Settings is not a tab (M4-2a): no tab is current there, and it is never the last-used module. Welcome (M4-2b, the
//    first-run setup at /welcome) is not a tab either and shows no navigation.
//  - shopView: which view the Shop module shows (Board, Trip or Radar). It is Shop UI memory, so it survives a trip to
//    another module, as every other piece of view state does (owner decision 1). Shop views stay in-page state, not
//    routes (owner decision, B.3 option A).
//  - The Pantry is a tab of its own (M4-1a): it has no Close button and remembers no origin.
// Components move around with navigateTo (Shell context) or an AppLink; both end in the same place.
export type TabModule = 'shop' | 'plan' | 'pantry';
export type AppModule = TabModule | 'settings' | 'welcome';
export type ShopView = 'BOARD' | 'SHOPPING_LIST' | 'RADAR';
// A Shop destination may name a deal (Deal Detail, M4-3a), which is a path of its own: /shop/deal/<ingredient id>. A Pantry
// destination may name an entry (Ingredient Detail, M4-4b): /pantry/item/<entry id>. A Plan destination may name a dish (Dish
// Detail, M4-5b): /plan/dish/<dish id>.
export type Destination = { module: 'shop'; view: ShopView; deal?: string } | { module: 'plan'; dish?: string } | { module: 'pantry'; item?: string } | { module: 'settings' } | { module: 'welcome' };

export const MODULE_PATHS: Record<AppModule, string> = { shop: '/shop', plan: '/plan', pantry: '/pantry', settings: '/settings', welcome: '/welcome' };

export const DEAL_PATH_PREFIX = '/shop/deal/';

export const ITEM_PATH_PREFIX = '/pantry/item/';
export const DISH_PATH_PREFIX = '/plan/dish/';

export function pathOf(destination: Destination): string {
  if (destination.module === 'shop' && destination.deal) return `${DEAL_PATH_PREFIX}${encodeURIComponent(destination.deal)}`;
  if (destination.module === 'pantry' && destination.item) return `${ITEM_PATH_PREFIX}${encodeURIComponent(destination.item)}`;
  if (destination.module === 'plan' && destination.dish) return `${DISH_PATH_PREFIX}${encodeURIComponent(destination.dish)}`;
  return MODULE_PATHS[destination.module];
}

function idAfter(prefix: string, pathname: string): string | null {
  if (!pathname.startsWith(prefix)) return null;
  const raw = pathname.slice(prefix.length).split('/')[0];
  if (!raw) return null;
  try { return decodeURIComponent(raw); } catch { return null; }
}

/** The ingredient id of a Deal Detail path, or null for any other path. */
export function dealIdOfPath(pathname: string): string | null {
  return idAfter(DEAL_PATH_PREFIX, pathname);
}

/** The entry id of an Ingredient Detail path (the Pantry), or null for any other path. */
export function itemIdOfPath(pathname: string): string | null {
  return idAfter(ITEM_PATH_PREFIX, pathname);
}

/** The dish id of a Dish Detail path (the Plan), or null for any other path. */
export function dishIdOfPath(pathname: string): string | null {
  return idAfter(DISH_PATH_PREFIX, pathname);
}

/** The module a path belongs to. Anything that is not a module path (including "/") counts as Shop, the default. */
export function moduleOfPath(pathname: string): AppModule {
  const first = pathname.split('/')[1];
  return first === 'plan' || first === 'pantry' || first === 'settings' || first === 'welcome' ? first : 'shop';
}

/** The last-used-module cookie (owner decision 10): the module name only, no personal data. */
export const LAST_MODULE_COOKIE = 'pantrybot_last_module';
export const LAST_MODULE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/** A tab: the only modules the last-used-module cookie may name. */
export function isTabModule(value: unknown): value is TabModule {
  return value === 'shop' || value === 'plan' || value === 'pantry';
}

/** Where "/" goes: the last-used module, or Shop for a first visit, a bad value or no cookie. */
export function lastModulePath(cookieValue: string | undefined): string {
  return isTabModule(cookieValue) ? MODULE_PATHS[cookieValue] : MODULE_PATHS.shop;
}
