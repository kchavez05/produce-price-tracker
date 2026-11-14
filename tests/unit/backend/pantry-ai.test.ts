import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { AiAccessError } from '@/lib/ai/access-errors';
import { createMockCommodity, createMockDish, createMockIngredient } from 'tests/test-utils';
const mocks = vi.hoisted(() => ({ generate: vi.fn(), client: vi.fn(), build: vi.fn(), availability: vi.fn(), account: vi.fn(), inventory: vi.fn(), reserve: vi.fn(), complete: vi.fn() }));
vi.mock('@google/genai', async (original) => ({ ...await original<typeof import('@google/genai')>(),
  GoogleGenAI: class { constructor(options: unknown) { mocks.client(options); } models = { generateContent: mocks.generate }; },
}));
vi.mock('@/lib/scoring-and-matcher', () => ({ buildDashboardPayload: mocks.build }));
vi.mock('@/lib/pantry/server', () => ({ readProfilePantryAvailability: mocks.availability }));
vi.mock('@/lib/supabase/session', () => ({ loadInventoryState: mocks.inventory }));
vi.mock('@/lib/ai/auth', () => ({ requireAiAccount: mocks.account }));
vi.mock('@/lib/ai/usage', () => ({ reserveAiUsage: mocks.reserve, completeAiUsage: mocks.complete }));
vi.mock('@/lib/ai/providers', async original => { const actual = await original<typeof import('@/lib/ai/providers')>(); return { ...actual, createRecipeProvider: () => { const provider=actual.createRecipeProvider(); if(provider)provider.usageBound={adapterKey:'test:recipe:v1',maximumCostMicroUsd:100}; return provider; } }; });
import { POST } from '@/app/api/ai-meal-plan/route';
let requestNumber=0;
const request = (body: object) => new NextRequest('http://localhost/api/ai-meal-plan', { method: 'POST', headers: { host: 'localhost', origin: 'http://localhost', 'x-forwarded-for': `unit-ai-${++requestNumber}`, 'content-type': 'application/json' }, body: JSON.stringify(body) });
const commodity = createMockCommodity({ ingredient: createMockIngredient({ id: 'ground-turkey', name: 'Ground turkey', category: 'PROTEIN' }) });
beforeEach(() => {
  vi.clearAllMocks(); vi.stubEnv('PANTRYBOT_PANTRY_ENABLED', 'true'); vi.stubEnv('GEMINI_API_KEY', '');
  mocks.availability.mockResolvedValue(['olive-oil']);
  mocks.build.mockResolvedValue({ commodities: [commodity], recommendedTrio: [createMockDish()] });
  mocks.account.mockRejectedValue(new AiAccessError('AUTH_REQUIRED'));
  mocks.inventory.mockResolvedValue({profile:{id:'00000000-0000-4000-8000-000000000001',isCloudBacked:true},savedRecipes:[]});
  mocks.reserve.mockResolvedValue({reservationId:'00000000-0000-4000-8000-000000000011',remainingActions:4,remainingDailyMicroUsd:500});
  mocks.complete.mockResolvedValue(true);
});
afterEach(() => vi.unstubAllEnvs());
describe('AI pantry contract', () => {
  it('uses verified persisted availability for keyless fallback and accepts an explicit optimistic empty override', async () => {
    expect((await POST(request({}))).status).toBe(200);
    expect(mocks.build).toHaveBeenLastCalledWith(expect.objectContaining({ onHandIngredientIds: ['olive-oil'] }));
    expect(mocks.build.mock.lastCall?.[0]).not.toHaveProperty('freezerInventory');
    await POST(request({ onHandIngredientIds: [] }));
    expect(mocks.build).toHaveBeenLastCalledWith(expect.objectContaining({ onHandIngredientIds: [] }));
  });
  it('does not bypass verified-account authorization for a server-funded request', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'server-test-key');
    expect((await POST(request({ userId: 'forged-account' }))).status).toBe(400);
    expect((await POST(request({}))).status).toBe(401);
    expect(mocks.generate).not.toHaveBeenCalled();
  });
  it('reprices generated requirements and market slots instead of trusting model availability and cost', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'server-test-key');
    mocks.account.mockResolvedValue('00000000-0000-4000-8000-000000000001');
    const modelDish = createMockDish({ pantryStaples: [], estimatedPantryCost: 900, pantryRequirements: [
      { ingredientId: 'olive-oil', quantity: 3, unit: 'tbsp' }, { ingredientId: 'garlic-fresh', quantity: 4, unit: 'clove' },
      { ingredientId: 'unmapped:seasoning', displayName: 'Special seasoning', quantity: 1, unit: 'tsp' },
    ], matchedIngredients: [{ slotLabel: 'Protein', ingredientId: 'ground-turkey', ingredientName: 'Ground turkey',
      quantityUsed: 2, unit: 'lb', store: 'SAFEWAY', rawDealText: 'invented', dealType: 'MULTI_BUY',
      unitCost: 999, slotCost: 999, regularSlotCost: 9999, isUserPinned: false, isOnHand: true }] });
    mocks.generate.mockResolvedValue({ text: JSON.stringify([0, 1, 2].map(i => ({ ...modelDish, title: `Dish ${i}` }))) });
    const result = await (await POST(request({ onHandIngredientIds: ['olive-oil'] }))).json();
    expect(result.usedAi).toBe(true);
    expect(mocks.client).toHaveBeenCalledWith({ apiKey: 'server-test-key', apiVersion: 'v1beta', httpOptions: { retryOptions: { attempts: 1 } } });
    expect(result.dishes[0].matchedIngredients[0]).toMatchObject({ isOnHand: false, unitCost: 1.99, slotCost: 3.98 });
    expect(result.dishes[0].estimatedPantryCost).toBe(.32);
    expect(result.dishes[0].totalBatchCost).toBe(4.30);
    expect(result.dishes[0].additionalCostEstimateComplete).toBe(false);
    expect(mocks.generate.mock.calls[0][0].contents).toContain('Available catalog IDs: ["olive-oil"]');
    expect(mocks.generate.mock.calls[0][0]).toMatchObject({ model: 'gemini-2.5-flash', config: {
      maxOutputTokens: 6000, responseSchema: { type: 'ARRAY' }, systemInstruction: expect.stringContaining('untrusted data'),
    } });
    expect(mocks.generate.mock.calls[0][0].config.abortSignal).toBeInstanceOf(AbortSignal);
  });
  it('returns only application-owned errors when a vendor rejects generation', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'server-test-key');
    mocks.account.mockResolvedValue('00000000-0000-4000-8000-000000000001');
    mocks.generate.mockRejectedValue(new Error('SECRET provider key and response body'));
    const response = await POST(request({}));
    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body.code).toBe('PROVIDER_UNAVAILABLE');
    expect(body.error).not.toContain('SECRET');
    expect(body.error).not.toContain('Gemini');
    expect(mocks.generate).toHaveBeenCalledOnce();
    expect(mocks.complete).toHaveBeenCalledOnce();
  });
  it('rejects malformed provider output instead of returning an empty successful plan', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'server-test-key');
    mocks.account.mockResolvedValue('00000000-0000-4000-8000-000000000001');
    mocks.generate.mockResolvedValue({ text: '[]' });
    const response = await POST(request({}));
    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({ usedAi: false, code: 'INVALID_RESPONSE' });
  });
  it('never dispatches when reservation fails or the loaded owner changed', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'server-test-key');
    mocks.account.mockResolvedValue('00000000-0000-4000-8000-000000000001');
    mocks.reserve.mockRejectedValue(new AiAccessError('MONTHLY_BUDGET', 120));
    const denied=await POST(request({}));
    expect(denied.status).toBe(429);expect(denied.headers.get('Retry-After')).toBe('120');
    expect(mocks.generate).not.toHaveBeenCalled();
    mocks.inventory.mockResolvedValue({profile:{id:'different-account',isCloudBacked:true},savedRecipes:[]});
    expect((await POST(request({}))).status).toBe(409);
    expect(mocks.reserve).toHaveBeenCalledOnce();expect(mocks.generate).not.toHaveBeenCalled();
  });
  it('does not accept a personal key even without a configured server provider', async () => {
    const response=await POST(request({geminiApiKey:'private-key-that-must-not-run'}));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({code:'CLIENT_UPDATE_REQUIRED'});
    expect(mocks.client).not.toHaveBeenCalled();expect(mocks.generate).not.toHaveBeenCalled();
  });

});
