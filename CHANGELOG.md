# Changelog

All notable changes to **PantryBot** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.3] - 2026-11-13

Deployment, production acceptance and publication receipts: [#722](https://github.com/kchavez05/produce-price-tracker/issues/722). See [release notes](docs/releases/v1.6.3.md).

### Fixed
- Include attributable account sync recovery in browser exports and clear that account’s recovery copies on explicit account deletion.
- Repair a missing application profile from the verified signed-in session without overwriting existing data or acknowledging failed storage writes (#712).

### Changed
- Make Virtual Pantry the only inventory, matching and shopping path; retire legacy Freezer UI/writers and the Pantry rollout flag (#700).
- Return 410 from `/api/freezer` and reject old inventory sync fields with 426 without acknowledgment. Preserve owner-bound queued edits for explicit recovery while ordinary preferences continue syncing.
- Retain original storage, migration archives and data-rights export/delete; update current docs and OpenAPI. No Stage 3 storage deletion or v2.0 UI implementation.

## [1.6.2] - 2026-11-12

Released to production November 12. The maintainer attested that production is functioning as expected; itemized production receipts (regional WAF rule, artifact-bearing deployment, bounded runtime results) are not recorded and are not claimed. See [release notes](docs/releases/v1.6.2.md) and the [rollout plan](docs/releases/v1.6.2-rollout.md).

### Added
- Typed UPC-A/EAN-13 product lookup, source attribution, generic ingredient review/correction and explicit pantry confirmation.
- Deliberate local camera capture with pause/resume, lifecycle cleanup and typed/manual fallback; no camera-frame upload or automatic inventory addition.
- Pinned read-only USDA barcode artifact delivery, integrity/trace checks, recoverable ingress throttling and six connected barcode/pantry smoke cases.

### Changed
- Share static/unpriced staple calculations across current recipes, saved reevaluation and shopping; preserve Yes/No ownership, optional details and exact-unit boundaries.
- Defer new live store API pricing to unscheduled multi-provider scope #689; preserve existing market discovery.
- Correct King Soopers location identities, update reviewed dependencies/security overrides, group routine Dependabot updates, and document the Claude review and issue/release workflow.
- Keep v2.0 wireframes/specifications as planning documents; no v2.0 UI ships through those documents.

### Verification and rollout
- Maintainer accepts limited iOS Safari scanning/key-entry smoke evidence and the unrun remainder of the original #649 pre-release matrix. Unrun Android/account/accessibility cases are not recorded as passed.
- Production barcode controls remain gated by the pinned artifact, production-scoped regional rate limit and exact production acceptance. No release/tag has been published by this preparation.

## [1.6.1] - 2026-11-08

### Added
- 150 reviewed pantry identities across legumes, grains, flours, vegetables, aromatics, spices, proteins and dairy; 222 identities total.
- Independent market counterpart associations, scoped recipe alternatives, exact-food offer qualification and retained historical catalog views.
- Deterministic final release audit, source/approval/discovery evidence and an exact hosted accepted-ID rollout report.

### Changed
- Separate whole/ground coriander and cardamom, raw/cooked proteins, mozzarella forms, yogurt flavors/fat levels and other reviewed cooking distinctions.
- Correct recipe methods and quantities, including separate required cottage-cheese and cheddar portions and narrow exclusions for unsupported cabbage/sweet-potato uses.
- Require actual food evidence before price selection; preserve native pantry ownership when no qualifying quote exists. Group history and estimated regular prices do not establish precise-food savings.
- Refresh USDA provenance and curated dispositions while retaining explicit prices, private inventory and directional No precedence.

### Rollout
- Released to production November 8. The eight additive hosted migrations were approved and applied November 8, with all 222 accepted IDs verified. Production independent-session/API and guest-browser verification pass, and disposable test accounts/entries are removed; see [release notes](docs/releases/v1.6.1.md).

## [1.6.0] - 2026-10-30

### Added
- Virtual Pantry with explicit Yes/No availability, custom ingredients, optional storage/quantity/unit/date details, and private guest persistence.
- Account-owned pantry sync with durable offline queues, idempotent retries, revision conflicts, explicit guest import, and retained legacy inventory.
- Reviewed 72-identity cooking catalog with compact lentil search, optional varieties, provenance/approval ledgers, repeatable USDA refreshes, and full market-link applicability audits.
- Directional recipe coverage, explicit No precedence, and reviewed fresh-onion recipe-use mapping; fresh onions and onion powder remain separate requirements.

### Changed
- Recipe cards show “Make sure you have” and $0.00 additional cost for available ingredients; coverage and shopping needs refresh together.
- Staples use labeled fixed recipe-use estimates; missing prices remain explicit. Buying, cooking, planning, and saving recipes never deduct inventory.
- Pantry uses a door icon; freezer-specific snowflakes remain. Dropdown arrows have consistent spacing.
- Account export/deletion and OpenAPI cover pantry records, ownership, catalog readiness, and compatibility behavior.

### Rollout
- Install the three additive pantry migrations and verify isolated staging before hosted activation. Retain accepted IDs during catalog rollback; see [release notes](docs/releases/v1.6.0.md).

## [1.5.2] - 2026-10-29

- Show package sizes and original prices in raw data; preserve source conditions and calculation context.
- Summarize explicitly labeled USDA period benchmarks when no local chart series is visible.
- Explain canonical ingredient scope, grouping decisions, exclusions, and limitations.
- Provide a labeled hypothetical score calculator and benchmark when retained local offers are absent.
- Track requested ZIP markets with bounded scheduled collection, retryable failures, and fenced leases.
- Prevent Mead-default Kroger prices from being attributed to unrelated ZIPs; add nationwide collection to the roadmap.

## [1.5.1] - 2026-10-28

### Added
- Public Data Explorer (`/data`) with USDA/store price charts, weekly patterns, ingredient grouping rationale, and source coverage.
- First-class raw-data tables, stored USDA report JSON inspection/download, filtered CSV exports with metadata, and revision-aware pagination.
- Shared value-score traces showing source inputs, component weights, rounding, and separate recommendation rules.

### Changed
- Yellow/white cooking onions exclude sweet and red onions and no longer imply a required 3 lb bag.
- Six-week-low badges require the observed low and adequate local coverage; a large discount alone is labeled separately.
- Public archive reads preserve historical usable-version admissions, distinguish source periods from retrieval dates, and retain missing-data gaps.

### Fixed
- Demonstration prices and IDs remain stable across date filtering and chart drill-through.
- Changed/expired snapshots fail explicitly and offer a fresh-data reload rather than silently changing paginated results.

## [1.5.0] - 2026-10-28

### Added
- Weekly authenticated USDA ingestion, validated report definitions, versioned Supabase source data and operator discovery/recovery/backfill commands.
- Durable shared market-offer revisions and retrieval receipts, bounded six-week history reads, and quarantined legacy SQLite imports.
- Source-period freshness and national-versus-regional labels, missing-data gaps, ingestion health checks, and database transaction/security tests.
- Deterministic Wednesday recipe rotation while retaining the strongest value match.

### Changed
- Dashboard and digest requests use stored USDA benchmarks; they never fetch USDA on demand.
- Production history uses Supabase. Synthetic seeds and static wholesale scenarios do not participate in verified cloud analytics.
- Retail units and commodity mappings are explicit; incomplete or unordered report revisions cannot replace published data.

## [1.4.1] - 2026-10-27

### Fixed
- Advance Mountain Time planning cycles and reject expired, future and undated circulars.
- Prefer verified prices consistently across meal planning, shopping checklists and store optimizers; label historical estimates and suppress unsupported stock-up alerts.
- Save history under the retrieved ad week and bound six-week statistics to the current calendar window.
- Report actual offer counts, retrieval freshness and audit storage errors; authenticate cron recording with a bearer secret.
- Preserve session ownership, private guest inventory and account-bound pending writes across cloud-sync failures (previously reviewed develop changes, #554).

### Added
- Optional server-only Supabase refresh audit records, source outcomes, and rollover/failure regression coverage.
- [Release notes and configuration](docs/releases/v1.4.1.md).

## [1.4.0] - 2026-10-19

### 🌐 Developer Platform, OpenAPI 3.1 & Interactive Swagger UI Console

This release aligns the PantryBot backend with the **OpenAPI 3.1.0** specification standard, introduces an embedded interactive **Swagger UI** testing and documentation console at `/docs`, and publishes typed API schemas for all 8 backend API route domains.

### Added
- **OpenAPI 3.1.0 Specification (`src/lib/openapi/spec.ts` & `/api/openapi.json`):**
  - Full OpenAPI 3.1.0 specification documenting all 8 core REST route domains:
    - `GET /api/dashboard`: Live commodity value leaderboard, 3-dish meal-prep trios, and 6-week cycle signals.
    - `GET /api/locations`: Supported supermarket chains, local banners, and store features.
    - `GET, POST, PATCH, DELETE /api/freezer`: Virtual Freezer inventory management and multi-week protein arbitrage.
    - `GET, POST, DELETE /api/saved-recipes`: Saved recipe library and blueprint management.
    - `POST /api/ai-meal-plan`: Gemini 2.5 Flash batch-prep trio generator with Zero-Key Offline Resilience fallback.
    - `GET, POST /api/sync`: Bidirectional cloud sync with PostgreSQL RLS / SQLite local store.
    - `GET, POST, DELETE /api/account`: Local & SSO sessions, JSON data export archive, and GDPR/CCPA purge.
    - `GET, POST /api/cron/weekly-sync`: Ingestion pipeline cron, Friday Weekend Digest, and Smart Push payloads.
  - Complete component schemas for all domain types (`DashboardPayload`, `FreezerItem`, `RecommendedDish`, `StoreOffer`, `ScoredCommodity`, `UserProfile`, `UserPreferences`, `WeeklySyncCronResult`, `UserDataExportArchive`, etc.).
  - Security schemes for session cookies (`pantrybot_local_session`) and cron verification (`x-vercel-cron`).
- **Interactive Swagger UI Console (`src/components/SwaggerUIConsole.tsx` & `/docs`):**
  - Embedded client console powered by `swagger-ui-dist` with zero initial hydration penalty via dynamic import.
  - Custom emerald/slate theme styling matching PantryBot aesthetic.
  - Quick-filter tag pills for rapid endpoint filtering (*Dashboard & Deals*, *Virtual Freezer*, *Saved Recipes*, *AI Meal Planner*, *Cloud Sync*, *Account*, *Cron*).
  - 1-click OpenAPI Spec URL copy and direct link to raw JSON.
  - Added redirect from `/api-docs` and `/swagger` to `/docs`.
- **Tooling, Navigation & Static Fallbacks:**
  - Added `npm run openapi:export` script to re-export schemas to `docs/openapi.json` and `public/openapi.json`.
  - Added direct "API Docs" link in `src/components/AppFooter.tsx`.
  - Added wiki guide `docs/wiki/OpenAPI-and-Swagger-Documentation.md` and updated `README.md` and `docs/wiki/Home.md`.
- **Automated Test Coverage:**
  - `tests/unit/backend/openapi-spec.test.ts`: 7 unit tests validating spec structure, paths, methods, responses, schemas, and disk file sync.
  - `tests/smoke/backend/openapi-smoke.test.ts`: 2 smoke tests validating `/api/openapi.json` HTTP GET and OPTIONS responses.

---

## [1.3.1] - 2026-10-19

### 🧪 3-Tier CI Test Automation & Branch Quality Gates

This release establishes an automated 3-tier testing policy aligned with the Git branching architecture, ensuring deterministic quality gates across working branches, staging (`develop`), and production (`main`).

### Added
- **3-Tier Automated Testing Infrastructure:**
  - Configured Vitest runner (`vitest.config.mts`) and strongly typed mock factories (`tests/test-utils.ts`).
  - Added SQLite in-memory test isolation (`PANTRYBOT_SQLITE_PATH=':memory:'` and `resetSqliteTestInstance()`) in `src/lib/db/sqlite.ts`.
  - Added **Tier 1 Unit Test Policy (`npm run test:unit`)**: 6 test suites covering flyer price normalization, commodity scoring curves, wholesale club benchmarks, store split math, security/rate-limit helpers, and cart export formatters.
  - Added **Tier 2 Smoke Test Suite (`npm run test:smoke`)**: 2 test suites covering SQLite schema health and core API route handlers (`/api/dashboard`, `/api/locations`, `/api/freezer`, `/api/saved-recipes`, and `/api/ai-meal-plan` zero-key fallback).
  - Added **Tier 3 Regression Test Suite (`npm run test:regression`)**: 5 test suites covering multi-constraint dashboard permutations, account/GDPR lifecycle, freezer cost basis depletion, weekly sync cron digests, and CSRF/rate limit abuse boundaries.
  - Configured branch-targeted execution in `.github/workflows/ci.yml` (`test:unit` on feature branches, `test:smoke` on `develop`, and `test:regression` on `main`).

### Fixed
- **Flyer Per-Pound Normalizer (`src/lib/connectors/flipp.ts`):** Enhanced regex matching to handle both `/lb` and `/ lb` whitespace variants, ensuring explicit per-pound flyer items are not misclassified as each/count items.

---

## [1.3.0] - 2026-10-19

### 🔐 User Accounts, Cloud Sync & Legal Foundation

This release introduces passwordless **Single Sign-On (Google & Apple SSO)**, multi-tenant **PostgreSQL Row-Level Security (RLS)** cloud persistence, cross-device synchronization for Virtual Freezer inventory and meal-prep preferences, self-serve **GDPR/CCPA data export and deletion controls**, and a global legal compliance footer (`/privacy`, `/terms`, copyright, and support contact).

### Added
- **Supabase Auth Foundation, Next.js Middleware & Google SSO (Ticket #26 / #523):**
  - Integrated `@supabase/ssr` client, server, and Edge middleware (`src/lib/supabase/`, `src/middleware.ts`) with `HttpOnly`, `SameSite=Lax`, `Secure` session cookie management.
  - Added `/auth/callback` OAuth 2.0 PKCE exchange route with open-redirect sanitization.
  - Preserved 100% Zero-Key Offline Resilience: automatically falls back to local multi-tenant SQLite session storage when Supabase environment variables are omitted.
- **Multi-Tenant PostgreSQL Schema with Row-Level Security (Ticket #27 / #524):**
  - Added Supabase SQL migration (`supabase/migrations/20261019000000_v1_3_multi_tenant_rls_schema.sql`) defining `public.users`, `public.user_preferences`, `public.user_freezer_items`, and `public.user_saved_recipes` with `ON DELETE CASCADE`.
  - Enforced strict PII minimization (`id`, `email`, `display_name`, `provider`) and enabled PostgreSQL Row-Level Security (`auth.uid() = user_id`) across all user tables.
- **Cloud Sync Engine & Guest-to-Account Migration (Ticket #28 / #525):**
  - Built `useUserSync` hook (`src/hooks/useUserSync.ts`) and `/api/sync` endpoint to synchronize Home ZIP, My Stores, Macro/Dietary targets, and Virtual Freezer inventory across devices.
  - Added 1-click guest-to-account migration banner when anonymous local Virtual Freezer items are detected upon login, plus an offline mutation queue that flushes automatically on reconnect.
- **Account Management UI, Data Privacy & Self-Serve Controls (Ticket #29 / #526):**
  - Added `AccountModal` drawer (`src/components/AccountModal.tsx`) and navbar Account/Sign-In trigger.
  - Added 1-click **"Export My Grocery Data (.json)"** portability download and 2-step **"Delete Account & Data"** (Right to be Forgotten) cascading purge (`GET` & `DELETE /api/account`).
- **Sign in with Apple & Security Hardening (Ticket #30 / #527):**
  - Added Apple HIG-compliant **Sign in with Apple** button and OAuth provider flow.
  - Added IP sliding-window rate limiting and CSRF `Origin`/`Host` verification (`src/lib/security/rate-limit.ts`) on `/auth/callback`, `/api/sync`, `/api/account`, and `/api/freezer`.
- **Legal Foundation & Global App Footer (Ticket #31 / #528):**
  - Created global `AppFooter` component (`src/components/AppFooter.tsx`) mounted in `src/app/layout.tsx` with copyright notice (`© 2026 PantryBot. All rights reserved.`), version badge, and support contact link (`mailto:support@pantrybot.dev`).
  - Added static `/privacy` (Privacy Policy) and `/terms` (Terms & Conditions) routes (`src/app/privacy/page.tsx`, `src/app/terms/page.tsx`).

---

## [1.2.0] - 2026-10-19

### ❄️ Smart Kitchen, Virtual Freezer & Cart Bridge

This release elevates PantryBot from a weekly single-trip grocery planner into a multi-week kitchen inventory and checkout bridge. Shoppers can now bank deep cycle lows into a persistent **Virtual Freezer** (`"Buy 2: Prep 1, Freeze 1"`), customize **Macro & Dietary Profiles** with automatic ingredient slot adaptation, benchmark supermarket ads against **Costco & Sam's Club** bulk baselines, track **6-Week Cycle Floor vs. Peak Signals**, and bridge their aggregated list directly into **Walmart, Target, Kroger, Safeway, Sprouts, or Instacart** carts.

### Added
- **Persistent Virtual Freezer & Multi-Week Arbitrage Engine (Ticket #21 / #513):**
  - `"❄️ Buy 2: Prep 1, Freeze 1"` one-tap arbitrage prompts on deep cycle lows (`>38%` discount, `💎 Splurge` alerts, and 6-week floor deals).
  - Persistent SQLite `freezer_inventory` table (`/api/freezer` `GET`/`POST`/`PATCH`/`DELETE`) synced with browser `localStorage`.
  - Interactive Virtual Freezer header drawer displaying banked lbs, cost basis, estimated savings, `+/- 0.5 lb` consumption controls, thaw/remove actions, and a quick-add form.
  - Zero-cost recipe substitution: Any ingredient stocked in the Virtual Freezer automatically drops out-of-pocket recipe cost to `$0.00` and badges matching recipes with `"❄️ Powered by Virtual Freezer ($0 Stock)"`.
- **Dietary Preferences, Macro Targets & Cooking Style Archetypes (Ticket #22 / #514):**
  - Interactive Nutrition & Cooking Vessel personalization bar in the 3-Dish Meal-Prep Planner.
  - **Macro Goal Profiles:** `All Macros`, `💪 High-Protein (40g+/serving)`, `🥑 Low-Carb / Keto`, `🔥 Calorie-Conscious (<460 kcal)`, and `🍲 Balanced Family`.
  - **Dietary Rules with Dynamic Slot Adaptation:** `🌾 Gluten-Free`, `🥛 Dairy-Free` (automatically omits dairy slots), `🥜 Nut-Free`, and `🐟 Pescatarian` — plus automatic carb-to-cauliflower/cabbage/green-bean swaps when `Low-Carb / Keto` is active.
  - **Cooking Vessel Archetypes:** `⚡ Slow Cooker / Instant Pot`, `🔥 Sheet-Pan / 9x13 Casserole`, `🍲 Dutch Oven Braise`, and `🍳 Big-Batch Skillet`.
  - Expanded curated recipe blueprint library to 12 batch-cooking templates and wired full dietary/macro/appliance constraints into `/api/ai-meal-plan` (Gemini 2.5 Flash).
- **1-Tap Curbside Cart Bridge & Multi-Store Export (Ticket #23 / #515):**
  - Dedicated Curbside Pickup & Cart Bridge bar (`src/lib/cart-exporter.ts`) generating store-specific search deep links for Walmart Grocery, Target Drive Up, localized Kroger banners, localized Albertsons/Safeway banners, Sprouts, ALDI, and Instacart.
  - Per-item `"Add"` cart deep-link buttons on every row of the Aggregated Shopping List.
  - 1-Tap `"Copy Checklist for Apple Notes / Keep"` formatting items by store and aisle category (`Produce`, `Meat & Seafood`, `Dairy & Eggs`, `Pantry & Dry Goods`) with native `- [ ]` checkboxes.
  - High-contrast `"Print Kitchen Slip"` modal and `@media print` stylesheet for physical fridge/clipboards.
- **"Stock Up vs. Wait" Predictive Cycle Low Signals (Ticket #24 / #516):**
  - Multi-week historical min/max/median analytics in SQLite classifying every commodity into `🟢 Stock Up Alert (6-Wk Low)`, `🟡 Fair Sale Price`, or `🔴 Cycle Peak (Wait / Swap)`.
  - Automated smart substitution callouts when an ingredient is near its 6-week price peak (e.g., suggesting a swap to an in-category protein or vegetable currently on a `>25%` promo).
- **Wholesale Club Price Normalizer — Costco & Sam's Club (Ticket #25 / #517):**
  - Reference bulk price dataset (`src/data/wholesale-club-benchmarks.ts`) covering all 29 canonical ingredients across Costco (Kirkland Signature) and Sam's Club (Member's Mark) normalized to `$/lb` and `$/doz`.
  - Automatic `"🏆 Beats Costco/Sam's Bulk (-X%)"` vs. `"📦 Club Bulk Cheaper"` badges on every deal card and inside the expandable Wholesale Club Comparison Matrix.

---

## [1.1.0] - 2026-10-16

### 🛒 Multi-Vendor Expansion & Universal Basket Optimizer

This release expands PantryBot's nationwide coverage from the dual Kroger/Safeway banners to a 6-major-vendor ecosystem, introducing ALDI, Walmart, Target, Sprouts Farmers Market, plus localized Kroger and Albertsons banners. A revamped Universal Basket Optimizer ranks single-stop trips across all user-selected stores and computes the mathematically optimal 2-store split for maximum dollar savings.

### Added
- **Multi-Vendor Grocery Integration (6 Major Supermarkets):**
  - **ALDI:** Deep-discount grocery staples with EDLP everyday low pricing, private-label produce, and no-coupon simplicity.
  - **Walmart:** Everyday Low Price (EDLP) and Rollbacks integration across grocery produce, bulk staples, and meat.
  - **Target:** Super Target & PFresh grocery coverage with Target Circle manufacturer deal tagging.
  - **Sprouts Farmers Market:** High-frequency organic produce, bulk bin staples, and specialty health foods.
  - **Kroger Regional Banners:** King Soopers, Ralphs, Fred Meyer, Fry's, Dillon's, Smith's, QFC, Harris Teeter.
  - **Albertsons Regional Banners:** Safeway, Albertsons, Vons, Jewel-Osco, Shaw's, Acme, Tom Thumb, Randalls.
- **Store Registry & Banner Metadata (`src/data/store-registry.ts`):**
  - Centralized store configuration with brand hex accents, badge Tailwind stylings, loyalty app requirements, and regional zip-to-banner resolvers.
- **"My Stores" Preference Drawer & Dynamic Filter Bar:**
  - Interactive store selector modal allowing shoppers to enable or disable any of the 6 stores based on local proximity and shopping preference.
  - Quick-switch store pills filtering commodity rankings and highlighting active supermarket deals.
  - Persistent user store preferences saved in browser `localStorage`.
- **Ranked 1-Stop Store Leaderboard & Best 2-Store Trip Optimizer:**
  - Universal N-Store Basket Engine calculating exact shopping list totals across all selected stores.
  - 1-Stop Store Ranking showing complete single-store costs and cost difference vs. the cheapest supermarket.
  - "Best 2-Store Split" algorithm analyzing all $\binom{N}{2}$ store combinations to find the highest-savings 2-stop shopping trip without requiring multi-stop fatigue.
  - Single-store price fallback logic simulating substitutions when a specific store does not stock a niche item.
- **Multi-App Digital Coupon Pre-Flight Checklist:**
  - Organized digital coupon clipping checklist partitioned by store app (Kroger, Safeway for U, Target Circle, Sprouts).
  - One-tap "Open App" deep links with instructions and direct coupon codes.
  - Zero-friction tagging: Automatically marks ALDI and Walmart items as "No App Required — Automatic Everyday Low Price".

---

## [1.0.0] - 2026-10-16

### 🚀 Production Launch — Live at [pantrybot.dev](https://pantrybot.dev)

This milestone marks the official production launch of PantryBot as a full-featured, mobile-first Progressive Web App (PWA) with nationwide grocery coverage, automated value scoring, smart meal-prep batch planning, and multi-store optimization.

### Added
- **Nationwide Dynamic ZIP Code Support:**
  - Interactive header location selector with modal dialog and quick-select presets for major US metropolitan regions.
  - Automatic city & state resolution via `api.zippopotam.us` with in-memory caching and graceful fallback.
  - Persisted user location in browser `localStorage` across browsing sessions.
  - Multi-banner nationwide circular scraping support via Flipp (Kroger family: King Soopers, Ralphs, Fred Meyer, Fry's; Albertsons family: Safeway, Albertsons, Vons, Jewel-Osco, Tom Thumb).
- **Core Value Scoring Engine:**
  - Normalized grocery pricing model (`$/lb`, `$/doz`) comparing current sale prices against regional baselines and USDA wholesale commodity trends.
  - Dual-tier deal ranking: Everyday High-Value Staples (stew cuts, chicken thighs, root vegetables, onions) vs. `💎 Splurge Value Alerts` (ribeye, chuck roasts, wild salmon, avocados at 40–60% off).
  - Multi-buy logic and redemption condition labeling (`📱 Clip App Coupon`, `🏷️ Member Card`, `🔢 Multi-Buy`).
- **3-Dish Weekend Meal-Prep Planner:**
  - Automated budget-optimized trio selection (Stew, Braise/Chili, Casserole/Curry) delivering high-protein, freezer-friendly batch meals under $2.00/serving.
  - Dynamic serving scaler (`4`, `6`, `8` portions) with real-time total ingredient calculation and estimated macro breakdown (calories, protein, carbs, fat).
  - "Already Have at Home" toggle for freezer and pantry items to drop marginal cost to `$0.00`.
  - Gemini 2.5 Flash AI integration with custom user API key support for generating custom recipes from pinned circular ingredients.
- **Aggregated Shopping List & Trip Optimizer:**
  - Cross-dish ingredient aggregation deduplicating shared aromatics, produce, and bulk meat.
  - "Digital Coupon Pre-Flight Checklist" grouping app coupons by supermarket chain for 60-second clipping before entering the store.
  - 1-Store vs. 2-Store Trip Optimizer analyzing net dollar savings, single-store substitutions, and mileage trade-offs.
- **Data Persistence & Analytics:**
  - Local SQLite historical database (`data/mead-price-history.sqlite`) storing multi-week store offer snapshots, USDA wholesale trends, and saved custom recipes.
  - Interactive 6-week historical price trend sparklines highlighting cycle lows.
- **Production Infrastructure & Automation:**
  - Full-stack Next.js 15 (App Router) + React 19 + Tailwind CSS setup.
  - Mobile Progressive Web App manifest (`manifest.webmanifest`, `icon.svg`) for Add-to-Home-Screen support on iOS and Android.
  - Automated weekly circular refresh and Friday Weekend Meal-Prep Digest cron configuration (`/api/cron/weekly-sync`).
  - Custom domain routing (`pantrybot.dev` and `www.pantrybot.dev`) hosted on Vercel.

