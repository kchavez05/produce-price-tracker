# App Structure and Module Map

How the app screens are organized since the v2.0 M3 dashboard decomposition ([#701](https://github.com/kchavez05/produce-price-tracker/issues/701), plan in [`docs/specs/v2.0-m3-dashboard-decomposition.md`](../specs/v2.0-m3-dashboard-decomposition.md)). The old single `MealPrepDashboard` component is gone; the app is a route group, one provider and three modules.

## Routes

| Path | What it is | Where it lives |
|---|---|---|
| `/` | Redirects to the last-used module (Shop on a first visit or an unknown cookie). Reads the `pantrybot_last_module` cookie. | `src/app/page.tsx` |
| `/shop` | The Shop module: **Board**, **Trip** (shopping list and cart bridge) and **Radar** are views of this one route. | `src/app/(app)/shop/page.tsx` renders `src/modules/shop/ShopPage.tsx` |
| `/plan` | The Plan module: the 3-dish meal prep plan, the AI request, blueprints. | `src/app/(app)/plan/page.tsx` renders `src/modules/plan/PlanPage.tsx` |
| `/pantry` | The Pantry module: the private Virtual Pantry as a page. | `src/app/(app)/pantry/page.tsx` renders `src/modules/pantry/PantryDrawer.tsx` |
| `/welcome` | First-run setup (v2.0 M4-2b): step 1 ZIP and stores, step 2 optional food preferences, skippable with today's defaults. Not a tab, no chrome. | `src/app/(app)/welcome/page.tsx` renders `src/modules/welcome/WelcomePage.tsx` |
| `/settings` | Account and Settings (v2.0 M4-2a): location, stores, meal prep preferences, appearance, account and sync, weekly digest preview, about links. Not a tab. | `src/app/(app)/settings/page.tsx` renders `src/modules/settings/SettingsPage.tsx` |

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
| Shell (`useShellContext`) | the module (from the URL), the toast, the ZIP, stores, alerts and account dialogs, the cron digest state, `navigateTo` and the other shell actions | `useShellUi`, `useShellActions` |

Hook sources are `src/modules/*/hooks/`. Two things to know:

- The contexts are not memoized: every value is rebuilt on each provider render, and handlers are plain functions recreated each render. A context therefore does not isolate re-renders yet. Making actions stable would change closure semantics and needs its own measured change.
- The customAiDishes choice (Plan) feeds the active trio, which feeds the shopping list (Shop) and the tab counts. That is why the derived chain lives in the provider above both modules, not inside either.

## Modules

Components are stateless views over the context hooks. Only page-level configuration (the three Pantry flags `speechConfigured`, `barcodeEnabled`, `cameraEnabled`, read on the server) and genuinely presentational input (such as `PrintSlip`'s display props) are props.

| Module | Folder | Components |
|---|---|---|
| Shell (chrome around every page) | `src/modules/shell/` | `AppShell` (frame, header, toast, panels), `HeaderPrimary` (brand and account avatar), `PrimaryNavigation` (the tabs), `ZipPanel`, `StoresPanel`, `AlertsPanel`, `AccountDialog` (adapter) and `AccountModal`, `AppLink`, `app-router.tsx`, `navigation.ts` |
| Shop | `src/modules/shop/` | `ShopPage`, `ShopHeader` (location and freshness lines), `ShopFilters` (store and sort sheet), `FreshnessDetails`, `ShopViewNav` (Deals, Trip with its count, Radar), `BoardAlerts`, `BoardControls`, `BoardLeaderboard`, `DealCard`, `DealActions`, `DealDetailView`, `DealDetails`, `TripSection`, `PrintSlip`, `RadarSection`, `badges.tsx` |
| Plan | `src/modules/plan/` | `PlanPage`, `PlanHeader`, `PlanDishes`, `PlanBlueprints` |
| Welcome | `src/modules/welcome/` | `WelcomePage` (each choice calls the action Settings or the Plan calls; the setup-completed marker is the only new key) |
| Settings | `src/modules/settings/` | `SettingsPage` (every control calls an action an old control called; Location, My Stores, the weekly digest and the account dialog open in place under their row) |
| Pantry | `src/modules/pantry/` | `PantryDrawer` (adapter: reads the contexts, renders `VirtualPantry`) and `VirtualPantry` (props-driven, tested on its own) |

## The app frame (M4-1b)

`AppShell` is the frame of every app screen: a sticky header (the brand and the account avatar, padded with `env(safe-area-inset-top)` because the root layout sets `viewport-fit=cover`), the navigation, and the page. It uses design tokens (`bg-bg`, `text-ink`, `bg-surface`, `border-border`) and sets `data-ds` on `<html>` after mount, which turns on `color-scheme` and the browser chrome colour; screens below the frame are not tokenized yet, so dark mode is half dark until they are (M4 decision 18). Each screen has a visually hidden `h1` with its name (Shop, Pantry or Plan), the brand is not a heading, and each route has its own title (`Shop — PantryBot`). The header is `relative` on the Pantry, whose heading is scrolled to the top of the view. The temporary ZIP, Smart Alerts, store-filter and pins-summary controls that used to sit at the top of the page, with their panels, were removed in M4-3a (M4 decision 19): location, stores and the weekly digest are in Settings, and the store filter and sort order in the Shop's Filters sheet. What is left above a tab's page is the toast and the account dialog that the AI sign-in prompts open (until M4-6). The site footer is not on app screens; the static pages (`/privacy`, `/terms`, `/docs`, `/data`, `/design`) render `AppFooter` themselves.

## Settings (M4-2a)

`/settings` is a module (`moduleOfPath`, `Destination` and `MODULE_PATHS` know it) but not a tab (`TabModule` is the three tabs). No tab is current there, it has a visible `h1` ("Account and Settings") instead of the visually hidden tab title, and `AppShell` neither writes the last-used-module cookie for it nor renders the page-top controls, panels and account dialog (the Settings page renders those components itself, in place under their rows). `isTabModule` guards the cookie, so `/` never opens Settings. The avatar in the header is a link to it, and Back returns to the tab the user came from (`lastTab` in the Shell context, set by `AppShell` on every tab change; Shop returns to the Shop view it was left on). Location, My Stores, the meal prep controls (macro goal, dietary rules, cookware, default servings), Appearance (`useTheme`), sign-in, sync status, AI features and the weekly digest call the same context actions as before, so no sync, ownership or storage code changed. The ZIP and alerts controls on the other screens are temporary and stay until the Shop redesign (M4 decision 19).

## First-run setup (M4-2b)

`AppShell` decides once, after mount (`decideFirstRun`, `src/modules/shell/first-run.ts`), whether a device has never been set up. It has not when there is no signed-in account (the one the server resolved for the request, which `pantryAccountId` holds until the sync state loads) and none of these exist in storage: the setup-completed marker (`pantrybot_setup_completed_v20`, the one new key), the ZIP, active stores and nutrition profile keys, a guest pantry with entries (the empty guest pantry key the app creates on first load does not count), the shopping checklist and clipped coupons. Then it `replace`s the path with `/welcome`, so Back does not loop. A signed-in user is never sent there and is marked as set up; unreadable storage never forces setup. `/welcome` shows no header or navigation; step 1 saves a typed ZIP (`handleZipSubmit`) and each store choice (`handleToggleActiveStore`), step 2 each dietary and macro choice, as the user makes them, so nothing is lost on a reload; Skip and Finish write the marker and `replace` the path with `/shop`. A guest's choices stay on the device and sync on sign-in through the existing path. `AppRouter` gained `replace` for this. Tests mount a device as already set up unless they pass `firstRun`.

## The Shop's status lines and Filters (M4-3a)

`ShopPage` opens with `ShopHeader`: a read-only location line (city and store count, with a link to Settings, M4 decision 4) and one freshness line (the planning cycle, when the page was updated, and "some prices are estimates" when any are). Details opens `FreshnessDetails` in a sheet with the full disclosure that was in the old header box (#828): estimates are not confirmed specials, the refresh and retrieval times and the Flipp, Kroger and USDA status. While a refetch is in flight the freshness line reads "Updating prices…" and the page is marked `aria-busy` and dimmed. That comes from `refreshing` on the Dashboard context, a counter in `useDashboardPayload` that is raised when `syncDashboard` starts and lowered in a `finally`; it changes nothing the function sends, applies or discards (the ownership guard is untouched). The store filter and the Deals sort order are behind a Filters button (`ShopFilters`), calling the same `handleStoreChange` and `setSortMode` as before; the sort only shows on the Deals view. The Trip link carries the number of items on the trip. The ZIP, store and alerts controls that used to sit above this page are gone (they are in Settings).

The Deals view (M4-3a) is, in order: the category chips (`BoardControls`: All, Meat, Produce, Dairy; the sort order is only in the Filters sheet), one Stock-Up Alert (`BoardAlerts`, the deepest discount among the stock-up deals) and the list (`BoardLeaderboard`). The list shows 12 deals at a time with "Show 12 more" and "Showing N of M deals"; `ShopPage` keys it on the category, sort and store filter so choosing another starts again at the first 12, while pinning a deal does not. Each deal is a `DealCard`: store, discount, the name (a link to Deal Detail), price and what it was, the club comparison when it wins, and the shared `DealActions` ("Pin to Prep" primary, "Have it" as a quiet toggle with `aria-pressed`, and the "Buy 2: Prep 1, Freeze 1" action when eligible). **Deal Detail** (`DealDetailView`) is the Shop at its own path, `/shop/deal/<ingredient id>` (`pathOf` and `dealIdOfPath` in `navigation.ts`; the route is `src/app/(app)/shop/deal/[id]/page.tsx`, titled "Deal Detail"): the deal's headline, the same actions, and `DealDetails` (value score, deal conditions, both stores' prices, the club comparison, the cycle signal and substitution, the USDA note and the six-week history). Below 1024 px it is a screen with a Back link to Deals and the list column is hidden; from 1024 px the Deals view is two columns, the list (380 px) and the selected deal as a pane, with a short prompt in the pane until a deal is chosen (the `wide:` variant; no Back link there). The deal is looked up among all deals by id, not the filtered list, so a category or store filter does not hide the deal that is open; an id that is not there shows "This deal is not available" with a way back. `navigateTo` changes the URL for a deal, and when leaving one for any other Shop destination (the URL is otherwise unchanged within a module). When nothing matches, the list shows an empty state (Open Settings, or Show all categories when a category left nothing). When a refetch fails (a network error or a non-OK response) `useDashboardPayload` sets `refreshFailed` and the Shop shows "Could not update prices" over the prices it already has, with Try again; the next success or request clears it.

## Navigation

- **The URL is the source of truth for the module** (`moduleOfPath`, `src/modules/shell/navigation.ts`). `navigateTo(destination)` (Shell context) is the one way the app moves: it sets the Shop view for a Shop destination and pushes a path only when the module changes. `AppLink` (`src/modules/shell/AppLink.tsx`) is a real `<a href>` that calls it and leaves modified and non-primary clicks (a new tab, a copy) to the browser.
- **Shop views are state, not routes.** The Board, Trip and Radar views live in the Shop context (`shopView`), so they survive a trip to another module and reset on a reload.
- **Three tabs, in the order Shop, Pantry, Plan** (v2.0 M4-1a, `PrimaryNavigation`): a bottom tab bar below 600 px, an icon rail from 600 px and a sidebar from 1024 px (the `medium:` and `wide:` variants in `globals.css`; a viewport 500 px tall or less keeps the compact layout). All three are `AppLink` links built from the `TabBar`, `IconRail` and `Sidebar` primitives, and only the one for the current width is displayed. The Shop tab returns to the Shop view the user left. The Pantry is a tab like the others: it has no Close button and remembers no origin (M4 decision 20).
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
