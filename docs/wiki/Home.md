# PantryBot Wiki

> v1.5.2 adds visible source/package details, USDA-only history statistics, a hypothetical score calculator, canonical ingredient explanations, and bounded active-market collection. See the [release notes](../releases/v1.5.2.md).

> v1.5.1: The public [Data Explorer](https://pantrybot.dev/data) connects stored price history, exact score arithmetic, ingredient grouping rationale, raw source rows, and CSV/JSON exports. See the [explorer guide](../data-explorer.md) and [release notes](../releases/v1.5.1.md). Production uses stored verified data; previews without server database credentials use labeled demonstration data.

> v1.5.0: Shared market history now uses Supabase; USDA is ingested only in authenticated Wednesday batches. Current validated sources supply national retail benchmarks, not Mountain or wholesale forecasts. SQLite history is an offline demonstration fallback. The [market-data runbook](../usda-market-data.md) supersedes the historical pipeline descriptions below.


Welcome to the project wiki for **PantryBot** — the **Smart Grocery Deal Tracker, Virtual Freezer & Weekend Meal-Prep Optimizer** (`v1.5.2`, live at [pantrybot.dev](https://pantrybot.dev)).

## Purpose

PantryBot bridges **macro agricultural supply data (USDA)**, **wholesale club bulk baselines (Costco & Sam's Club)**, and **hyper-local supermarket weekly circulars (Kroger/King Soopers, Safeway/Albertsons, ALDI, Walmart, Target, and Sprouts)** to answer one practical question every weekend:

> *"What are the highest-value proteins, produce, and dairy items in my ZIP code right now, which cycle-low meats should I bank in my Virtual Freezer (`Buy 2: Prep 1, Freeze 1`), and what 3 reheatable batch meals should I cook this weekend to hit my macro/dietary goals under $2.00/serving?"*

---

## Wiki Navigation

1. **[Architecture & Data Pipeline](./Architecture-and-Data-Pipeline.md)**
   * How the 4-layer ingestion and benchmarking pipeline merges Flipp weekly circulars across 6 supermarket chains, the Kroger Official Developer API, USDA MyMarketNews (MARS v1.2), and the Wholesale Club Bulk Price Normalizer (Costco Kirkland & Sam's Club Member's Mark).
   * How the Canonical Ingredient Engine normalizes messy ad units (`ea`, `oz`, `5 lb bag`) into standard `$/lb` and `$/doz`.
   * How Supabase PostgreSQL (with Row-Level Security) and SQLite persist user accounts, preferences, 6-week historical price trends, custom recipes, and the **Persistent Virtual Freezer**.
2. **[Scoring, Virtual Freezer Arbitrage & 3-Dish Meal Prep Engine](./Scoring-and-Meal-Prep-Engine.md)**
   * Mathematical breakdown of the **Workhorse Value Score (0–100)**, **6-Week Cycle Floor vs. Peak Signals**, and **Wholesale Club Benchmarks**.
   * How the **Multi-Week Arbitrage Engine (`"❄️ Buy 2: Prep 1, Freeze 1"`)** and **Virtual Freezer `$0.00` Substitution** work.
   * How **Macro Goals (`High-Protein`, `Low-Carb / Keto`, `Calorie-Conscious`)**, **Dietary Rules (`Gluten-Free`, `Dairy-Free`, `Nut-Free`, `Pescatarian`)**, and **Cooking Vessel Archetypes (`Slow Cooker / Instant Pot`, `Sheet-Pan / 9x13`, `Dutch Oven`, `Skillet`)** dynamically adapt recipe slots.
   * How the **1-Tap Curbside Cart Bridge & Multi-Store Exporter** connects to Walmart, Target, Kroger, Safeway, Sprouts, ALDI, Instacart, and Apple Notes / Google Keep.
3. **[API Keys & Developer Setup Guide](./API-Keys-and-Local-Setup.md)**
   * How to run the app with zero keys vs. how to register for free-tier keys from Google AI Studio, USDA MARS, the Kroger Developer Portal, and Supabase.
4. **[OpenAPI 3.1 & Swagger UI Console](./OpenAPI-and-Swagger-Documentation.md)**
   * Production OpenAPI 3.1 REST specification (`/api/openapi.json`), interactive Swagger UI testing console (`/docs`), and endpoint documentation across all 8 backend API domains.
5. **[Project Roadmap (`ROADMAP.md`)](../../ROADMAP.md)**
   * Milestones (`v0.1` PoC through `v1.3` User Accounts & Cloud Sync, and upcoming `v1.5+` native mobile tickets).
6. **[Release Notes (`docs/releases/`)](../releases/)**
   * **[v1.5.1 — Data Explorer & Score Transparency](../releases/v1.5.1.md)**
   * **[v1.5.0 — Weekly USDA and Durable Market History](../releases/v1.5.0.md)**
   * **[v1.4.0 — Developer Platform, OpenAPI 3.1 & Interactive Swagger UI Console](../releases/v1.4.0.md)**
   * **[v1.3.1 — 3-Tier CI Test Automation & Branch Quality Gates](../releases/v1.3.1.md)**
   * **[v1.3.0 — User Accounts, Cloud Sync & Legal Foundation](../releases/v1.3.0.md)**
   * **[v1.2.0 — Smart Kitchen, Virtual Freezer & Cart Bridge](../releases/v1.2.0.md)**
   * **[v1.1.0 — Multi-Vendor Expansion & Universal Basket Optimizer](../releases/v1.1.0.md)**
   * **[v1.0.0 — Production Launch (`pantrybot.dev`)](../releases/v1.0.0.md)**
7. **[North Star: Native iOS/Android & Feature Expansion Blueprint](./Long-Term-Mobile-and-Expansion-Roadmap.md)**
   * Multi-horizon strategy (`v1.5`–`v3.0`) for packaging into native iOS & Android apps (Expo / React Native), camera shelf-tag OCR, and Live Activities.

---

## Quick Reference: Target Geography & Store Ecosystem

* **Dynamic Nationwide ZIP Code Support:** Supports any 5-digit US ZIP code (defaulting to `80542` Mead / Longmont, CO) with automatic city/state resolution and regional supermarket banner mapping.
* **6 Tracked Supermarket Chains (`src/data/store-registry.ts`):**
  * **Kroger Regional Banners:** King Soopers, Kroger, Ralphs, Fred Meyer, Fry's, Smith's, QFC, Harris Teeter
  * **Albertsons Regional Banners:** Safeway, Albertsons, Vons, Jewel-Osco, Shaw's, Acme, Tom Thumb
  * **ALDI:** Everyday Low Price (EDLP) private-label staples
  * **Walmart:** Everyday Low Price (EDLP) & Rollbacks
  * **Target:** Super Target & PFresh grocery with Target Circle deals
  * **Sprouts Farmers Market:** Organic produce, bulk bin staples, and specialty meat
* **Wholesale Club Bulk Benchmarks (`src/data/wholesale-club-benchmarks.ts`):**
  * **Costco Wholesale (Kirkland Signature)** & **Sam's Club (Member's Mark)** normalized to `$/lb` and `$/doz`
* **Weekly Circular Cycle:** Wednesday 12:01 AM – Tuesday 11:59 PM Local Time
* **Primary Meal Prep Output:** 3 batch dishes × 4/6/8 scalable servings each = **12–24 reheatable meals/week**

## v1.4.1 release candidate

Current planning cycles, verified live prices, explicit estimates and refresh audit status are documented in [weekly refresh operations](../weekly-refresh.md). See [v1.4.1 release notes](../releases/v1.4.1.md) for the complete scope, including the previously reviewed account and cloud-sync fixes.

## Staged Virtual Pantry implementation

See [Virtual Pantry](Virtual-Pantry.md) for the v1.6.0 boolean inventory contract, recipe-use cost assumptions, compatibility fences, and rollout requirements. The quantity-based freezer behavior above remains the flag-off v1.5.2 path until release.

The draft [USDA catalog ingestion standards](../specs/usda-catalog-ingestion.md) define recurring source review and a compact cooking-ingredient catalog, including optional varieties and safe updates. Candidate records remain separate from published search choices.
