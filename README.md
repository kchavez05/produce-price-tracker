# PantryBot — Commodity & Meal Prep Value Tracker (80542)

A mobile-friendly Next.js web application (**PantryBot**) designed for weekend meal-prep planning in **Mead / Longmont / Firestone, Colorado (`80542`)**.

It compares local **King Soopers** and **Safeway** weekly sales and digital coupons against **USDA Mountain Region retail & wholesale commodity signals** across **Meat/Poultry/Seafood, Fresh Produce, and Dairy/Eggs**, and recommends **3 low-effort, reheatable batch dishes (stews, braises, chilis, curries, and 9x13 casseroles)**.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Optional API Keys (`.env.local`)

The app works **100% out-of-the-box with zero API keys** using the Flipp `80542` circular feed, Mead weekly store dataset, USDA Mountain Region baselines, and the internal Stew/Casserole Algorithmic Matcher.

To enable optional live integrations, copy `.env.example` to `.env.local`:

* **`GEMINI_API_KEY`**: Free-tier key from [Google AI Studio](https://aistudio.google.com/apikey) (`gemini-2.5-flash`). You can also paste this directly in the **API Keys** button in the top navigation bar.
* **`USDA_MARS_API_KEY`**: Free key from [USDA MyMarketNews](https://mymarketnews.ams.usda.gov/) for live report slugs `3324`, `3228`, `2868`, `2756`, and `2995`.
* **`KROGER_CLIENT_ID` / `KROGER_CLIENT_SECRET`**: Free credentials from [Kroger Developer Portal](https://developer.kroger.com/) for unadvertised King Soopers shelf prices.

## Documentation, Wiki & Roadmap

* **[Project Roadmap (`ROADMAP.md`)](./ROADMAP.md)** — Milestones (`v0.1` through `v1.0`) and planned feature tickets.
* **[Wiki Home (`docs/wiki/Home.md`)](./docs/wiki/Home.md)**
  * [Architecture & Data Pipeline](./docs/wiki/Architecture-and-Data-Pipeline.md)
  * [Scoring & 3-Dish Meal Prep Engine](./docs/wiki/Scoring-and-Meal-Prep-Engine.md)
  * [API Keys & Developer Setup Guide](./docs/wiki/API-Keys-and-Local-Setup.md)

