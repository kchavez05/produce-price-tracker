import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
let db: PGlite;
beforeAll(async () => {
 db = new PGlite();
 await db.exec('create role anon; create role authenticated; create role service_role bypassrls;');
 await db.exec(readFileSync('supabase/migrations/20261029160115_active_market_collection.sql','utf8'));
});
afterAll(async () => { await db.close(); });
describe('active market scheduler', () => {
 it('admits a market, claims it once, fences stale completion and schedules a successful refresh', async () => {
  await db.query("select request_active_market('80542')");
  const claim = await db.query<{claims:{zip_code:string;lease_id:string}[]}>("select claim_active_markets('',3) as claims");
  expect(claim.rows[0].claims).toHaveLength(1);
  const token=claim.rows[0].claims[0].lease_id;
  expect((await db.query<{claims:unknown[]}>("select claim_active_markets('',3) as claims")).rows[0].claims).toEqual([]);
  expect((await db.query<{ok:boolean}>("select finish_active_market('80542','00000000-0000-0000-0000-000000000000',true) as ok")).rows[0].ok).toBe(false);
  expect((await db.query<{ok:boolean}>("select finish_active_market('80542',$1,true) as ok",[token])).rows[0].ok).toBe(true);
  expect((await db.query<{due:boolean}>("select next_refresh_at > now()+interval '2 days' as due from active_markets")).rows[0].due).toBe(true);
 });
 it('bounds admission and stops collecting expired markets', async () => {
  await db.exec("insert into active_markets(zip_code) select lpad(i::text,5,'0') from generate_series(1,8) i");
  await db.query("select request_active_market('99999')");
  expect((await db.query<{count:number}>('select count(*)::int as count from active_markets')).rows[0].count).toBe(9);
  const batch = (await db.query<{claims:{zip_code:string;lease_id:string}[]}>("select claim_active_markets('',999) as claims")).rows[0].claims;
  expect(batch).toHaveLength(3);
  await db.query('select finish_active_market($1,$2,false)',[batch[0].zip_code,batch[0].lease_id]);
  expect((await db.query<{retry:boolean}>("select next_refresh_at between now()+interval '59 minutes' and now()+interval '61 minutes' as retry from active_markets where zip_code=$1",[batch[0].zip_code])).rows[0].retry).toBe(true);
  await db.exec("update active_markets set lease_until=now()-interval '1 minute' where lease_id is not null");
  const recovered = (await db.query<{claims:{lease_id:string}[]}>("select claim_active_markets('',3) as claims")).rows[0].claims;
  expect(recovered).toHaveLength(3);
  expect(recovered.every((claim)=>!batch.some((old)=>old.lease_id===claim.lease_id))).toBe(true);
  await db.exec("update active_markets set last_requested_at=now()-interval '31 days'");
  expect((await db.query<{claims:unknown[]}>("select claim_active_markets('',3) as claims")).rows[0].claims).toEqual([]);
 });
 it('keeps registry and worker functions inaccessible to browser roles', async () => {
  const result=await db.query<{allowed:boolean}>("select has_table_privilege('anon','active_markets','select') or has_function_privilege('authenticated','request_active_market(text)','execute') as allowed");
  expect(result.rows[0].allowed).toBe(false);
 });
});
