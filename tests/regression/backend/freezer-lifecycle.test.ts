import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { NextRequest } from 'next/server';
import {
  GET as getFreezer,
  POST as postFreezer,
  PATCH as patchFreezer,
  DELETE as deleteFreezer,
} from '@/app/api/freezer/route';
import { resetSqliteTestInstance } from '@/lib/db/sqlite';

function createRequest(
  url: string,
  options: { method?: string; body?: any } = {}
): NextRequest {
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

describe('regression: freezer-lifecycle', () => {
  beforeEach(() => {
    process.env.PANTRYBOT_SQLITE_PATH = ':memory:';
    resetSqliteTestInstance();
  });

  afterAll(() => {
    resetSqliteTestInstance();
  });

  it('calculates weighted-average purchase price and handles depletion lifecycle', async () => {
    // 1. First purchase: 2 lbs @ $2.00/lb
    const req1 = createRequest('http://localhost:3000/api/freezer', {
      method: 'POST',
      body: {
        item: {
          id: 'frz-item-beef',
          canonicalIngredientId: 'ground-beef-80-20',
          ingredientName: 'Ground Beef (80/20)',
          category: 'PROTEIN',
          quantityLbOrDoz: 2.0,
          unit: 'lb',
          purchasePricePerUnit: 2.0,
          regularPricePerUnit: 5.0,
          totalCostBasis: 4.0,
          estimatedSavings: 6.0,
          store: 'KING_SOOPERS',
          storeBanner: 'King Soopers',
          purchasedAtIso: new Date().toISOString(),
        },
      },
    });

    const res1 = await postFreezer(req1);
    expect(res1.status).toBe(200);

    // 2. Second purchase: 3 lbs @ $3.00/lb
    // Total = 5 lbs. Weighted avg = (2*2.00 + 3*3.00) / 5 = 13 / 5 = $2.60/lb
    const req2 = createRequest('http://localhost:3000/api/freezer', {
      method: 'POST',
      body: {
        item: {
          id: 'frz-item-beef-2',
          canonicalIngredientId: 'ground-beef-80-20',
          ingredientName: 'Ground Beef (80/20)',
          category: 'PROTEIN',
          quantityLbOrDoz: 3.0,
          unit: 'lb',
          purchasePricePerUnit: 3.0,
          regularPricePerUnit: 5.0,
          totalCostBasis: 9.0,
          estimatedSavings: 6.0,
          store: 'KING_SOOPERS',
          storeBanner: 'King Soopers',
          purchasedAtIso: new Date().toISOString(),
        },
      },
    });

    const res2 = await postFreezer(req2);
    expect(res2.status).toBe(200);

    const checkRes1 = await getFreezer();
    const checkData1 = await checkRes1.json();
    const beef = checkData1.items.find(
      (i: any) => i.canonicalIngredientId === 'ground-beef-80-20'
    );
    expect(beef).toBeDefined();
    expect(beef.quantityLbOrDoz).toBe(5.0);
    expect(beef.purchasePricePerUnit).toBe(2.6);

    // 3. Partial Depletion via PATCH: use 2 lbs, leaving 3 lbs
    const patchReq = createRequest('http://localhost:3000/api/freezer', {
      method: 'PATCH',
      body: {
        id: beef.id,
        quantityLbOrDoz: 3.0,
      },
    });

    const patchRes = await patchFreezer(patchReq);
    expect(patchRes.status).toBe(200);

    const checkRes2 = await getFreezer();
    const checkData2 = await checkRes2.json();
    const remainingBeef = checkData2.items.find((i: any) => i.id === beef.id);
    expect(remainingBeef).toBeDefined();
    expect(remainingBeef.quantityLbOrDoz).toBe(3.0);

    // 4. Full Depletion via PATCH to 0: auto-deletes the item
    const depleteReq = createRequest('http://localhost:3000/api/freezer', {
      method: 'PATCH',
      body: {
        id: beef.id,
        quantityLbOrDoz: 0,
      },
    });

    const depleteRes = await patchFreezer(depleteReq);
    expect(depleteRes.status).toBe(200);

    const checkRes3 = await getFreezer();
    const checkData3 = await checkRes3.json();
    expect(checkData3.items.some((i: any) => i.id === beef.id)).toBe(false);
  });
});
