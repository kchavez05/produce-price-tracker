# Changelog

All notable changes to **PantryBot** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

---

## [Unreleased]
- Ongoing improvements and bugfixes tracked on branch `develop`.
- See [ROADMAP.md](./ROADMAP.md) and [Long-Term Mobile Architecture](./docs/wiki/Long-Term-Mobile-and-Expansion-Roadmap.md) for upcoming v1.1+ and native mobile milestones.
