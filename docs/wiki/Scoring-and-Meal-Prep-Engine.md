> v1.6.0: Pantry availability uses explicit Yes/No and reviewed identities/forms. Available requirements cost $0 additional, retain recipe quantities under “Make sure you have,” and are omitted from shopping. Distinct required coverage includes staples; ownership is not measured savings. Fresh onions and onion powder never satisfy each other. Buying/cooking never writes inventory.

> v1.5.1 update: The [Data Explorer](https://pantrybot.dev/data?tab=score) exposes the shared 55/35/10 scoring calculation and its inputs. Verified-history scoring uses a neutral market-signal score of 60/100 (six weighted points), not measured wholesale momentum. Six-week-low badges require six observed local weeks and a price within $0.05 of the observed low with at least 32% off regular price; discount-only cases receive a separate label. The [explorer guide](../data-explorer.md) supersedes conflicting historical descriptions below.

# Scoring, Pantry Availability & 3-Dish Meal Prep Engine

> v1.5.0: Shared market history now uses Supabase; USDA is ingested only in authenticated Wednesday batches. Current validated sources supply national retail benchmarks, not Mountain or wholesale forecasts. SQLite history is an offline demonstration fallback. The [market-data runbook](../usda-market-data.md) supersedes the historical pipeline descriptions below.


## 1. Workhorse Value Score Formula (0–100)

Because PantryBot prioritizes **real-world meal prep affordability** over deceptive marketing percentages, each canonical ingredient is scored using a weighted composite formula (`src/lib/scoring-and-matcher.ts`):

$$\text{ValueScore} = (0.55 \times \text{AffordabilityScore}) + (0.35 \times \text{DiscountDepthScore}) + (0.10 \times \text{WholesaleBonusScore})$$

### Component Breakdown
1. **Absolute Affordability Score (55% Weight):**
   * Evaluates normalized `$/lb` (or `$/doz`) within the item's category (`PROTEIN`, `PRODUCE`, `DAIRY_EGGS`).
   * *Proteins:* $\le \$1.25/\text{lb} = 100$ | $\$2.00/\text{lb} \approx 90$ | $\$3.00/\text{lb} \approx 74$ | $\$4.00/\text{lb} \approx 58$.
   * *Produce:* $\le \$0.60/\text{lb} = 100$ | $\$1.00/\text{lb} \approx 88$ | $\$2.00/\text{lb} \approx 60$.
   * Ensures that a `$1.49/lb` Pork Shoulder or `$0.99/lb` Chicken Thigh outranks an `$8.99/lb` Ribeye on the main meal-prep leaderboard.
2. **Discount Depth Score (35% Weight):**
   * Compares the best local sale price against both the **USDA Regional baseline** and the store's **regular shelf price**.
   * $50\%+$ discount earns `100 pts`.
3. **Wholesale Momentum Bonus (10% Weight):**
   * Rewards items at a **USDA Cycle Floor** (peak seasonal harvest / oversupply) or items flagged as **Buy Before Spike** (where wholesale prices jumped this week while local retail is still running a promo).

---

## 2. Splurge Value Alerts (`💎`) & 6-Week Cycle Signals (`v1.2`)

### Splurge Value Alerts (`💎`)
An item triggers `isSplurgeAlert = true` when:
1. Its regular price is above the premium threshold ($\ge \$4.75/\text{lb}$ for proteins or $\ge 78\%$ of its category splurge threshold), **AND**
2. Its current sale price is **$\ge 38\%$ off regular price** (or $\ge 30\%$ below the regional baseline).

### "Stock Up vs. Wait" Predictive Cycle Signals (`computeCycleSignalsAndSubstitutions`)
Using longitudinal SQLite price history (`sixWeekLow`, `sixWeekHigh`, `sixWeekMedian`), every commodity is classified into one of three cycle states:
* **`🟢 STOCK_UP_6WK_LOW` (`Stock Up Alert`):** Current sale price is at or within $5\%$ of its 6-week floor (or $\ge 40\%$ off regular price).
* **`🟡 NORMAL_RANGE` (`Fair Sale Price`):** Standard mid-cycle promotional price.
* **`🔴 CYCLE_PEAK_WAIT` (`Cycle Peak — Wait / Swap`):** Near its 6-week high or $<10\%$ off regular shelf price. Automatically attaches an in-category **Smart Substitution** recommendation currently on a $>25\%$ sale.

---

## 3. Pantry availability and stock-up suggestions

Stock-up prompts identify purchase opportunities; clicking opens Pantry for explicit review. They never add quantities, deduct inventory or record banked savings. Recipe availability comes only from private Pantry entries marked Yes. Available requirements cost $0 additional and leave shopping needs, while recipe quantities remain visible under “Make sure you have.” Quantity, dates and storage location never change Yes/No. Missing prices remain unpriced; an owned ingredient does not imply a sufficient quantity.

Stage 2 removes Freezer inputs and flags from ranking, AI context and shopping. Historical saved recipe metadata is ignored and removed from current evaluation. Original purchase records remain in the migration/archive/export path; storage deletion is a separate future stage.

## 4. Personalized Nutrition, Dietary & Cooking Vessel Engine (`v1.2`)

### Dynamic Slot Adaptation (`adaptSlotForDietaryAndMacros`)
* **`LOW_CARB_KETO` Mode:** Automatically swaps high-carb starch slots (Russet Potatoes, Yukon Golds, Rice, Pasta, Beans) to `lowCarbCandidateIds` (Cauliflower, Green Cabbage, Broccoli Crowns, Green Beans) and recalculates batch macros (`-28g` net carbs/serving).
* **`DAIRY_FREE` Constraint:** Automatically omits `isDairySlot` ingredients (Shredded Cheese, Butter, Sour Cream, Greek Yogurt) from recipe calculations and shopping lists.
* **Macro & Vessel Scoring:** Boosts blueprints matching the active `MacroGoal` (`HIGH_PROTEIN`, `LOW_CARB_KETO`, `CALORIE_CONSCIOUS`, `BALANCED_FAMILY`) and `CookingVesselArchetype` (`SLOW_COOKER_INSTANT_POT`, `CASSEROLE_SHEET_PAN`, `DUTCH_OVEN_BRAISE`, `BIG_BATCH_SKILLET`).
* **Provider-neutral AI (`/api/ai-meal-plan`, v1.7):** Verified-account requests use provisional GPT-6.1 Terra with dietary/macro/vessel settings and pantry context. Application schema/catalog validation and repricing remain authoritative. Durable admission reserves cost before one generation attempt; standard suggestions remain available. No automatic failover or inventory mutation. See the [selected-provider evidence](../research/v1.7-selected-provider-integration.md) and [usage runbook](../operations/ai-usage-controls.md).

---

## 5. Universal Basket Optimizer & 1-Tap Curbside Cart Bridge (`v1.1` + `v1.2`)

* **Universal N-Store Basket Engine:** Evaluates all active stores (`Kroger`, `Safeway`, `ALDI`, `Walmart`, `Target`, `Sprouts`) to rank 1-stop shopping trips and compute the optimal $\binom{N}{2}$ **Best 2-Store Split**.
* **1-Tap Curbside Cart Bridge (`src/lib/cart-exporter.ts`):** Generates deep search URLs for Walmart Grocery, Target Drive Up, localized Kroger & Albertsons banners, Sprouts, ALDI, and Instacart, plus aisle-categorized Apple Notes / Google Keep checklists and a printable kitchen slip.

## Staged Virtual Pantry implementation

See [Virtual Pantry](Virtual-Pantry.md) for the v1.6.0 boolean inventory contract, recipe-use cost assumptions, compatibility fences, and rollout requirements. Stage 2 has no flag-off path. Retirement awaits release; prior version notes remain historical.
