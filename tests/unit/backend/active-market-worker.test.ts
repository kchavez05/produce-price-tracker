import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
const mocks=vi.hoisted(()=>({claim:vi.fn(),finish:vi.fn(),build:vi.fn()}));
vi.mock('@/lib/market/active',()=>({claimMarkets:mocks.claim,finishMarket:mocks.finish}));
vi.mock('@/lib/scoring-and-matcher',()=>({buildDashboardPayload:mocks.build}));
import { GET } from '@/app/api/cron/active-markets/route';
const request=()=>new Request('http://localhost/api/cron/active-markets',{headers:{authorization:'Bearer test-secret'}});
beforeEach(()=>{vi.stubEnv('CRON_SECRET','test-secret');vi.resetAllMocks();mocks.finish.mockResolvedValue(undefined);});
afterEach(()=>vi.unstubAllEnvs());
describe('active market worker',()=>{
 it('rejects unauthenticated collection before claiming work',async()=>{
  expect((await GET(new Request('http://localhost/api/cron/active-markets'))).status).toBe(401);
  expect(mocks.claim).not.toHaveBeenCalled();
 });
 it('records completion only after a cloud archive with real offers',async()=>{
  const claim={zip_code:'10001',lease_id:'token'};mocks.claim.mockResolvedValue([claim]);
  mocks.build.mockResolvedValue({marketHistory:{archiveStorage:'cloud'},freshness:{usableLiveOffers:2}});
  expect((await GET(request())).status).toBe(200);
  expect(mocks.build).toHaveBeenCalledWith({zipCode:'10001',archiveHistory:true});
  expect(mocks.finish).toHaveBeenCalledWith(claim,true);
 });
 it('keeps failed archives and empty collections retryable',async()=>{
  const claims=[{zip_code:'10001',lease_id:'a'},{zip_code:'10002',lease_id:'b'}];mocks.claim.mockResolvedValue(claims);
  mocks.build.mockResolvedValueOnce({marketHistory:{archiveStorage:'unavailable'},freshness:{usableLiveOffers:2}})
   .mockResolvedValueOnce({marketHistory:{archiveStorage:'cloud'},freshness:{usableLiveOffers:0}});
  expect((await GET(request())).status).toBe(503);
  expect(mocks.finish).toHaveBeenNthCalledWith(1,claims[0],false);
  expect(mocks.finish).toHaveBeenNthCalledWith(2,claims[1],false);
 });
});
