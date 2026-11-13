> v1.6.3 candidate: signed-in Pantry profile repair and Freezer retirement (#712/#700). Production verification and publication pending; see [release notes](../releases/v1.6.3.md) and [tracker #722](https://github.com/kchavez05/produce-price-tracker/issues/722). Original storage and recovery remain.

> v1.6.2 was released November 12, 2026: barcode entry/camera and shared static/unpriced staple estimates. The maintainer attested production is functioning as expected; itemized production receipts are not recorded. See [release notes](../releases/v1.6.2.md), [rollout plan](../releases/v1.6.2-rollout.md) and the [accepted verification limits](../research/v1.6.2-barcode-verification-acceptance.md).

# PantryBot Wiki

> v1.6.1 was released November 8, 2026 with 222 reviewed ingredients. The [final audit](../research/v1.6.1-release-audit.md) passes locally; all eight hosted migrations and 222 IDs are verified. Production independent-session/API and guest-browser verification pass; disposable test data is cleaned up. See the [release notes](../releases/v1.6.1.md).


> v1.6.0 introduces [Virtual Pantry](Virtual-Pantry.md), explicit boolean availability, private guest/account persistence, reviewed cooking ingredients, and recipe/shopping coverage. See the [release notes](../releases/v1.6.0.md) and [rollout guide](../usda-catalog-integration.md).

> v1.5.2 adds visible source/package details, USDA-only history statistics, a hypothetical score calculator, canonical ingredient explanations, and bounded active-market collection. See the [release notes](../releases/v1.5.2.md).

> v1.5.1: The public [Data Explorer](https://pantrybot.dev/data) connects stored price history, exact score arithmetic, ingredient grouping rationale, raw source rows, and CSV/JSON exports. See the [explorer guide](../data-explorer.md) and [release notes](../releases/v1.5.1.md). Production uses stored verified data; previews without server database credentials use labeled demonstration data.

> v1.5.0: Shared market history now uses Supabase; USDA is ingested only in authenticated Wednesday batches. Current validated sources supply national retail benchmarks, not Mountain or wholesale forecasts. SQLite history is an offline demonstration fallback. The [market-data runbook](../usda-market-data.md) supersedes the historical pipeline descriptions below.


Welcome to the project wiki for **PantryBot** — the **Smart Grocery Deal Tracker, Virtual Pantry & Weekend Meal-Prep Optimizer** (`v1.6.1`, live at [pantrybot.dev](https://pantrybot.dev)).

## Purpose

PantryBot bridges **macro agricultural supply data (USDA)**, **wholesale club bulk baselines (Costco & Sam's Club)**, and **hyper-local supermarket weekly circulars (Kroger/King Soopers, Safeway/Albertsons, ALDI, Walmart, Target, and Sprouts)** to answer one practical question every weekend:

> *"What are the highest-value proteins, produce, and dairy items in my ZIP code right now, which sale ingredients should I buy after checking my Virtual Pantry, and what 3 reheatable batch meals should I cook this weekend to hit my macro/dietary goals under $2.00/serving?"*

---

## Wiki Navigation

1. **[Architecture & Data Pipeline](./Architecture-and-Data-Pipeline.md)**
   * How the 4-layer ingestion and benchmarking pipeline merges Flipp weekly circulars across 6 supermarket chains, the Kroger Official Developer API, USDA MyMarketNews (MARS v1.2), and the Wholesale Club Bulk Price Normalizer (Costco Kirkland & Sam's Club Member's Mark).
   * How the Canonical Ingredient Engine normalizes messy ad units (`ea`, `oz`, `5 lb bag`) into standard `$/lb` and `$/doz`.
   * How Supabase PostgreSQL (with Row-Level Security) and SQLite persist user accounts, preferences, 6-week historical price trends, custom recipes, and the **private Virtual Pantry**.
2. **[Scoring, Pantry Availability & 3-Dish Meal Prep Engine](./Scoring-and-Meal-Prep-Engine.md)**
   * Mathematical breakdown of the **Workhorse Value Score (0–100)**, **6-Week Cycle Floor vs. Peak Signals**, and **Wholesale Club Benchmarks**.
   * How the **Multi-Week Arbitrage Engine (`"❄️ Buy 2: Prep 1, Freeze 1"`)** and **explicit Pantry availability** work.
   * How **Macro Goals (`High-Protein`, `Low-Carb / Keto`, `Calorie-Conscious`)**, **Dietary Rules (`Gluten-Free`, `Dairy-Free`, `Nut-Free`, `Pescatarian`)**, and **Cooking Vessel Archetypes (`Slow Cooker / Instant Pot`, `Sheet-Pan / 9x13`, `Dutch Oven`, `Skillet`)** dynamically adapt recipe slots.
   * How the **1-Tap Curbside Cart Bridge & Multi-Store Exporter** connects to Walmart, Target, Kroger, Safeway, Sprouts, ALDI, Instacart, and Apple Notes / Google Keep.
3. **[API Keys & Developer Setup Guide](./API-Keys-and-Local-Setup.md)**
   * How to run the app with zero keys vs. how to register for free-tier keys from Google AI Studio, USDA MARS, the Kroger Developer Portal, and Supabase.
4. **[OpenAPI 3.1 & Swagger UI Console](./OpenAPI-and-Swagger-Documentation.md)**
   * Production OpenAPI 3.1 REST specification (`/api/openapi.json`), interactive Swagger UI testing console (`/docs`), and endpoint documentation across all 8 backend API domains.
5. **[Project Roadmap (`ROADMAP.md`)](../../ROADMAP.md)**
   * Historical milestones, current release scope and future mobile plans.
6. **[Release Notes (`docs/releases/`)](../releases/)**
   * **[v1.6.3 — Pantry Access Repair & Freezer Retirement](../releases/v1.6.3.md)**
   * **[v1.6.2 — Barcode Entry & Static Staple Estimates](../releases/v1.6.2.md)**
   * **[v1.6.1 — Pantry Catalog Expansion](../releases/v1.6.1.md)**
   * **[v1.6.0 — Virtual Pantry](../releases/v1.6.0.md)**
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

## v1.4.1 release record

Current planning cycles, verified live prices, explicit estimates and refresh audit status are documented in [weekly refresh operations](../weekly-refresh.md). See [v1.4.1 release notes](../releases/v1.4.1.md) for the complete scope, including the previously reviewed account and cloud-sync fixes.

## Virtual Pantry implementation and release history

See [Virtual Pantry](Virtual-Pantry.md) for the v1.6.0 boolean inventory contract, recipe-use cost assumptions, compatibility fences, and rollout requirements. Stage 2 retires the quantity-based Freezer UI and writers, retaining original storage for migration, recovery and export. The v1.6.3 candidate awaits production acceptance; historical production records describe activation separately.

The approved [USDA catalog ingestion standards](../specs/usda-catalog-ingestion.md) define recurring source review and a compact cooking-ingredient catalog, including optional varieties and safe updates. Candidate records remain separate from published search choices.

## Release planning and retrospective evidence

Use the [current-release board](https://github.com/users/kchavez05/projects/1/views/2) and [tracking workflow](../issue-release-tracking.md) for live work. The [November 11 retrospective audit](../releases/retrospective-audit-2026-11-11.md) links the backfilled v1.3.1–v1.6.1 milestones and distinguishes verified release gates from historical evidence gaps.
