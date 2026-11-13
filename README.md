# PantryBot — Smart Grocery Deal Tracker, Virtual Pantry & Meal-Prep Optimizer (`v1.6.2`)

A mobile-friendly Next.js Progressive Web App (**PantryBot**, live at [pantrybot.dev](https://pantrybot.dev)) designed for nationwide grocery circular comparison, **Virtual Pantry** availability and meal planning, wholesale club benchmarking, **3-Dish Weekend Meal-Prep Planning**, and privacy-first **Cloud Sync** across devices.

## v1.6.2 — Barcode entry and static staple estimates

Released November 12, 2026; the maintainer attested that production is functioning as expected. Typed UPC-A/EAN-13 lookup and deliberate local camera capture share product review, ingredient correction and explicit pantry confirmation. Existing static/unpriced staple estimates now use one evaluator across current/saved recipes and shopping. New live store API pricing is deferred to [multi-store scope #689](https://github.com/kchavez05/produce-price-tracker/issues/689); existing market discovery is preserved.

The maintainer reported limited iOS Safari scanning/key-entry smoke tests and explicitly accepted the unrun remainder of #649’s pre-release matrix. Full Android, account/second-client and accessibility results are not claimed. See the [verification acceptance](docs/research/v1.6.2-barcode-verification-acceptance.md), [candidate release notes](docs/releases/v1.6.2.md), and [rollout plan](docs/releases/v1.6.2-rollout.md). Itemized production receipts are not recorded; the barcode artifact, production enforcement and acceptance gates in the rollout plan are not claimed as individually verified.

## v1.6.0 — Virtual Pantry

Virtual Pantry records explicit Yes/No availability with optional quantity, location, unit, and date. It supports custom ingredients, private guest use, explicit account import, and revision-checked account sync. Recipes and shopping needs use boolean availability; quantity and dates never deduct or limit coverage. Buying or cooking does not change inventory. Staples have fixed USD recipe-use estimates; missing prices remain explicit.

Virtual Pantry is the only inventory path in this branch; install all additive Pantry migrations before deploying. Local guest use needs no account or API key. `/api/freezer` returns 410 and old inventory sync writes return 426. Original records remain available through the migration bridge and account export. This retirement is awaiting a production release; see [#700](https://github.com/kchavez05/produce-price-tracker/issues/700) and the [Pantry guide](docs/wiki/Virtual-Pantry.md).

A reproducible [USDA candidate catalog importer](docs/usda-pantry-catalog.md) prepares Foundation/SR Legacy ingredients and a coverage report for review. It does not activate catalog changes. The [curation ledger and staging command](catalog/README.md) prepare compact review choices without activating unapproved data. The approved [ingestion standards](docs/specs/usda-catalog-ingestion.md) define cooking relevance, compact search results, recurring refreshes, and publication gates.

## v1.6.1 — Pantry Catalog Expansion

Released November 8, 2026, v1.6.1 expands the pantry catalog before speech entry. The approved batches compile to 222 identities in catalog `2026-11-07.4`, with 175 source-linked identities, 85 independent market counterpart associations and 63 scoped recipe uses. The [produce](docs/research/v1.6.1-market-produce-review.md), [protein](docs/research/v1.6.1-market-protein-review.md) and [dairy](docs/research/v1.6.1-market-dairy-review.md) batches close the 18 reviewed coverage gaps. All 35 market groups have counterpart paths; the [market completion plan](docs/specs/v1.6.1-market-coverage.md) records the four implemented offer-qualification rules and five explicitly approved release scope boundaries. The [final local audit](docs/research/v1.6.1-release-audit.md) passes. All eight hosted migrations are installed and all 222 accepted IDs are verified. Production authenticated API and guest-browser verification pass, with disposable test data cleaned up. See the [v1.6.1 release notes](docs/releases/v1.6.1.md).

## Existing Features (released `v1.6.1` baseline)

* **Public Data Explorer & Score Transparency:** Explore stored USDA and store price history, inspect score arithmetic and ingredient groupings, and download raw source JSON or filtered CSV. Available through **Explore the data** in the footer; see the [explorer guide](docs/data-explorer.md).

* **Weekly USDA and durable market history:** Authenticated Wednesday batches, stored national retail benchmarks with source-period labels, immutable report revisions, and Supabase price history. Dashboard and digest requests never call USDA. Synthetic SQLite history remains local demonstration data. See the [market-data runbook](docs/usda-market-data.md).

* **Current prices and explicit estimates:** Mountain Time ad cycles, source expiration checks, verified-price-first shopping budgets, accurate freshness indicators, and authenticated scheduled refreshes with optional durable audit history. See [weekly refresh operations](docs/weekly-refresh.md).

* **Developer Platform, OpenAPI 3.1 & Interactive Swagger UI:** Standardized **OpenAPI 3.1.0** specification (`/api/openapi.json`) and embedded interactive **Swagger UI** console ([`/docs`](https://pantrybot.dev/docs)) with live route testing, tag filters, and typed schemas across 8 backend API route domains.
* **User Accounts, SSO & Cross-Device Cloud Sync:** Optional 1-click **Sign in with Google** and **Sign in with Apple** via Supabase Auth + PostgreSQL Row-Level Security (RLS) (with automatic zero-key SQLite multi-tenant fallback). Syncs ZIP code, preferred stores, macro/dietary goals, cooking vessels, Virtual Pantry entries, and saved recipes across devices with explicit reviewed guest pantry import, 1-click JSON export, and self-serve GDPR/CCPA account deletion.
* **6-Vendor Supermarket Ecosystem + Nationwide ZIP Support:** Compares weekly circular deals and digital loyalty coupons across **Kroger** (King Soopers, Ralphs, Fred Meyer, Fry's), **Albertsons** (Safeway, Vons, Jewel-Osco), **ALDI**, **Walmart**, **Target**, and **Sprouts Farmers Market** for any 5-digit US ZIP code.
* **Virtual Pantry:** Mark ingredients Yes/No with optional details, compact cooking-ingredient search, optional varieties, and custom items. Recipes show distinct required coverage and estimated additional grocery costs. Available ingredients leave shopping needs; purchases and cooking never mutate inventory. Legacy freezer records are preserved for migration, recovery and export.
* **Dietary, Macro & Cooking Vessel Personalization:** Customize **Macro Goals** (`High-Protein 40g+`, `Low-Carb / Keto`, `Calorie-Conscious <460 kcal`, `Balanced`), **Dietary Rules** (`Gluten-Free`, `Dairy-Free`, `Nut-Free`, `Pescatarian`) with automatic ingredient slot adaptation, and **Cooking Vessels** (`Slow Cooker / Instant Pot`, `Sheet-Pan / 9x13`, `Dutch Oven`, `Skillet`).
* **Wholesale Club Price Normalizer (Costco & Sam's Club):** Benchmarks supermarket unit prices (`$/lb`, `$/doz`) against **Costco (Kirkland Signature)** and **Sam's Club (Member's Mark)** bulk baselines (`🏆 Beats Costco/Sam's Bulk -X%`).
* **Observed price signals:** Distinguishes verified six-week lows, deep regular-price discounts, and insufficient history. Missing observations stay gaps; short histories do not establish recurring cycles or forecasts.
* **1-Tap Curbside Cart Bridge & Checklist Export:** Deep links directly into **Walmart Grocery**, **Target Drive Up**, **Kroger**, **Safeway**, **Sprouts**, **ALDI**, and **Instacart** search, plus 1-tap **Apple Notes / Google Keep** aisle-grouped checklists and a printable kitchen slip.

## Quick Start

Use Node.js 22.22.2+ on the Node 22 line, or 24.15.0+ on the Node 24 line (the current SDK/test dependencies exclude older Node releases). `.nvmrc` pins the tested Node 22 runtime; CI uses Node 22.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Optional API Keys (`.env.local`)

The app works **100% out-of-the-box with zero API keys** using the Flipp circular feed, regional store datasets, USDA baselines, Wholesale Club benchmarks, the deterministic 3-Dish Slot Matcher, and local multi-tenant SQLite storage.

To enable optional live integrations, copy `.env.example` to `.env.local`:

* **`GEMINI_API_KEY`**: Free-tier key from [Google AI Studio](https://aistudio.google.com/apikey) (`gemini-2.5-flash`). You can also paste this directly in the **API Keys** button in the top navigation bar.
* **`USDA_MARS_API_KEY`**: Free key from [USDA MyMarketNews](https://mymarketnews.ams.usda.gov/) for live report slugs `3324`, `3228`, `2868`, `2756`, and `2995`.
* **`KROGER_CLIENT_ID` / `KROGER_CLIENT_SECRET`**: Free credentials from [Kroger Developer Portal](https://developer.kroger.com/) for unadvertised King Soopers/Kroger shelf prices.
* **`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`**: Optional free-tier [Supabase](https://supabase.com/dashboard) project credentials for Google/Apple OAuth SSO and PostgreSQL RLS cloud sync.

## Documentation, Wiki & Release Notes

Historical publications, backfilled milestones and release-process findings are indexed in the [November 11 retrospective audit](docs/releases/retrospective-audit-2026-11-11.md).

Track active work on the [release board](https://github.com/users/kchavez05/projects/1/views/2) and [v1.6.2 release issue #645](https://github.com/kchavez05/produce-price-tracker/issues/645). See the [issue and release tracking workflow](docs/issue-release-tracking.md) for status, acceptance and release rules.

v1.6.2/MVP retains static/unpriced pantry-staple estimates. New live store API pricing is deferred to [multi-store scope #689](https://github.com/kchavez05/produce-price-tracker/issues/689), covering multiple independent retail APIs. See the [approved scope amendment](docs/research/v1.6.2-static-pricing-scope-amendment.md). Existing market-discovery integrations are preserved; barcode device/account and production acceptance remain required.

* **[Project Roadmap (`ROADMAP.md`)](./ROADMAP.md)** — Historical release milestones, active v1.6.2 scope and long-term mobile plans.
* **[Changelog (`CHANGELOG.md`)](./CHANGELOG.md)** — Version history following Keep a Changelog.
* **[Release Notes (`docs/releases/`)](./docs/releases/)**
  * [v1.6.2 — Barcode Entry & Static Staple Estimates](./docs/releases/v1.6.2.md)
  * [v1.6.1 — Pantry Catalog Expansion](./docs/releases/v1.6.1.md)
  * [v1.6.0 — Virtual Pantry](./docs/releases/v1.6.0.md)
  * [v1.5.2 — Data Clarity & Active Markets](./docs/releases/v1.5.2.md)
  * [v1.5.1 — Data Explorer & Score Transparency](./docs/releases/v1.5.1.md)
  * [v1.5.0 — Weekly USDA and Durable Market History](./docs/releases/v1.5.0.md)
  * [v1.4.1 — Price Freshness and Sync Reliability](./docs/releases/v1.4.1.md)
  * [v1.4.0 — Developer Platform, OpenAPI 3.1 & Interactive Swagger UI Console](./docs/releases/v1.4.0.md)
  * [v1.3.1 — 3-Tier CI Test Automation & Branch Quality Gates](./docs/releases/v1.3.1.md)
  * [v1.3.0 — User Accounts, Cloud Sync & Legal Foundation](./docs/releases/v1.3.0.md)
  * [v1.2.0 — Smart Kitchen, Virtual Freezer & Cart Bridge](./docs/releases/v1.2.0.md)
  * [v1.1.0 — Multi-Vendor Expansion & Universal Basket Optimizer](./docs/releases/v1.1.0.md)
  * [v1.0.0 — Production Launch (`pantrybot.dev`)](./docs/releases/v1.0.0.md)
* **[Wiki Home (`docs/wiki/Home.md`)](./docs/wiki/Home.md)**
  * [Architecture & Data Pipeline](./docs/wiki/Architecture-and-Data-Pipeline.md)
  * [Scoring, Pantry Availability & 3-Dish Meal Prep Engine](./docs/wiki/Scoring-and-Meal-Prep-Engine.md)
  * [API Keys & Developer Setup Guide](./docs/wiki/API-Keys-and-Local-Setup.md)
  * [OpenAPI 3.1 & Swagger UI Console](./docs/wiki/OpenAPI-and-Swagger-Documentation.md) (Interactive console live at [`/docs`](https://pantrybot.dev/docs))
  * [North Star: Native iOS/Android & Feature Expansion Blueprint](./docs/wiki/Long-Term-Mobile-and-Expansion-Roadmap.md)

## Security Policy

Security vulnerabilities can be reported privately via GitHub Security Advisories or by email. Please refer to [SECURITY.md](./SECURITY.md) for details on supported versions and responsible disclosure procedures.

Weekly refresh schedules, source freshness, fallback estimates, cron authentication and durable audit setup are documented in [Weekly price refresh](docs/weekly-refresh.md).

### Data exploration

The public `/data` explorer connects price history, weekly patterns, score arithmetic, ingredient grouping rationale, and a first-class raw-data view. Inspect stored USDA rows and report JSON, compare normalized advertisements across stores, and export filtered CSV with provenance metadata. See the [Data Explorer guide](docs/data-explorer.md) for source semantics, limits, and migration requirements.

Cooking catalog integration and rollout: [operator guide](docs/usda-catalog-integration.md).
