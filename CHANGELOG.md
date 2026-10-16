# Changelog

All notable changes to **PantryBot** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
