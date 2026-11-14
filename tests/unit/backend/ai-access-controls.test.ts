import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parseMealPlanRequest } from '@/lib/ai/request';
import { requireAiAccount } from '@/lib/ai/auth';
import { completeAiUsage, reserveAiUsage } from '@/lib/ai/usage';
const mocks=vi.hoisted(()=>({client:vi.fn(),getUser:vi.fn()}));
vi.mock('@/lib/supabase/server',()=>({createServerSupabaseClient:mocks.client}));
const owner='00000000-0000-4000-8000-000000000001',requestId='00000000-0000-4000-8000-000000000002';
const bound={adapterKey:'test:recipe:v1',maximumCostMicroUsd:100};
const request=(value:unknown,contentType='application/json')=>new Request('http://localhost/api/ai-meal-plan',{method:'POST',headers:{'content-type':contentType},body:JSON.stringify(value)});
beforeEach(()=>{vi.clearAllMocks();vi.stubEnv('SUPABASE_SECRET_KEY','');mocks.client.mockResolvedValue({auth:{getUser:mocks.getUser}});});
afterEach(()=>vi.unstubAllEnvs());
describe('bounded v1.7 request input',()=>{
  it('separates valid market pin IDs from exact pantry availability IDs',async()=>{
    expect(await parseMealPlanRequest(request({pinnedIngredientIds:['broccoli-cauliflower'],onHandIngredientIds:['olive-oil']}))).toMatchObject({pinnedIngredientIds:['broccoli-cauliflower'],onHandIngredientIds:['olive-oil'],targetServings:6});
    await expect(parseMealPlanRequest(request({onHandIngredientIds:['broccoli-cauliflower']}))).rejects.toMatchObject({code:'INVALID_REQUEST'});
  });
  it.each([{geminiApiKey:'never-upload-again'},{userId:owner},{targetServings:0},{macroGoal:'invented'},{zipCode:'invalid'},{customPreference:'x'.repeat(1001)},{pinnedIngredientIds:['invented']},{dietaryConstraints:['invalid']},null,[]])('rejects retired, forged or invalid input',async value=>{
    await expect(parseMealPlanRequest(request(value))).rejects.toMatchObject({status:400});
  });
  it('rejects oversized bodies and unsupported media types before any paid work',async()=>{
    await expect(parseMealPlanRequest(request({customPreference:'x'.repeat(70000)}))).rejects.toMatchObject({code:'INVALID_REQUEST'});
    await expect(parseMealPlanRequest(request({},'text/plain'))).rejects.toMatchObject({code:'INVALID_REQUEST'});
  });
});
describe('verified paid identity',()=>{
  it.each([null,{id:owner,is_anonymous:true,email_confirmed_at:'2026-01-01'},{id:owner,is_anonymous:false}])('rejects absent, anonymous or unverified Auth identities',async user=>{
    mocks.getUser.mockResolvedValue({data:{user},error:null});
    await expect(requireAiAccount()).rejects.toMatchObject({code:'AUTH_REQUIRED'});
  });
  it('accepts a fresh confirmed Auth identity without trusting caller/profile claims',async()=>{
    mocks.getUser.mockResolvedValue({data:{user:{id:owner,is_anonymous:false,email_confirmed_at:'2026-01-01'}},error:null});
    expect(await requireAiAccount()).toBe(owner);
  });
  it('does not leak Auth errors or replace unavailable cloud auth with a local profile',async()=>{
    mocks.getUser.mockRejectedValue(new Error('SECRET auth body'));
    await expect(requireAiAccount()).rejects.toMatchObject({code:'AUTH_UNAVAILABLE',status:503});
    mocks.client.mockResolvedValue(null);await expect(requireAiAccount()).rejects.toMatchObject({code:'AUTH_REQUIRED'});
  });
});
describe('acknowledged shared usage admission',()=>{
  it('requires matching positive bounds and a positively acknowledged durable reservation',async()=>{
    const rpc=vi.fn().mockResolvedValue({data:{allowed:true,reservationId:requestId,remainingActions:4,remainingDailyMicroUsd:500},error:null});
    expect(await reserveAiUsage(owner,requestId,'recipe',bound,{rpc})).toEqual({reservationId:requestId,remainingActions:4,remainingDailyMicroUsd:500});
    expect(rpc).toHaveBeenCalledWith('ai_usage_reserve',expect.objectContaining({p_account_id:owner,p_request_id:requestId,p_maximum_cost_micro_usd:100}));
    await expect(reserveAiUsage(owner,requestId,'recipe',undefined,{rpc})).rejects.toMatchObject({code:'AI_NOT_CONFIGURED'});
    expect(rpc).toHaveBeenCalledOnce();
  });
  it.each([{data:null,error:{message:'SECRET'}},{data:{allowed:true},error:null},{data:{allowed:false,reason:'SECRET'},error:null}])('fails closed on errors or malformed acknowledgments',async response=>{
    const rpc=vi.fn().mockResolvedValue(response);
    await expect(reserveAiUsage(owner,requestId,'recipe',bound,{rpc})).rejects.toMatchObject({code:'USAGE_UNAVAILABLE'});
  });
  it('returns only known quota denials and a bounded retry header',async()=>{
    const rpc=vi.fn().mockResolvedValue({data:{allowed:false,reason:'MONTHLY_BUDGET',retryAfterSeconds:60},error:null});
    await expect(reserveAiUsage(owner,requestId,'speech',bound,{rpc})).rejects.toMatchObject({code:'MONTHLY_BUDGET',retryAfterSeconds:60,status:429});
  });
  it('never treats failed completion as an acknowledged refund',async()=>{
    const rpc=vi.fn().mockResolvedValue({data:false,error:null});expect(await completeAiUsage(owner,requestId,{rpc})).toBe(false);
    rpc.mockRejectedValue(new Error('SECRET'));expect(await completeAiUsage(owner,requestId,{rpc})).toBe(false);
  });
});
