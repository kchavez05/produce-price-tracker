import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

let db: PGlite;
let today: string;
let run: string;
const rows = [{ row_key: 'row-1', ingredient_id: 'ground-beef-80-20', region: 'MOUNTAIN', value: 3.5, unit: 'lb', feature_pct: 0, original: { price: 3.5 } }];
const report = (extra = {}) => ({ slug: '123', period_start: today, period_end: today, published_at: `${today}T00:00:00Z`, content_hash: 'a'.repeat(64), adapter_version: 'test-v1', payload: { syntheticTestFixture: true }, ...extra });
const publish = (r: string, value = report(), observations = rows) => db.query<{ result: string }>('select public.publish_usda_report($1,$2,$3) as result', [r, JSON.stringify(value), JSON.stringify(observations)]);
beforeAll(async () => {
  db = new PGlite();
  await db.exec('create role anon; create role authenticated; create role service_role bypassrls;');
  for(const file of readdirSync('supabase/migrations').filter((name)=>/_(usda_market_history|usda_revision_acceptance|data_explorer)\.sql$/.test(name)).sort()) {
    await db.exec(readFileSync(`supabase/migrations/${file}`,'utf8'));
  }
  today = (await db.query<{ day: string }>("select current_date::text as day")).rows[0].day;
  await db.query("insert into public.usda_report_catalog(slug,title,enabled,validated_at,config) values('123','Synthetic test fixture',true,now(),$1)", [JSON.stringify({ adapterVersion: 'test-v1' })]);
}, 20000);
afterAll(async () => { await db?.close(); });
describe('market history database guarantees', () => {
  it('denies browser access to data and all operational functions', async () => {
    for (const role of ['anon','authenticated']) {
      const tables = await db.query<{ allowed: boolean }>("select has_table_privilege($1,'public.'||tablename,'select') as allowed from pg_tables where schemaname='public'", [role]);
      expect(tables.rows.every((row)=>!row.allowed)).toBe(true);
      const functions = await db.query<{ allowed: boolean }>("select has_function_privilege($1,p.oid,'execute') as allowed from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'", [role]);
      expect(functions.rows.every((row)=>!row.allowed)).toBe(true);
    }
  });
  it('allows one scheduled claim and publishes raw, normalized and selected data atomically', async () => {
    await db.exec('set role service_role');
    run = (await db.query<{ id: string }>("select public.claim_usda_run($1,'scheduled','Synthetic fixture test') as id", [today])).rows[0].id;
    expect(run).toBeTruthy();
    expect((await db.query<{ id: string | null }>("select public.claim_usda_run($1,'scheduled','Duplicate test') as id", [today])).rows[0].id).toBeNull();
    expect((await publish(run)).rows[0].result).toBe('published');
    expect((await publish(run)).rows[0].result).toBe('unchanged');
    expect((await db.query<{ count: number }>('select count(*)::int as count from public.usda_observations')).rows[0].count).toBe(1);
    await db.exec('reset role');
  });
  it('rolls back the raw version when an observation fails validation', async () => {
    await expect(publish(run, report({ content_hash: 'b'.repeat(64), published_at: `${today}T00:00:01Z` }), [{ ...rows[0], value: -1 }])).rejects.toThrow();
    expect((await db.query<{ count: number }>("select count(*)::int as count from public.usda_report_versions where content_hash=$1", ['b'.repeat(64)])).rows[0].count).toBe(0);
  });
  it('quarantines a conflicting revision with unknown ordering and preserves selection', async () => {
    expect((await publish(run, report({ content_hash: 'c'.repeat(64) }))).rows[0].result).toBe('quarantined');
    expect((await db.query<{ count: number }>('select count(*)::int as count from public.usda_cycle_publications')).rows[0].count).toBe(1);
  });
  it('recognizes replays of accepted old and current revisions as unchanged',async()=>{
    const correction=report({content_hash:'d'.repeat(64),published_at:`${today}T00:01:00Z`});
    expect((await publish(run,correction)).rows[0].result).toBe('published');
    const selections=(await db.query<{n:number}>('select count(*)::int as n from public.usda_cycle_publications')).rows[0].n;
    expect((await publish(run)).rows[0].result).toBe('unchanged');
    expect((await publish(run,correction)).rows[0].result).toBe('unchanged');
    expect((await db.query<{n:number}>('select count(*)::int as n from public.usda_cycle_publications')).rows[0].n).toBe(selections);
  });
  it('fences expired workers and requires explicit operator recovery', async () => {
    await db.query("update public.market_ingestion_claims set expires_at=now()-interval '1 second' where run_id=$1", [run]);
    await expect(publish(run)).rejects.toThrow('lease_lost');
    expect((await db.query<{ id: string | null }>("select public.claim_usda_run($1,'scheduled','Retry schedule') as id", [today])).rows[0].id).toBeNull();
    const next = (await db.query<{ id: string }>("select public.claim_usda_run($1,'recovery','Explicit operator retry') as id", [today])).rows[0].id;
    expect(next).not.toBe(run);
    await expect(publish(run)).rejects.toThrow('lease_lost');
    expect((await publish(next)).rows[0].result).toBe('unchanged');
    run=next;
  });
  it('archives repeated checks separately from revisions, including a price returning to its earlier value', async () => {
    const offer={zip_code:'80542',source:'FLIPP_LIVE',source_offer_id:'offer-a',ingredient_id:'ground-beef-80-20',store:'SAFEWAY',location_label:'Test store',
      source_from:today,source_to:today,observed_at:`${today}T12:00:00Z`,cycle:today,unit:'lb',normalized_price:3,content_hash:'d'.repeat(64),payload:{price:3}};
    const archive=(rows:unknown[])=>db.query('select public.archive_market_offers($1)',[JSON.stringify(rows)]);
    await archive([offer]);
    await archive([{...offer,normalized_price:4,content_hash:'e'.repeat(64),payload:{price:4}}]);
    await archive([offer]);
    expect((await db.query<{n:number}>('select count(*)::int as n from public.market_offer_observations')).rows[0].n).toBe(2);
    expect((await db.query<{n:number}>('select count(*)::int as n from public.market_offer_receipts')).rows[0].n).toBe(3);
    const result=await db.query<{data:{price:number}[]}>('select public.read_market_history($1,$2,$2) as data',['80542',today]);
    expect(Number(result.rows[0].data[0].price)).toBe(3);
  });
  it('keeps historical backfill from changing the active publication',async()=>{
    await db.query("select public.finish_usda_run($1,'succeeded',1,'{}')",[run]);
    const earlier=(await db.query<{day:string}>("select (current_date-7)::text as day")).rows[0].day;
    const backfill=(await db.query<{id:string}>("select public.claim_usda_run($1,'backfill','Historical verification') as id",[earlier])).rows[0].id;
    const oldReport=report({period_start:earlier,period_end:earlier,published_at:`${earlier}T00:00:00`,content_hash:'f'.repeat(64)});
    expect((await publish(backfill,oldReport)).rows[0].result).toBe('published');
    const selected=await db.query<{period_end:string}>("select v.period_end::text from public.usda_cycle_publications p join public.usda_report_versions v on v.id=p.version_id order by p.id desc limit 1");
    expect(selected.rows[0].period_end).toBe(today);
  });
  it('makes a quarantined older version readable through explicit backfill acceptance',async()=>{
    const older=(await db.query<{day:string}>("select (current_date-14)::text as day")).rows[0].day;
    const recovery=(await db.query<{id:string}>("select public.claim_usda_run($1,'recovery','Quarantine admission regression') as id",[today])).rows[0].id;
    const value=report({period_start:older,period_end:older,published_at:`${older}T00:00:00`,content_hash:'9'.repeat(64)});
    expect((await publish(recovery,value)).rows[0].result).toBe('quarantined');
    const backfill=(await db.query<{id:string}>("select public.claim_usda_run($1,'backfill','Accept quarantined historical content') as id",[older])).rows[0].id;
    expect((await publish(backfill,value)).rows[0].result).toBe('published');
    const history=await db.query<{data:{period_end:string}[]}>('select public.read_usda_history($1,$2) as data',[older,today]);
    expect(history.rows[0].data.some((row)=>row.period_end===older)).toBe(true);
    const raw=await db.query<{validation:string}>("select validation from public.usda_report_versions where content_hash=$1",['9'.repeat(64)]);
    expect(raw.rows[0].validation).toBe('quarantined');
    expect((await publish(backfill,value)).rows[0].result).toBe('unchanged');
  });
  it('exposes a bounded read-only explorer snapshot without operational or personal fields', async()=>{
    const legacy=(await db.query<{id:string}>("select id from public.usda_report_versions where validation='usable' and period_end=$1 limit 1",[today])).rows[0].id;
    await db.query('delete from public.usda_version_acceptances where version_id=$1',[legacy]);
    const asof=(await db.query<{clock:string}>("select clock_timestamp()::text as clock")).rows[0].clock;
    const result=await db.query<{data:{reports:Record<string,unknown>[];observations:Record<string,unknown>[];offers:Record<string,unknown>[]}}>(
      'select public.read_data_explorer($1,$2,$3,$3,$4) as data',['80542','ground-beef-80-20',today,asof]);
    const data=result.rows[0].data;expect(data.reports.length).toBeGreaterThan(0);expect(data.observations.length).toBeGreaterThan(0);expect(data.offers).toHaveLength(2);
    expect(data.reports.every(r=>!('payload' in r)&&!('run_id' in r))).toBe(true);
    expect(data.reports.find(r=>r.id===legacy)?.accepted).toBe(true);
    expect(data.reports.some(r=>r.validation==='quarantined' && r.accepted===false)).toBe(true);
    const snapshotBefore=(await db.query<{clock:string}>("select (clock_timestamp()-interval '2 days')::text as clock")).rows[0].clock;
    await expect(db.query('select public.read_data_explorer($1,$2,$3,$3,$4)',['80542','ground-beef-80-20',today,snapshotBefore])).rejects.toThrow('explorer_invalid_window');
    await expect(db.query("select public.read_data_explorer('80542','test',date '2026-01-01',date '2026-10-28',now())")).rejects.toThrow('explorer_invalid_window');
  });
  it('limits history read windows', async () => {
    await expect(db.query("select public.read_market_history('80542',date '2026-01-01',date '2026-10-28')")).rejects.toThrow('history_window_limit');
  });
});
