import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { ingestUsda } from '@/lib/usda/ingest';
import { UsdaTransport } from '@/lib/usda/transport';
import { GET } from '@/app/api/cron/usda-ingest/route';
import { GET as weeklyGet, POST as weeklyPost } from '@/app/api/cron/weekly-sync/route';
import { buildDashboardPayload } from '@/lib/scoring-and-matcher';
import { resetSqliteTestInstance } from '@/lib/db/sqlite';

const definition=JSON.parse(readFileSync('config/usda/2756.json','utf8'));
const fixture=JSON.parse(readFileSync('tests/fixtures/usda/2756.json','utf8'));
let calls: string[];
beforeEach(() => {
  calls=[]; vi.useFakeTimers({ toFake:['Date'] }); vi.setSystemTime(new Date('2026-10-28T18:00:00Z'));
  vi.stubEnv('USDA_INGEST_ENABLED','true'); vi.stubEnv('USDA_MARS_API_KEY','secret-usda-test-key');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','https://test.supabase.co'); vi.stubEnv('SUPABASE_SECRET_KEY','server-test-key');
  vi.stubEnv('CRON_SECRET','cron-test-key'); vi.stubEnv('PANTRYBOT_SQLITE_PATH',':memory:');
  vi.stubEnv('KROGER_CLIENT_ID',''); resetSqliteTestInstance();
});
afterEach(() => { resetSqliteTestInstance(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.useRealTimers(); });
function api(duplicate=false) {
  vi.stubGlobal('fetch',vi.fn(async(input: string | URL | Request, init?:RequestInit)=>{
    const url=String(input); calls.push(url);
    if (url.includes('usda_report_catalog')) return Response.json([definition]);
    if (url.includes('claim_usda_run')) return Response.json(duplicate?null:'8e4d7614-236a-4bf2-879c-ad2b0427dd66');
    if (url.includes('marsapi.ams.usda.gov')) { expect(new Headers(init?.headers).get('authorization')).toContain('Basic '); return Response.json(fixture); }
    if (url.includes('publish_usda_report')) return Response.json('published');
    if (url.includes('finish_usda_run')) return Response.json(null);
    if (url.includes('weekly_refresh_audit')) return Response.json(null);
    if (url.includes('/rpc/read_')) return Response.json([]);
    throw new Error('offline');
  }));
}
describe('USDA scheduled ingestion boundaries',()=>{
  it('records and publishes one bounded report request after claiming the cycle',async()=>{
    api(); const result=await ingestUsda();
    expect(result.status).toBe('succeeded'); expect(result.requests).toBe(1);
    expect(calls.findIndex(c=>c.includes('claim_usda_run'))).toBeLessThan(calls.findIndex(c=>c.includes('marsapi')));
  });
  it('does not fetch on duplicate claims or when activation is disabled',async()=>{
    api(true); expect((await ingestUsda()).status).toBe('duplicate');
    vi.stubEnv('USDA_INGEST_ENABLED','false'); expect((await ingestUsda()).status).toBe('disabled');
    expect(calls.some(c=>c.includes('marsapi'))).toBe(false);
  });
  it('never lets a dashboard or cloud outage use the USDA key',async()=>{
    api(); await buildDashboardPayload();
    expect(calls.some(c=>c.includes('marsapi')||c.includes('market_offer_observations'))).toBe(false);
    calls=[]; vi.stubGlobal('fetch',vi.fn(async(input:string|URL|Request)=>{ calls.push(String(input)); return Response.json({ error:'cloud outage' }, {status:400}); }));
    const dashboard=await buildDashboardPayload();
    expect(dashboard.usda?.status).toBe('fallback'); expect(dashboard.marketHistory?.storage).toBe('unavailable');
    expect(dashboard.commodities.every(c=>c.priceHistory.length===0)).toBe(true);
    expect(calls.some(c=>c.includes('marsapi'))).toBe(false);
  });
  it('never calls USDA for Friday digests, public previews or ordinary manual refreshes',async()=>{
    api();
    const friday=await weeklyGet(new Request('http://localhost:3015/api/cron/weekly-sync?cycle=friday_prep_digest',{headers:{authorization:'Bearer cron-test-key'}}) as import('next/server').NextRequest);
    const preview=await weeklyGet(new Request('http://localhost:3015/api/cron/weekly-sync?cycle=preview_digest') as import('next/server').NextRequest);
    vi.setSystemTime(new Date('2026-10-28T18:00:01Z'));
    const manual=await weeklyPost(new Request('http://localhost:3015/api/cron/weekly-sync',{method:'POST',headers:{origin:'http://localhost:3015',host:'localhost:3015','content-type':'application/json'},body:'{}'}) as import('next/server').NextRequest);
    expect([friday.status,preview.status,manual.status]).toEqual([200,200,200]);
    expect(calls.some(c=>c.includes('marsapi'))).toBe(false);
  });
  it('rejects forged scheduling headers and public force parameters',async()=>{
    api();
    expect((await GET(new Request('https://pantrybot.dev/api/cron/usda-ingest',{ headers:{ 'x-vercel-cron':'1' } }))).status).toBe(401);
    expect((await GET(new Request('https://pantrybot.dev/api/cron/usda-ingest?force=true',{ headers:{ authorization:'Bearer cron-test-key' } }))).status).toBe(400);
    expect(calls).toHaveLength(0);
  });
});
describe('USDA upstream request controls',()=>{
  it('never retries authentication failures or redirects',async()=>{
    const fetch=vi.fn().mockResolvedValue(new Response('',{ status:401 })); vi.stubGlobal('fetch',fetch);
    await expect(new UsdaTransport('test-key').get('/2756')).rejects.toThrow('usda_auth_failed'); expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('retries rate limits within budget but not beyond Retry-After or the deadline',async()=>{
    const fetch=vi.fn().mockResolvedValueOnce(new Response('',{status:429,headers:{'Retry-After':'0'}})).mockResolvedValueOnce(Response.json({ok:true}));
    vi.stubGlobal('fetch',fetch); const transport=new UsdaTransport('test-key');
    expect(await transport.get('/2756')).toEqual({ok:true}); expect(transport.requests).toBe(2);
    fetch.mockReset().mockResolvedValue(new Response('',{status:429,headers:{'Retry-After':'9999'}}));
    await expect(new UsdaTransport('test-key').get('/2756')).rejects.toThrow('usda_retry_exhausted'); expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('honors the request budget and refuses credential echoes',async()=>{
    const transport=new UsdaTransport('test-key'); transport.requests=20;
    await expect(transport.get('/2756')).rejects.toThrow('request_budget_exhausted');
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(Response.json({ error:'test-key' })));
    await expect(new UsdaTransport('test-key').get('/2756')).rejects.toThrow('usda_credential_echo');
  });
});
