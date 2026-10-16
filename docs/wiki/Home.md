# Produce & Commodity Meal-Prep Tracker Wiki

Welcome to the project wiki for the **Mead, CO (`80542`) Produce & Commodity Meal-Prep Value Tracker**.

## Purpose

This application bridges **macro agricultural supply data (USDA)** and **hyper-local grocery circular promotions (King Soopers & Safeway)** to answer one practical question every weekend:

> *"What are the highest-value proteins, produce, and dairy items in Mead/Longmont right now, and what 3 reheatable one-pot meals (stews, braises, chilis, curries, or casseroles) should we batch-prep this weekend to maximize savings?"*

---

## Wiki Navigation

1. **[Architecture & Data Pipeline](./Architecture-and-Data-Pipeline.md)**
   * How the 3-tier ingestion pipeline merges Flipp `80542` weekly circulars, the Kroger Official Developer API, and USDA MyMarketNews (MARS v1.2).
   * How the Canonical Ingredient Engine normalizes messy ad units (`ea`, `oz`, `5 lb bag`) into standard `$/lb` and `$/doz`.
2. **[Scoring & 3-Dish Meal Prep Engine](./Scoring-and-Meal-Prep-Engine.md)**
   * Mathematical breakdown of the **Workhorse Value Score (0–100)**.
   * Detection rules for **💎 Splurge Value Alerts** and **Wholesale Momentum Signals**.
   * How the **Stew & Casserole Slot Matcher** and **Gemini 2.5 Flash Free-Tier Chef** work together.
3. **[API Keys & Developer Setup Guide](./API-Keys-and-Local-Setup.md)**
   * How to run the app with zero keys vs. how to register for free-tier keys from Google AI Studio, USDA MARS, and the Kroger Developer Portal.
4. **[Project Roadmap (`ROADMAP.md`)](../../ROADMAP.md)**
   * Milestones (`v0.1` PoC through `v1.0` Cloud Deployment), active GitHub Issues, and upcoming features.
5. **[North Star: Native iOS/Android & Feature Expansion Blueprint](./Long-Term-Mobile-and-Expansion-Roadmap.md)**
   * Multi-horizon strategy (`v1.5`–`v3.0`) for packaging into native iOS & Android apps (Expo / React Native), camera shelf-tag OCR, Live Activities, freezer arbitrage loop, and nationwide multi-store expansion.

---

## Quick Reference: Target Geography & Stores

* **Primary Zip Code:** `80542` (Mead, CO — serving Firestone & Longmont grocery corridors)
* **Tracked Grocery Chains:**
  * **King Soopers (Kroger Banner):** Firestone Blvd (`#01400100`) & Longmont locations
  * **Safeway (Albertsons Banner):** Hover St & Ken Pratt Blvd Longmont locations
* **Weekly Circular Cycle:** Wednesday 12:01 AM – Tuesday 11:59 PM MT
* **Primary Meal Prep Output:** 3 batch dishes × 6 servings each = **18 reheatable meals/week**
