import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMockCommodity, createMockDish, createMockIngredient } from 'tests/test-utils';
import { generateMealPlan } from '@/lib/ai/meal-plan';
import { parseGeneratedDishes } from '@/lib/ai/validate';
import type { RecipeGenerationContext, RecipeProvider } from '@/lib/ai/types';

const commodity = createMockCommodity({ ingredient: createMockIngredient({ id: 'ground-turkey', name: 'Ground turkey', category: 'PROTEIN' }) });
const context: RecipeGenerationContext = { dashboard: { commodities: [commodity] }, pinnedIngredientIds: ['ground-turkey'],
  onHandIngredientIds: ['olive-oil'], targetServings: 6, customPreference: '', zipCode: '80542', cityLabel: 'Test city',
  macroGoal: 'ANY', dietaryConstraints: ['NUT_FREE'], applianceFilter: 'ANY' };
const plan = () => [0, 1, 2].map(i => createMockDish({ title: `Plan ${i}`, pantryRequirements: [] }));
afterEach(() => vi.useRealTimers());

describe('provider-independent recipe contract', () => {
  it('runs a non-Google implementation through the same app-owned pricing and metadata boundary', async () => {
    const input = plan().map(dish => ({ ...dish, id: 'reviewed-blueprint-id', savedInLibrary: true,
      dietaryTags: ['DAIRY_FREE'], pantryStaples: [], estimatedPantryCost: 900,
      pantryRequirements: [{ ingredientId: 'olive-oil', quantity: 3, unit: 'tbsp' },
        { ingredientId: 'garlic-fresh', quantity: 4, unit: 'clove' }],
      matchedIngredients: [{ slotLabel: 'Protein', ingredientId: 'ground-turkey', ingredientName: 'Wrong label', quantityUsed: 2,
        unit: 'lb', store: 'SAFEWAY', rawDealText: 'invented', dealType: 'MULTI_BUY', unitCost: 999, slotCost: 999,
        regularSlotCost: 9999, isUserPinned: false, isOnHand: true, optional: true }] }));
    const generate = vi.fn<RecipeProvider['generate']>().mockResolvedValue({ text: JSON.stringify(input) });
    const result = await generateMealPlan({ generate }, context);
    expect(generate).toHaveBeenCalledOnce();
    expect(generate.mock.calls[0][0]).toMatchObject({ maxOutputTokens: 6000, schema: { type: 'array' } });
    expect(generate.mock.calls[0][0].prompt).toContain('Available catalog IDs: ["olive-oil"]');
    expect(generate.mock.calls[0][0].system).toContain('untrusted data');
    expect(new Set(result.map(dish => dish.id)).size).toBe(3);
    expect(result[0]).toMatchObject({ aiGenerated: true, savedInLibrary: false, dietaryTags: ['NUT_FREE'],
      totalBatchCost: 4.30, estimatedPantryCost: .32 });
    expect(result[0].id).toMatch(/^ai-dish-/);
    expect(result[0].matchedIngredients[0]).toMatchObject({ isOnHand: false, isUserPinned: true, unitCost: 1.99, slotCost: 3.98 });
    expect(result[0].matchedIngredients[0]).not.toHaveProperty('optional');
  });
  it.each(['not json', '{}', '[]', JSON.stringify(plan().slice(0, 2)), ' '.repeat(256001)])('rejects incomplete, malformed or oversized output', text => {
    expect(() => parseGeneratedDishes(text, 6)).toThrow('unusable response');
  });
  it.each(['quantity', 'servings', 'identity', 'duplicate', 'nonfinite', 'steps'])('rejects unsafe %s rather than repairing it', kind => {
    const dishes = plan();
    if (kind === 'quantity') dishes[0].pantryRequirements = [{ ingredientId: 'olive-oil', quantity: 0, unit: 'tbsp' }];
    if (kind === 'servings') dishes[0].servings = 0;
    if (kind === 'identity') dishes[0].pantryRequirements = [{ ingredientId: 'invented-catalog-id', quantity: 1, unit: 'tsp' }];
    if (kind === 'duplicate') dishes[1].title = dishes[0].title;
    if (kind === 'nonfinite') dishes[0].macrosPerServing.calories = Infinity;
    if (kind === 'steps') dishes[0].steps = [];
    expect(() => parseGeneratedDishes(JSON.stringify(dishes), 6)).toThrow('unusable response');
  });
  it('retains explicitly unmapped ingredients as unpriced, without making up catalog IDs', async () => {
    const dishes = plan().map(dish => ({ ...dish, pantryStaples: [], pantryRequirements: [
      { ingredientId: 'unmapped:seasoning', displayName: 'Special seasoning', quantity: 1, unit: 'tsp' },
    ] }));
    const result = await generateMealPlan({ generate: async () => ({ text: JSON.stringify(dishes) }) }, context);
    expect(result[0].additionalCostEstimateComplete).toBe(false);
    expect(result[0].missingPriceIngredientIds).toContain('unmapped:seasoning');
  });
  it('accepts supplied market-slot IDs without treating broad market groups as pantry identities', () => {
    const dishes = plan();
    dishes[0].matchedIngredients = [{ slotLabel: 'Vegetables', ingredientId: 'broccoli-cauliflower', ingredientName: 'Broccoli',
      quantityUsed: 1, unit: 'lb', store: 'SAFEWAY', rawDealText: '', dealType: 'SHELF_OR_MEMBER', unitCost: 0,
      slotCost: 0, regularSlotCost: 0, isUserPinned: false }];
    expect(() => parseGeneratedDishes(JSON.stringify(dishes), 6, new Set(['broccoli-cauliflower']))).not.toThrow();
    expect(() => parseGeneratedDishes(JSON.stringify(dishes), 6, new Set(['ground-turkey']))).toThrow();
    dishes[0].pantryRequirements = [{ ingredientId: 'broccoli-cauliflower', quantity: 1, unit: 'lb' }];
    expect(() => parseGeneratedDishes(JSON.stringify(dishes), 6, new Set(['broccoli-cauliflower']))).toThrow();
  });
  it('does not disclose vendor errors or retry a failed provider', async () => {
    const generate = vi.fn<RecipeProvider['generate']>().mockRejectedValue(new Error('SECRET vendor body'));
    const pending = generateMealPlan({ generate }, context);
    await expect(pending).rejects.toMatchObject({ code: 'PROVIDER_UNAVAILABLE' });
    await expect(pending).rejects.not.toThrow('SECRET');
    expect(generate).toHaveBeenCalledOnce();
  });
  it('bounds completion even when a provider ignores cancellation', async () => {
    vi.useFakeTimers();
    const generate = vi.fn<RecipeProvider['generate']>(() => new Promise(() => {}));
    const pending = generateMealPlan({ generate }, context, { timeoutMs: 10 });
    const rejected = expect(pending).rejects.toMatchObject({ code: 'TIMEOUT' });
    await vi.advanceTimersByTimeAsync(10);
    await rejected;
    expect(generate.mock.calls[0][0].signal.aborted).toBe(true);
    expect(generate).toHaveBeenCalledOnce();
  });
  it('does not dispatch an already-cancelled request', async () => {
    const controller = new AbortController(); controller.abort();
    const generate = vi.fn<RecipeProvider['generate']>();
    await expect(generateMealPlan({ generate }, context, { signal: controller.signal })).rejects.toMatchObject({ code: 'TIMEOUT' });
    expect(generate).not.toHaveBeenCalled();
  });
});
