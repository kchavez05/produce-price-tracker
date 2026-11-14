import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

let db: PGlite;
const alice = '00000000-0000-4000-8000-000000000001';
const bob = '00000000-0000-4000-8000-000000000002';
interface Decision { allowed: boolean; reason?: string; reservationId?: string; remainingActions?: number; retryAfterSeconds?: number; remainingDailyMicroUsd?:number }
const migration = ['20261114163202_ai_usage_controls.sql','20261114181924_ai_daily_cost_policy.sql'].map(name=>readFileSync(`supabase/migrations/${name}`, 'utf8')).join('\n');
async function reserve(account = alice, request = randomUUID(), action = 'recipe', adapter = 'test:recipe:v1', bound = 100): Promise<Decision> {
  return (await db.query<{ result: Decision }>('select public.ai_usage_reserve($1,$2,$3,$4,$5) as result', [account, request, action, adapter, bound])).rows[0].result;
}
async function complete(account: string, reservation: string): Promise<boolean> {
  return (await db.query<{ result: boolean }>('select public.ai_usage_complete($1,$2) as result', [account,reservation])).rows[0].result;
}
async function configure(budget = 1000, daily = 5, concurrent = 1) {
  await db.exec('reset role');
  await db.query('update ai_private.policy set enabled=true,monthly_budget_micro_usd=$1,account_daily_actions=$2,account_concurrent_actions=$3,account_daily_budget_micro_usd=10000', [budget,daily,concurrent]);
  await db.exec("insert into ai_private.adapter_limits values('recipe','test:recipe:v1',100,true),('speech','test:speech:v1',200,true)");
  await db.exec('set role service_role');
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec('create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create table auth.users(id uuid primary key);');
  await db.query('insert into auth.users values($1),($2)', [alice,bob]);
  await db.exec(migration);
},20000);
beforeEach(async () => {
  await db.exec('reset role; truncate ai_private.adapter_limits,ai_private.monthly_usage,ai_private.daily_usage,ai_private.reservations; update ai_private.policy set enabled=false,monthly_budget_micro_usd=0,account_daily_actions=0,account_concurrent_actions=1,account_daily_budget_micro_usd=0;');
});
afterAll(async () => { await db?.close(); });

