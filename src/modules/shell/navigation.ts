// v2.0 M3 Phase B.3a: where the user is in the app, as two small pieces of state instead of one four-way tab.
//  - module: which module is showing (Shop or Plan; Pantry joins in B.3b).
//  - shopView: which view the Shop module shows (Board, Trip or Radar). It is Shop UI memory, so it survives a trip to
//    another module, as every other piece of view state does (owner decision 1). Shop views stay in-page state, not
//    routes (owner decision, B.3 option A).
// Components move around with navigateTo (Shell context). In B.3c it also changes the URL; callers do not change.
export type AppModule = 'shop' | 'plan';
export type ShopView = 'BOARD' | 'SHOPPING_LIST' | 'RADAR';
export type Destination = { module: 'shop'; view: ShopView } | { module: 'plan' };

/** The four-way tab the current markup is keyed on (Board, Meal Plan, Shopping List, Radar). Goes away with the tab strip in B.3c. */
export type LegacyTab = ShopView | 'MEAL_PLAN';
export function legacyTab(module: AppModule, shopView: ShopView): LegacyTab {
  return module === 'plan' ? 'MEAL_PLAN' : shopView;
}
export function destinationOf(tab: LegacyTab): Destination {
  return tab === 'MEAL_PLAN' ? { module: 'plan' } : { module: 'shop', view: tab };
}
