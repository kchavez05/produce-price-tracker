# App Structure and Module Map

How the app screens are organized since the v2.0 M3 dashboard decomposition ([#701](https://github.com/kchavez05/produce-price-tracker/issues/701), plan in [`docs/specs/v2.0-m3-dashboard-decomposition.md`](../specs/v2.0-m3-dashboard-decomposition.md)). The old single `MealPrepDashboard` component is gone; the app is a route group, one provider and three modules.

## Routes

| Path | What it is | Where it lives |
|---|---|---|
| `/` | Redirects to the last-used module (Shop on a first visit or an unknown cookie). Reads the `pantrybot_last_module` cookie. | `src/app/page.tsx` |
| `/shop` | The Shop module: **Board**, **Trip** (shopping list and cart bridge) and **Radar** are views of this one route. | `src/app/(app)/shop/page.tsx` renders `src/modules/shop/ShopPage.tsx` |
| `/plan` | The Plan module: the 3-dish meal prep plan, the AI request, blueprints. | `src/app/(app)/plan/page.tsx` renders `src/modules/plan/PlanPage.tsx` |
| `/pantry` | The Pantry module: the private Virtual Pantry as a page. | `src/app/(app)/pantry/page.tsx` renders `src/modules/pantry/PantryDrawer.tsx` |

`/privacy`, `/terms`, `/docs`, `/data`, `/design` and `/api-docs` are outside the `(app)` group: they do not mount the provider.

The `(app)` layout (`src/app/(app)/layout.tsx`) is a server component. It loads the inventory and the first dashboard payload once (`force-dynamic`), derives the account id (a guest profile maps to `null`), and mounts `NextAppRouter`, `AppProvider` and `AppShell` around the page. Next.js layouts persist across client navigations, so moving between modules keeps every piece of state, the pantry and sync queues, and any request in flight.

## One provider, seven contexts

`AppProvider` (`src/modules/shell/AppProvider.tsx`) is the one place the app's hooks are composed, in a fixed order (the order matters: effects run price clock, then the AI fence, then the mount restore). It renders no markup of its own and exposes seven contexts (`src/modules/shell/app-context.tsx`), each read through a narrow hook that throws a clear error outside the provider:

| Context (hook) | Holds | Built from |
|---|---|---|
| Preferences (`usePreferencesContext`) | store filter, pins, servings, macro goal, dietary rules, vessel, active stores, and their actions (pin, servings, store change, clear filters) | `usePreferencesState`, `usePreferenceActions` |
| Location (`useLocationContext`) | ZIP, the ZIP panel state, ZIP submit | `useLocationState`, `usePreferenceActions` |
| Dashboard (`useDashboardContext`) | the ranked data and the derived chain (`data`, filtered commodities, active trio, totals, shopping plan, resolved items, coupon items), `serverData`, `syncDashboard` | `useDashboardPayload`, `useDerivedDashboard` |
| Account (`useAccountContext`) | `userSync`, the private pantry, owner refs, saved library, effective on-hand ids, `canUseAi` | `useAccountAndPantry` (wraps `useUserSync` and `usePantry`) |
| Plan (`usePlanContext`) | the AI request, banner, generated plan, expanded dishes, "show all blueprints", and the AI plan, standard-suggestions, promote and save-recipe actions | `usePlanUi`, `usePlanActions` |
| Shop (`useShopContext`) | the Shop view, category and sort, trip mode, checklist, clipped coupons, copied and print-slip flags, and their handlers | `useShopUi`, `useShopCopyAction` |
| Shell (`useShellContext`) | the module (from the URL), the toast, the ZIP, stores, alerts and account dialogs, the cron digest state, `navigateTo`, `closePantry` and the other shell actions | `useShellUi`, `useShellActions` |

Hook sources are `src/modules/*/hooks/`. Two things to know:

- The contexts are not memoized: every value is rebuilt on each provider render, and handlers are plain functions recreated each render. A context therefore does not isolate re-renders yet. Making actions stable would change closure semantics and needs its own measured change.
- The customAiDishes choice (Plan) feeds the active trio, which feeds the shopping list (Shop) and the tab counts. That is why the derived chain lives in the provider above both modules, not inside either.

## Modules

Components are stateless views over the context hooks. Only page-level configuration (the three Pantry flags `speechConfigured`, `barcodeEnabled`, `cameraEnabled`, read on the server) and genuinely presentational input (such as `PrintSlip`'s display props) are props.

| Module | Folder | Components |
|---|---|---|
| Shell (chrome around every page) | `src/modules/shell/` | `AppShell` (header, filters, notices, toast, panels), `HeaderPrimary`, `StoreFilterBar`, `FreshnessNotice`, `PrimaryNav`, `ZipPanel`, `StoresPanel`, `AlertsPanel`, `AccountDialog` (adapter) and `AccountModal`, `AppLink`, `app-router.tsx`, `navigation.ts` |
| Shop | `src/modules/shop/` | `ShopPage`, `BoardAlerts`, `BoardControls`, `BoardLeaderboard`, `TripSection`, `PrintSlip`, `RadarSection`, `badges.tsx` |
| Plan | `src/modules/plan/` | `PlanPage`, `PlanHeader`, `PlanDishes`, `PlanBlueprints` |
| Pantry | `src/modules/pantry/` | `PantryDrawer` (adapter: reads the contexts, renders `VirtualPantry`) and `VirtualPantry` (props-driven, tested on its own) |

## Navigation

- **The URL is the source of truth for the module** (`moduleOfPath`, `src/modules/shell/navigation.ts`). `navigateTo(destination)` (Shell context) is the one way the app moves: it sets the Shop view for a Shop destination, remembers where the Pantry was opened from, and pushes a path only when the module changes. `AppLink` (`src/modules/shell/AppLink.tsx`) is a real `<a href>` that calls it and leaves modified and non-primary clicks (a new tab, a copy) to the browser.
- **Shop views are state, not routes.** The Board, Trip and Radar views live in the Shop context (`shopView`), so they survive a trip to another module and reset on a reload.
- **The Pantry remembers its origin** (`pantryReturn`, Shell context) so its Close button returns to the module and Shop view it was opened from. The header Pantry control is a link to `/pantry`; it does not toggle.
- **The router seam.** `src/modules/shell/app-router.tsx` is the only file that imports `next/navigation`. The hooks read a small `AppRouter` (`pathname`, `push`), which `NextAppRouter` provides in production. Tests supply an in-memory router instead, so no test mocks Next.
- **Last-used module.** `AppShell` writes `pantrybot_last_module=<shop|plan|pantry>` (`Path=/`, one year, `SameSite=Lax`, `Secure` on https) on every module change; `/` validates it against the three names and redirects. The cookie holds the module name only.

## What survives navigation

Everything in the provider survives a module change, including the pantry and account data, preferences, the Shop and Plan view state, the toast and dialogs, and requests in flight (a refetch started on one page is applied after the user has moved on). The Pantry page's own component-local state (the search text, an open add or edit form, the import and legacy previews) is not in a context and is dropped when you leave the Pantry (owner decision, option a); saved entries are unaffected. State that was never persisted locally (pins, servings, the store filter) still resets on a reload; the five `localStorage` keys (`mead_checked_items_v03`, `mead_clipped_coupons_v03`, `pantrybot_nutrition_profile_v12`, `pantrybot_active_stores`, `pantrybot_user_zip`) are restored in one post-mount effect so the first render matches the server render.

## Ownership and sync stay in the provider

The pantry owner refs, the `syncAcknowledged` wiring, the AI request fence and `syncDashboard` (with its guard that discards a response only when a known owner changed in flight) live in `AppProvider` and its hooks, never in a page or route component. A request in flight must survive a module switch, and a late response must still be dropped when the owner or the plan context changed. See [Code Review Rules](../code-review.md#app-structure-providers-and-extractions-v20-m3).

## Tests that cover it

- **Tier 1 (jsdom):** `tests/helpers/app-under-test.ts` mounts the same pieces the route group does (layout chrome and the page for a path) through an in-memory router; `tests/helpers/dashboard-harness.ts` builds on it with a stubbed fetch, a fixed clock and the keyless payload. `dashboard-golden-html` pins the rendered markup for 13 states; `dashboard-gaps`, `dashboard-derived`, `dashboard-shop`, `dashboard-plan` and `dashboard-shell` pin behavior; `app-provider`, `module-contexts` and `navigation-model` pin the contexts, each module on its own, and the navigation model; `app-routes`, `next-app-router` and `tests/unit/app/home-redirect.test.ts` pin the routes, the router seam and the redirect.
- **Tier 2 and 3 (Playwright):** `tests/e2e/navigation.spec.ts` covers links without a reload, Back, Forward and reload, the Pantry's return point, the last-used module, and switching module mid-edit with a refetch in flight. Locators go through `tests/e2e/pages/DashboardPage.ts`. See [Testing](./Testing.md).

## Adding to the app

- A new screen that needs the provider goes under `src/app/(app)/`; a static page goes outside it.
- New app state goes into the hook and context of the module that owns it, not into a component. Components read it through the context hooks.
- Navigate with `AppLink` or `navigateTo`; do not import `next/navigation` outside `app-router.tsx`.
