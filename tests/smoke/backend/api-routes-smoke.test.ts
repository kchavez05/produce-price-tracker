import { cookieJar } from 'tests/support/cookies';
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getDashboard } from '@/app/api/dashboard/route';
import { GET as getLocations } from '@/app/api/locations/route';
import { GET as getFreezer, POST as postFreezer } from '@/app/api/freezer/route';
import { GET as getSavedRecipes, POST as postSavedRecipes } from '@/app/api/saved-recipes/route';
import { POST as postAiMealPlan } from '@/app/api/ai-meal-plan/route';
import { resetSqliteTestInstance } from '@/lib/db/sqlite';

function createRequest(url: string, options: { method?: string; body?: any } = {}): NextRequest {
  const method = options.method || 'GET';
  const headers = new Headers({
    host: 'localhost:3000',
    origin: 'http://localhost:3000',
    'content-type': 'application/json',
  });
  return new NextRequest(url, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
}

describe('smoke: API Route Handlers happy-path', () => {
  beforeEach(() => {
    cookieJar.clear();
    process.env.PANTRYBOT_SQLITE_PATH = ':memory:';
    resetSqliteTestInstance();
  });

  afterAll(() => {
    resetSqliteTestInstance();
  });

  it('GET /api/dashboard returns 200 with commodities, recommendedTrio, and marketRadar', async () => {
    const req = createRequest('http://localhost:3000/api/dashboard?zip=80542&servings=6');
    const res = await getDashboard(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.zipCode).toBe('80542');
    expect(Array.isArray(data.commodities)).toBe(true);
    expect(data.commodities.length).toBeGreaterThan(0);
    expect(Array.isArray(data.recommendedTrio)).toBe(true);
    expect(data.recommendedTrio.length).toBe(3);
    expect(Array.isArray(data.allRankedDishes)).toBe(true);
    expect(data.marketRadar).toBeDefined();
    expect(data.sqliteStats).toBeDefined();
  });

  it('GET /api/locations returns 200 with availableStores and resolved banners', async () => {
    const req = createRequest('http://localhost:3000/api/locations?zip=80542');
    const res = await getLocations(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.zipCode).toBe('80542');
    expect(Array.isArray(data.availableStores)).toBe(true);
    expect(data.availableStores.length).toBe(6);
    expect(Array.isArray(data.locations)).toBe(true);
  });

  it('retired GET & POST /api/freezer reads and creates virtual freezer inventory', async () => {
    expect((await getFreezer(new Request('http://localhost:3000/api/freezer'))).status).toBe(410);
    const response = await postFreezer(createRequest('http://localhost:3000/api/freezer', { method: 'POST', body: { item: {} } }));
    expect(response.status).toBe(410);
    expect(await response.json()).toMatchObject({ code: 'freezer_retired', replacement: '/api/pantry' });
  });

  it('GET & POST /api/saved-recipes saves and retrieves recipe blueprints', async () => {
    const postReq = createRequest('http://localhost:3000/api/saved-recipes', {
      method: 'POST',
      body: {
        dish: {
          id: 'smoke-recipe-001',
          blueprintId: 'bp-1',
          title: 'Sunday Slow Cooker Stew',
          style: 'Slow Cooker',
          appliance: 'SLOW_COOKER',
          servings: 6,
          matchedIngredients: [],
          pantryStaples: [],
          totalBatchCost: 12.0,
          costPerServing: 2.0,
          totalBatchSavings: 8.0,
          macrosPerServing: { calories: 400, proteinGrams: 35, carbsGrams: 20, fatGrams: 10 },
          confidenceScore: 90,
        },
      },
    });

    const postRes = await postSavedRecipes(postReq);
    expect(postRes.status).toBe(200);

    const getRes = await getSavedRecipes();
    expect(getRes.status).toBe(200);
    const getData = await getRes.json();
    expect(getData.recipes.some((r: any) => r.id === 'smoke-recipe-001')).toBe(true);
  });

  it('POST /api/ai-meal-plan falls back deterministically without OPENAI_API_KEY', async () => {
    // Delete OPENAI_API_KEY from environment to verify Zero-Key Offline Resilience
    const originalKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    try {
      const req = createRequest('http://localhost:3000/api/ai-meal-plan', {
        method: 'POST',
        body: {
          zipCode: '80542',
          targetServings: 6,
          macroGoal: 'HIGH_PROTEIN',
        },
      });

      const res = await postAiMealPlan(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.usedAi).toBe(false);
      expect(data.message).toContain('Returned standard meal-prep suggestions');
      expect(Array.isArray(data.dishes)).toBe(true);
      expect(data.dishes.length).toBe(3);
    } finally {
      if (originalKey) {
        process.env.OPENAI_API_KEY = originalKey;
      }
    }
  });
});
