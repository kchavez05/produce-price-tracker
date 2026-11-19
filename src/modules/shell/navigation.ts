// v2.0 M3 Phase B.3: where the user is in the app. The URL is the source of truth for the module; the Shop view is state.
//  - module: Shop, Plan or Pantry, derived from the path (/shop, /plan, /pantry).
//  - shopView: which view the Shop module shows (Board, Trip or Radar). It is Shop UI memory, so it survives a trip to
//    another module, as every other piece of view state does (owner decision 1). Shop views stay in-page state, not
//    routes (owner decision, B.3 option A).
//  - The Pantry is a tab of its own (M4-1a): it has no Close button and remembers no origin.
// Components move around with navigateTo (Shell context) or an AppLink; both end in the same place.
export type AppModule = 'shop' | 'plan' | 'pantry';
export type ShopView = 'BOARD' | 'SHOPPING_LIST' | 'RADAR';
export type Destination = { module: 'shop'; view: ShopView } | { module: 'plan' } | { module: 'pantry' };

export const MODULE_PATHS: Record<AppModule, string> = { shop: '/shop', plan: '/plan', pantry: '/pantry' };

export function pathOf(destination: Destination): string {
  return MODULE_PATHS[destination.module];
}

/** The module a path belongs to. Anything that is not a module path (including "/") counts as Shop, the default. */
export function moduleOfPath(pathname: string): AppModule {
  const first = pathname.split('/')[1];
  return first === 'plan' || first === 'pantry' ? first : 'shop';
}

/** The last-used-module cookie (owner decision 10): the module name only, no personal data. */
export const LAST_MODULE_COOKIE = 'pantrybot_last_module';
export const LAST_MODULE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function isAppModule(value: unknown): value is AppModule {
  return value === 'shop' || value === 'plan' || value === 'pantry';
}

/** Where "/" goes: the last-used module, or Shop for a first visit, a bad value or no cookie. */
export function lastModulePath(cookieValue: string | undefined): string {
  return isAppModule(cookieValue) ? MODULE_PATHS[cookieValue] : MODULE_PATHS.shop;
}
