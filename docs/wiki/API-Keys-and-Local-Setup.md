> v1.6.0: After installing the pantry migrations, set `PANTRYBOT_PANTRY_ENABLED=true` to use Virtual Pantry. Local guest entry and deterministic recipes need no keys. See the [pantry guide](Virtual-Pantry.md) and [rollout guide](../usda-catalog-integration.md).

# API Keys & Developer Setup Guide

> v1.5.0: Shared market history now uses Supabase; USDA is ingested only in authenticated Wednesday batches. Current validated sources supply national retail benchmarks, not Mountain or wholesale forecasts. SQLite history is an offline demonstration fallback. The [market-data runbook](../usda-market-data.md) supersedes the historical pipeline descriptions below.


## Local Development

```bash
# Install dependencies
npm install

# Start development server at http://localhost:3000
npm run dev

# Verify production build & TypeScript types
npm run build
```

> **Note for macOS Homebrew Node 24:** If your shell defaults to an older Node version in `/usr/local/bin`, link Homebrew's Node 24 once with:
> ```bash
> brew link --overwrite node
> ```

---

## Progressive API Key Setup (`.env.local`)

The application is designed to run **100% out-of-the-box with zero API keys**. You can add any of the three free API keys below at your own pace by copying `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

### 1. Google Gemini Free Tier (`GEMINI_API_KEY`)
* **Cost:** **$0.00** (Free tier includes 15 requests/minute and 1,500 requests/day on `gemini-2.5-flash`).
* **Where to get it:** [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey)
* **How to configure:**
  * Either set `GEMINI_API_KEY=AIzaSy...` in `.env.local`, **OR**
  * Click the **API Keys** button in the top-right of the web UI and paste it directly.

### 2. USDA MyMarketNews MARS API (`USDA_MARS_API_KEY`)
* **Cost:** **$0.00** (Public US Government API).
* **Where to get it:** Sign up at [https://mymarketnews.ams.usda.gov/](https://mymarketnews.ams.usda.gov/) and generate an API key under your profile.
* **What it unlocks:** Live queries to USDA MARS v1.2 endpoints for Specialty Crops (`3324`), Beef (`3228`), Pork (`2868`), Poultry (`2756`), and Dairy (`2995`).

### 3. Kroger Developer API (`KROGER_CLIENT_ID` & `KROGER_CLIENT_SECRET`)
* **Cost:** **$0.00** (Public Developer Tier).
* **Where to get it:** Register a free app at [https://developer.kroger.com/](https://developer.kroger.com/) with the `product.compact` OAuth2 scope.
* **What it unlocks:** Live unadvertised shelf and promo pricing for specific King Soopers store `locationId`s near `80542` (e.g., Firestone `#01400100` or Longmont stores).

### 4. Supabase Auth & PostgreSQL Cloud Sync (`NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
* **Cost:** **$0.00** (Supabase Free Tier includes 50,000 MAU and 500 MB PostgreSQL database).
* **Where to get it:** Create a project at [https://supabase.com/dashboard](https://supabase.com/dashboard) and run the SQL migration in [`supabase/migrations/20261019000000_v1_3_multi_tenant_rls_schema.sql`](../../supabase/migrations/20261019000000_v1_3_multi_tenant_rls_schema.sql).
* **What it unlocks:** Cross-device Google and Apple OAuth SSO and multi-tenant PostgreSQL Row-Level Security (RLS) synchronization. When omitted, PantryBot automatically falls back to local multi-tenant SQLite accounts and `HttpOnly` session cookies.
