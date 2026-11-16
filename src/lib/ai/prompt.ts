import { activeCookingIngredients } from '@/lib/pantry/model';
import type { RecipeGenerationContext } from './types';

export function buildRecipePrompt(context: RecipeGenerationContext): string {
  const { onHandIngredientIds, pinnedIngredientIds, dashboard, cityLabel, zipCode, targetServings, macroGoal, dietaryConstraints, applianceFilter, customPreference } = context;
    const onHandSet = new Set(onHandIngredientIds);

    const topDealsContext = dashboard.commodities.slice(0, 18).map((c) => ({
      ingredientId: c.ingredient.id,
      name: c.ingredient.name,
      category: c.ingredient.category,
      unit: c.ingredient.standardUnit,
      bestStore: c.bestOffer.store,
      normalizedPricePerUnit: c.bestOffer.normalizedPricePerUnit,
      regularPricePerUnit: c.bestOffer.regularPricePerUnit,
      rawDealText: c.bestOffer.rawPriceText,
      dealType: c.bestOffer.dealType,
      dealConditions: c.bestOffer.dealConditions,
      isUserPinned: pinnedIngredientIds.includes(c.ingredient.id),
      isOnHand: onHandSet.has(c.ingredient.id),
    }));

    return `You are a weekend meal-prep chef and grocery value optimizer for a household in ${cityLabel} (${zipCode}) shopping at local supermarkets.
The user strongly prefers LOW-EFFORT, REHEATABLE BATCH MEALS: stews, slow-cooker braises, Dutch oven chilis, curries, sheet-pan roasts, and 9x13 oven casseroles/bakes over multi-component plated meals.
We need exactly 3 distinct batch-prep dishes (${targetServings} servings each) that maximize use of the cheapest on-sale ingredients below (favor available and pinned ingredients when compatible with strict dietary constraints).

Household Nutrition & Cooking Profile (Milestone v1.2):
- Target Macro Profile: ${macroGoal} ${macroGoal === 'HIGH_PROTEIN' ? '(Target >= 40g protein per serving)' : macroGoal === 'LOW_CARB_KETO' ? '(Target <= 20g net carbs per serving; use cauliflower, cabbage, zucchini, mushrooms, or greens instead of potatoes/beans)' : macroGoal === 'CALORIE_CONSCIOUS' ? '(Target <= 460 kcal per serving)' : '(Balanced macros)'}
- Strict Dietary Constraints: ${dietaryConstraints.length > 0 ? dietaryConstraints.join(', ') : 'None'}
- Preferred Cooking Vessel Archetype: ${applianceFilter}
- User custom note/request: "${customPreference || 'Low-effort reheatable stews, braises, sheet-pan roasts, chilis, or casseroles with great flavor variety across the 3 dishes.'}"

Live ${cityLabel} (${zipCode}) Sale Ingredients JSON:
${JSON.stringify(topDealsContext, null, 2)}

${`Available catalog IDs: ${JSON.stringify(onHandIngredientIds)}. Pantry availability is boolean and does not imply quantity sufficiency. Favor available ingredients only when compatible with strict dietary constraints and the user request. Never deduct inventory. Put every staple in pantryRequirements using an exact catalog ID, quantity for the entire batch, and the listed kitchen unit. Use an unmapped ID and displayName for ingredients outside this catalog; never invent an identity or price. pantryStaples must be empty when pantryRequirements are supplied. Cooking catalog (missing staticPrice means unpriced): ${JSON.stringify(activeCookingIngredients.map(({ id, name, staticPrice }) => ({ id, name, staticPrice })))}`}

Calculate realistic batch costs using the exact normalizedPricePerUnit values provided (set slotCost to 0 if isOnHand is true).`;

}
