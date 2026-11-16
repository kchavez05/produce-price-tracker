import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { createMockDish } from 'tests/test-utils';
import { AiAccessError } from '@/lib/ai/access-errors';
const owner='00000000-0000-4000-8000-000000000001';
const mocks=vi.hoisted(()=>({account:vi.fn(),generate:vi.fn(),dashboard:vi.fn(),reserve:vi.fn(),complete:vi.fn()}));
vi.mock('@/lib/supabase/session',()=>({loadInventoryState:async()=>({profile:{id:'00000000-0000-4000-8000-000000000001',isCloudBacked:true},savedRecipes:[]})}));
vi.mock('@/lib/ai/auth',()=>({requireAiAccount:mocks.account}));
vi.mock('@/lib/ai/usage',()=>({reserveAiUsage:mocks.reserve,completeAiUsage:mocks.complete}));
vi.mock('@/lib/pantry/server',()=>({readProfilePantryAvailability:async()=>[]}));
vi.mock('@/lib/ai/providers',()=>({createRecipeProvider:()=>process.env.OPENAI_API_KEY?.trim()?{usageBound:{adapterKey:'test:recipe:v1',maximumCostMicroUsd:100},generate:mocks.generate}:null}));
vi.mock('@/lib/scoring-and-matcher',()=>({buildDashboardPayload:mocks.dashboard}));
import { POST } from '@/app/api/ai-meal-plan/route';
function request(ip:string,body:unknown={},origin='http://localhost') {
  return new NextRequest('http://localhost/api/ai-meal-plan',{method:'POST',headers:{host:'localhost',origin,'x-forwarded-for':ip,'content-type':'application/json'},body:JSON.stringify(body)});
}
describe('v1.7 AI access and durable-admission integration',()=>{
  beforeEach(()=>{
    vi.clearAllMocks();vi.stubEnv('OPENAI_API_KEY','server-test-key');
    mocks.account.mockRejectedValue(new AiAccessError('AUTH_REQUIRED'));
    mocks.dashboard.mockResolvedValue({commodities:[],recommendedTrio:[]});
    mocks.generate.mockResolvedValue({text:JSON.stringify([0,1,2].map(i=>createMockDish({title:`Dish ${i}`,pantryRequirements:[]})))});
    mocks.reserve.mockResolvedValue({reservationId:'00000000-0000-4000-8000-000000000011',remainingActions:4,remainingDailyMicroUsd:500});mocks.complete.mockResolvedValue(true);
  });
  afterEach(()=>vi.unstubAllEnvs());
  it('requires verified cloud auth before usage or generation',async()=>{
    expect((await POST(request('anonymous'))).status).toBe(401);
    expect(mocks.reserve).not.toHaveBeenCalled();expect(mocks.generate).not.toHaveBeenCalled();
  });
  it('keeps keyless suggestions and permanently retires stale personal keys',async()=>{
    vi.stubEnv('OPENAI_API_KEY','');expect((await POST(request('keyless'))).status).toBe(200);
    expect((await POST(request('old-client',{geminiApiKey:'user-key'}))).status).toBe(400);
    expect(mocks.account).not.toHaveBeenCalled();expect(mocks.generate).not.toHaveBeenCalled();
  });
  it('rejects cross-origin requests',async()=>{
    expect((await POST(request('cross',{},'https://other.example'))).status).toBe(403);
    expect(mocks.generate).not.toHaveBeenCalled();
  });
  it('uses the same verified account for shared admission despite changing caller IPs',async()=>{
    mocks.account.mockResolvedValue(owner);
    for(let i=0;i<2;i++)expect((await POST(request(`rotated-ip-${i}`))).status).toBe(200);
    mocks.reserve.mockRejectedValue(new AiAccessError('DAILY_QUOTA',60));
    const blocked=await POST(request('different-ip'));
    expect(blocked.status).toBe(429);expect(blocked.headers.get('Retry-After')).toBe('60');
    expect(mocks.generate).toHaveBeenCalledTimes(2);
    expect(mocks.reserve.mock.calls.every(call=>call[0]===owner)).toBe(true);
  });
});
