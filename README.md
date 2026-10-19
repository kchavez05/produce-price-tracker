# PantryBot — Smart Grocery Deal Tracker, Virtual Freezer & Meal-Prep Optimizer (`v1.3.1`)

A mobile-friendly Next.js Progressive Web App (**PantryBot**, live at [pantrybot.dev](https://pantrybot.dev)) designed for nationwide grocery circular comparison, multi-week **Virtual Freezer** protein arbitrage, wholesale club benchmarking, **3-Dish Weekend Meal-Prep Planning**, and privacy-first **Cloud Sync** across devices.

## Key Features (`v1.3.1`)

* **User Accounts, SSO & Cross-Device Cloud Sync:** Optional 1-click **Sign in with Google** and **Sign in with Apple** via Supabase Auth + PostgreSQL Row-Level Security (RLS) (with automatic zero-key SQLite multi-tenant fallback). Syncs ZIP code, preferred stores, macro/dietary goals, cooking vessels, Virtual Freezer inventory, and saved recipes across devices with automatic Guest-to-Account migration, 1-click JSON export, and self-serve GDPR/CCPA account deletion.
* **6-Vendor Supermarket Ecosystem + Nationwide ZIP Support:** Compares weekly circular deals and digital loyalty coupons across **Kroger** (King Soopers, Ralphs, Fred Meyer, Fry's), **Albertsons** (Safeway, Vons, Jewel-Osco), **ALDI**, **Walmart**, **Target**, and **Sprouts Farmers Market** for any 5-digit US ZIP code.
* **Persistent Virtual Freezer & Multi-Week Arbitrage (`"❄️ Buy 2: Prep 1, Freeze 1"`):** Detects deep 6-week cycle lows (`>38%` off / `💎 Splurge` alerts), banks extra roasts into a persistent Cloud + SQLite + `localStorage` Virtual Freezer, and automatically substitutes banked proteins into future 3-Dish Meal-Prep plans at **`$0.00` out-of-pocket cost**.
* **Dietary, Macro & Cooking Vessel Personalization:** Customize **Macro Goals** (`High-Protein 40g+`, `Low-Carb / Keto`, `Calorie-Conscious <460 kcal`, `Balanced`), **Dietary Rules** (`Gluten-Free`, `Dairy-Free`, `Nut-Free`, `Pescatarian`) with automatic ingredient slot adaptation, and **Cooking Vessels** (`Slow Cooker / Instant Pot`, `Sheet-Pan / 9x13`, `Dutch Oven`, `Skillet`).
* **Wholesale Club Price Normalizer (Costco & Sam's Club):** Benchmarks supermarket unit prices (`$/lb`, `$/doz`) against **Costco (Kirkland Signature)** and **Sam's Club (Member's Mark)** bulk baselines (`🏆 Beats Costco/Sam's Bulk -X%`).
* **"Stock Up vs. Wait" Predictive Cycle Signals:** Classifies every commodity into `🟢 Stock Up Alert (6-Wk Low)`, `🟡 Fair Sale Price`, or `🔴 Cycle Peak (Wait / Swap)` with automatic in-category smart substitution suggestions.
* **1-Tap Curbside Cart Bridge & Checklist Export:** Deep links directly into **Walmart Grocery**, **Target Drive Up**, **Kroger**, **Safeway**, **Sprouts**, **ALDI**, and **Instacart** search, plus 1-tap **Apple Notes / Google Keep** aisle-grouped checklists and a printable kitchen slip.

## Quick Start

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

* **[Project Roadmap (`ROADMAP.md`)](./ROADMAP.md)** — Milestones (`v0.1` through `v1.3`) and upcoming native mobile roadmap (`v1.5+`).
* **[Changelog (`CHANGELOG.md`)](./CHANGELOG.md)** — Version history following Keep a Changelog.
* **[Release Notes (`docs/releases/`)](./docs/releases/)**
  * [v1.3.1 — 3-Tier CI Test Automation & Branch Quality Gates](./docs/releases/v1.3.1.md)
  * [v1.3.0 — User Accounts, Cloud Sync & Legal Foundation](./docs/releases/v1.3.0.md)
  * [v1.2.0 — Smart Kitchen, Virtual Freezer & Cart Bridge](./docs/releases/v1.2.0.md)
  * [v1.1.0 — Multi-Vendor Expansion & Universal Basket Optimizer](./docs/releases/v1.1.0.md)
  * [v1.0.0 — Production Launch (`pantrybot.dev`)](./docs/releases/v1.0.0.md)
* **[Wiki Home (`docs/wiki/Home.md`)](./docs/wiki/Home.md)**
  * [Architecture & Data Pipeline](./docs/wiki/Architecture-and-Data-Pipeline.md)
  * [Scoring, Virtual Freezer Arbitrage & 3-Dish Meal Prep Engine](./docs/wiki/Scoring-and-Meal-Prep-Engine.md)
  * [API Keys & Developer Setup Guide](./docs/wiki/API-Keys-and-Local-Setup.md)
  * [OpenAPI 3.1 & Swagger UI Console](./docs/wiki/OpenAPI-and-Swagger-Documentation.md) (Interactive console live at [`/docs`](https://pantrybot.dev/docs))
  * [North Star: Native iOS/Android & Feature Expansion Blueprint](./docs/wiki/Long-Term-Mobile-and-Expansion-Roadmap.md)
