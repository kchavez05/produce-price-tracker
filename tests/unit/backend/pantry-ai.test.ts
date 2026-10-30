import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { createMockCommodity, createMockDish, createMockIngredient } from 'tests/test-utils';
const mocks = vi.hoisted(() => ({ generate: vi.fn(), build: vi.fn(), availability: vi.fn(), profile: vi.fn() }));
vi.mock('@google/genai', async (original) => ({ ...await original<typeof import('@google/genai')>(),
  GoogleGenAI: class { models = { generateContent: mocks.generate }; },
}));
vi.mock('@/lib/scoring-and-matcher', () => ({ buildDashboardPayload: mocks.build }));
vi.mock('@/lib/pantry/server', () => ({ readProfilePantryAvailability: mocks.availability }));
vi.mock('@/lib/supabase/session', () => ({ loadInventoryState: async () => ({ profile: { id: 'verified-owner', isCloudBacked: true }, freezerItems: [], savedRecipes: [] }), resolveCurrentUserProfile: mocks.profile }));
import { POST } from '@/app/api/ai-meal-plan/route';
const request = (body: object) => new NextRequest('http://localhost/api/ai-meal-plan', { method: 'POST', headers: { host: 'localhost', origin: 'http://localhost', 'content-type': 'application/json' }, body: JSON.stringify(body) });
const commodity = createMockCommodity({ ingredient: createMockIngredient({ id: 'ground-turkey', name: 'Ground turkey', category: 'PROTEIN' }) });
beforeEach(() => {
  vi.clearAllMocks(); vi.stubEnv('PANTRYBOT_PANTRY_ENABLED', 'true'); vi.stubEnv('GEMINI_API_KEY', '');
  mocks.availability.mockResolvedValue(['olive-oil']);
  mocks.build.mockResolvedValue({ commodities: [commodity], recommendedTrio: [createMockDish()], freezerInventory: [] });
  mocks.profile.mockResolvedValue({ profile: null });
});
afterEach(() => vi.unstubAllEnvs());
describe('AI pantry contract', () => {
  it('uses verified persisted availability for keyless fallback and accepts an explicit optimistic empty override', async () => {
    expect((await POST(request({}))).status).toBe(200);
    expect(mocks.build).toHaveBeenLastCalledWith(expect.objectContaining({ onHandIngredientIds: ['olive-oil'], freezerInventory: [] }));
    await POST(request({ onHandIngredientIds: ['unknown-custom-name'] }));
    expect(mocks.build).toHaveBeenLastCalledWith(expect.objectContaining({ onHandIngredientIds: [] }));
  });
  it('does not bypass verified-account authorization for a server-funded request', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'server-test-key');
    expect((await POST(request({ userId: 'forged-account' }))).status).toBe(401);
    expect(mocks.generate).not.toHaveBeenCalled();
  });
  it('reprices generated requirements and market slots instead of trusting model availability and cost', async () => {
    const modelDish = createMockDish({ pantryStaples: [], estimatedPantryCost: 900, pantryRequirements: [
      { ingredientId: 'olive-oil', quantity: 3, unit: 'tbsp' }, { ingredientId: 'garlic-fresh', quantity: 4, unit: 'clove' },
      { ingredientId: 'unmapped:seasoning', displayName: 'Special seasoning', quantity: 1, unit: 'tsp' },
    ], matchedIngredients: [{ slotLabel: 'Protein', ingredientId: 'ground-turkey', ingredientName: 'Ground turkey',
      quantityUsed: 2, unit: 'lb', store: 'SAFEWAY', rawDealText: 'invented', dealType: 'MULTI_BUY',
      unitCost: 999, slotCost: 999, regularSlotCost: 9999, isUserPinned: false, isOnHand: true }] });
    mocks.generate.mockResolvedValue({ text: JSON.stringify([modelDish]) });
    const result = await (await POST(request({ geminiApiKey: 'client-test-key', onHandIngredientIds: ['olive-oil'] }))).json();
    expect(result.usedAi).toBe(true);
    expect(result.dishes[0].matchedIngredients[0]).toMatchObject({ isOnHand: false, unitCost: 1.99, slotCost: 3.98 });
    expect(result.dishes[0].estimatedPantryCost).toBe(.32);
    expect(result.dishes[0].totalBatchCost).toBe(4.30);
    expect(result.dishes[0].additionalCostEstimateComplete).toBe(false);
    expect(mocks.generate.mock.calls[0][0].contents).toContain('Available catalog IDs: ["olive-oil"]');
  });
});