describe('atomic shared AI usage controls', () => {
  it('installs disabled and preserves policy/usage when the migration is reapplied', async () => {
    await db.exec(migration);
    expect((await db.query('select enabled,monthly_budget_micro_usd::text as monthly,account_daily_budget_micro_usd::text as daily from ai_private.policy')).rows[0]).toEqual({enabled:false,monthly:'20000000',daily:'5000000'});
    await db.exec('set role service_role'); expect(await reserve()).toMatchObject({ allowed:false,reason:'DISABLED' });
    await configure(); const first = await reserve(); expect(first.allowed).toBe(true);
    await db.exec('reset role'); await db.exec(migration); await db.exec('set role service_role');
    expect(await reserve()).toMatchObject({ allowed:false,reason:'CONCURRENT_REQUEST' });
    expect(await complete(alice,first.reservationId!)).toBe(true);
    expect(await reserve()).toMatchObject({ allowed:true,remainingActions:3 });
  });
  it('fails closed without an accepted adapter/rate bound and does not consume quota', async () => {
    await configure();
    expect(await reserve(alice,randomUUID(),'recipe','wrong-provider',100)).toMatchObject({ allowed:false,reason:'NOT_CONFIGURED' });
    expect(await reserve(alice,randomUUID(),'recipe','test:recipe:v1',1)).toMatchObject({ allowed:false,reason:'NOT_CONFIGURED' });
    expect(await reserve(alice,randomUUID(),'unknown')).toMatchObject({ allowed:false,reason:'NOT_CONFIGURED' });
    expect(await reserve()).toMatchObject({ allowed:true,remainingActions:4 });
  });
  it('shares daily actions between recipe and speech and across request instances', async () => {
    await configure(10000,2,10);
    const results = await Promise.all([reserve(),reserve(alice,randomUUID(),'speech','test:speech:v1',200),reserve()]);
    expect(results.filter(row => row.allowed)).toHaveLength(2);
    expect(results[2]).toMatchObject({ allowed:false,reason:'DAILY_QUOTA',retryAfterSeconds:expect.any(Number) });
    expect(await reserve(bob)).toMatchObject({ allowed:true,remainingActions:1 });
  });
  it('cannot over-admit a monthly budget under a burst of requests', async () => {
    await configure(250,100,10);
    const results = await Promise.all(Array.from({length:20},() => reserve()));
    expect(results.filter(row => row.allowed)).toHaveLength(2);
    expect(results.filter(row => row.reason==='MONTHLY_BUDGET')).toHaveLength(18);
    await db.exec('reset role');
    expect((await db.query<{ cost: string }>('select reserved_micro_usd::text as cost from ai_private.monthly_usage')).rows[0].cost).toBe('200');
  });
  it('retains full exposure and daily consumption after completion/failure; duplicates never replay', async () => {
    await configure(200,5); const request = randomUUID(); const first = await reserve(alice,request);
    expect(await complete(alice,first.reservationId!)).toBe(true);
    expect(await complete(alice,first.reservationId!)).toBe(true);
    expect(await reserve(alice,request)).toMatchObject({ allowed:false,reason:'DUPLICATE_REQUEST' });
    const second = await reserve(); expect(second).toMatchObject({ allowed:true,remainingActions:3 });
    await complete(alice,second.reservationId!);
    expect(await reserve(bob)).toMatchObject({ allowed:false,reason:'MONTHLY_BUDGET' });
  });
  it('uses account-bound concurrency and cannot complete another account reservation', async () => {
    await configure(); const first = await reserve();
    expect(await complete(bob,first.reservationId!)).toBe(false);
    expect(await reserve()).toMatchObject({ allowed:false,reason:'CONCURRENT_REQUEST' });
    expect(await reserve(bob)).toMatchObject({ allowed:true });
    await complete(alice,first.reservationId!); expect((await reserve()).allowed).toBe(true);
  });
  it('allows progress after a stale lease without refunding the uncertain charge', async () => {
    await configure(200); await reserve(); await db.exec('reset role');
    await db.exec("update ai_private.reservations set created_at=now()-interval '3 minutes'"); await db.exec('set role service_role');
    const second = await reserve(); expect(second.allowed).toBe(true); await complete(alice,second.reservationId!);
    expect(await reserve()).toMatchObject({ allowed:false,reason:'MONTHLY_BUDGET' });
  });
  it('uses database UTC windows and leaves prior period exposure intact', async () => {
    await configure(1000,2); await db.exec('reset role');
    await db.query("insert into ai_private.daily_usage(account_id,day,actions) values($1,(now() at time zone 'UTC')::date-1,99)",[alice]);
    await db.exec("insert into ai_private.monthly_usage values((date_trunc('month',now() at time zone 'UTC')-interval '1 month')::date,999)");
    await db.exec('set role service_role'); expect(await reserve()).toMatchObject({ allowed:true,remainingActions:1 });
    await db.exec('reset role'); expect((await db.query('select * from ai_private.monthly_usage')).rows).toHaveLength(2);
  });
  it('shares the disable switch and cannot raise limits through the service role', async () => {
    await configure(); await db.exec('reset role; update ai_private.policy set enabled=false; set role service_role');
    expect(await reserve()).toMatchObject({ allowed:false,reason:'DISABLED' });
    await expect(db.exec('update ai_private.policy set enabled=true')).rejects.toThrow('permission denied');
    await expect(db.exec('update ai_private.adapter_limits set maximum_cost_micro_usd=1')).rejects.toThrow('permission denied');
  });
  it('keeps private tables/RPCs inaccessible to guests and signed-in clients and uses no definer function', async () => {
    for (const role of ['anon','authenticated']) {
      await db.exec(`reset role; set role ${role}`);
      await expect(reserve()).rejects.toThrow('permission denied');
      await expect(db.query('select * from ai_private.reservations')).rejects.toThrow('permission denied');
      await expect(db.query('update ai_private.policy set enabled=true')).rejects.toThrow('permission denied');
    }
    await db.exec('reset role');
    expect((await db.query<{ definer:boolean }>("select prosecdef as definer from pg_proc where proname in ('ai_usage_reserve','ai_usage_complete')")).rows.every(row => !row.definer)).toBe(true);
    expect((await db.query<{ rls:boolean }>("select relrowsecurity as rls from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='ai_private' and c.relkind='r'")).rows.every(row => row.rls)).toBe(true);
  });
  it('enforces the approved dollar policy across recipes/speech without requiring a count cap', async()=>{
    await configure(20000000,0,10);await db.exec('reset role; update ai_private.policy set account_daily_budget_micro_usd=250; set role service_role');
    expect(await reserve()).toMatchObject({allowed:true,remainingActions:null,remainingDailyMicroUsd:150});
    expect(await reserve(alice,randomUUID(),'speech','test:speech:v1',200)).toMatchObject({allowed:false,reason:'DAILY_QUOTA'});
    expect(await reserve()).toMatchObject({allowed:true,remainingDailyMicroUsd:50});
    expect(await reserve()).toMatchObject({allowed:false,reason:'DAILY_QUOTA'});
    expect((await reserve(bob)).allowed).toBe(true);
  });
  it('cannot reset the global spend counter by deleting an account', async () => {
    await configure(100,5); await reserve(); await db.exec('reset role');
    const charlie = '00000000-0000-4000-8000-000000000003'; await db.query('insert into auth.users values($1)',[charlie]);
    await db.query('delete from auth.users where id=$1',[alice]);
    await db.exec('set role service_role'); expect(await reserve(charlie)).toMatchObject({ allowed:false,reason:'MONTHLY_BUDGET' });
    await db.exec('reset role'); await db.query('insert into auth.users values($1)',[alice]);
  });
});
