# Scoring & 3-Dish Meal Prep Engine

## 1. Workhorse Value Score Formula (0–100)

Because the application prioritizes **real-world meal prep affordability** over deceptive marketing percentages, each canonical ingredient is scored using a weighted composite formula (`src/lib/scoring-and-matcher.ts`):

$$\text{ValueScore} = (0.55 \times \text{AffordabilityScore}) + (0.35 \times \text{DiscountDepthScore}) + (0.10 \times \text{WholesaleBonusScore})$$

### Component Breakdown
1. **Absolute Affordability Score (55% Weight):**
   * Evaluates normalized `$/lb` (or `$/doz`) within the item's category (`PROTEIN`, `PRODUCE`, `DAIRY_EGGS`).
   * *Proteins:* $\le \$1.25/\text{lb} = 100$ | $\$2.00/\text{lb} \approx 90$ | $\$3.00/\text{lb} \approx 74$ | $\$4.00/\text{lb} \approx 58$.
   * *Produce:* $\le \$0.60/\text{lb} = 100$ | $\$1.00/\text{lb} \approx 88$ | $\$2.00/\text{lb} \approx 60$.
   * Ensures that a $1.49/lb Pork Shoulder or $0.99/lb Chicken Thigh outranks an $8.99/lb Ribeye on the main meal-prep leaderboard.
2. **Discount Depth Score (35% Weight):**
   * Compares the best local sale price against both the **USDA Mountain Region baseline** and the store's **regular shelf price**.
   * $50\%+$ discount earns `100 pts`.
3. **Wholesale Momentum Bonus (10% Weight):**
   * Rewards items at a **USDA Cycle Floor** (peak seasonal harvest / oversupply) or items flagged as **Buy Before Spike** (where wholesale prices jumped this week while local retail is still running a promo).

---

## 2. Splurge Value Alerts (`💎`)

Higher-cost cuts and specialty produce shouldn't clutter the budget staple top 5, but you still want to know when a premium ingredient is at a massive discount.

An item triggers `isSplurgeAlert = true` when:
1. Its regular price is above the premium threshold ($\ge \$4.75/\text{lb}$ for proteins or $\ge 78\%$ of its category splurge threshold), **AND**
2. Its current sale price is **$\ge 38\%$ off regular price** (or $\ge 30\%$ below the Mountain Region baseline).

*Examples:* USDA Choice Chuck Roast at `$3.97/lb` (Reg `$7.99`), NY Strip Steak at `$5.97/lb` (Reg `$12.99`), Atlantic Salmon at `$6.97/lb` (Reg `$11.99`).

---

## 3. Two-Stage 3-Dish Meal Prep Engine

The meal planner focuses on **low-effort, reheatable 6-serving batch dishes** (`STEW_BRAISE`, `CHILI_SOUP`, `CASSEROLE_BAKE`, `CURRY_SKILLET`).

### Stage 1: Deterministic Blueprint Slot Matcher (`rankMealPrepDishes`)
* Evaluates every blueprint in `src/data/meal-prep-blueprints.ts`.
* Each blueprint defines modular slots (`primary_protein`, `stew_starch`, `chile_base`, `dairy_topper`, etc.) with exact poundage required for 6 hearty servings.
* For each slot, the matcher selects the best candidate ingredient:
  1. **User-Pinned Anchors first** (if you pinned an ingredient on the Value Board, dishes using that ingredient get a `+25 pt` per-slot boost and lock that ingredient into the slot).
  2. **Highest `valueScore` candidate** from this week's King Soopers & Safeway deals.
* Computes exact **Batch Cost**, **Cost Per Serving**, and **Batch Savings vs. Regular Price**, then selects a **Diverse Top 3 Trio** (preventing duplicate primary proteins unless pinned).

### Stage 2: Gemini 2.5 Flash Free-Tier Chef (`/api/ai-meal-plan`)
* Uses the official `@google/genai` SDK (`gemini-2.5-flash`) with a strict JSON `responseSchema`.
* Feeds the top 18 normalized local deals + any user-pinned anchors + custom user instructions (e.g., *"Use the slow cooker and make it spicy"*) to generate 3 custom batch recipes with live Mead, CO store pricing.
