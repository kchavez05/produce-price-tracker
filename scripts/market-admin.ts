/** Operator-only CLI. Never put credentials in command arguments. */
import fs from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { marketClient, asJson } from '../src/lib/market/client';
import { ingestUsda } from '../src/lib/usda/ingest';
import { parseReport, validateConfig, hash, record, sourceDay } from '../src/lib/usda/adapter';
import { reportQuery, UsdaTransport } from '../src/lib/usda/transport';
import { currentAdCycle } from '../src/lib/offer-freshness';

const [command, ...args] = process.argv.slice(2);
const arg = (name: string) => args[args.indexOf(name) + 1];
const required = (name: string) => { if (!args.includes(name) || !arg(name) || arg(name).startsWith('--')) throw new Error(`Required: ${name}`); return arg(name); };
const client = marketClient();
const key = process.env.USDA_MARS_API_KEY?.trim();
const now = new Date(); const start = new Date(now); start.setUTCDate(start.getUTCDate() - 14);
async function main() {
  if (command === 'discover') {
    if (!key) throw new Error('Configure USDA_MARS_API_KEY securely in .env.local');
    const transport = new UsdaTransport(key);
    const slug = args.includes('--slug') ? required('--slug') : '';
    const payload = await transport.get(`/${slug}`, slug ? reportQuery(start.toISOString().slice(0,10), now.toISOString().slice(0,10)) : undefined);
    await fs.writeFile(required('--out'), JSON.stringify(payload, null, 2), { mode: 0o600 });
    console.log(JSON.stringify({ status: 'saved', requests: transport.requests, hash: hash(payload) }));
  } else if (command === 'validate-report') {
    if (!client || !key) throw new Error('Server Supabase and USDA credentials required');
    const definition = record(JSON.parse(await fs.readFile(required('--definition'), 'utf8')));
    const slug = String(definition.slug); const config = validateConfig(definition.config);
    const transport = new UsdaTransport(key);
    const payload = await transport.get(`/${slug}`, reportQuery(start.toISOString().slice(0,10), now.toISOString().slice(0,10)));
    const reports = parseReport(payload, config);
    if (!reports.some((report) => report.rows.length)) throw new Error('No compatible observations; report not enabled');
    // Evidence must be an operator-reviewed record of source identity, timing, units and filter behavior.
    const evidence = record(definition.validationEvidence);
    for (const field of ['catalogTitle','releaseSchedule','sourceTimezone','queryValidation','unitValidation','fixtureHash']) {
      if (typeof evidence[field] !== 'string' || String(evidence[field]).trim().length < 3) throw new Error(`Missing validation evidence: ${field}`);
    }
    const { error } = await client.from('usda_report_catalog').upsert({ slug, title: String(definition.title),
      config: asJson({ ...config, validationEvidence: { ...evidence, validatedPayloadHash:hash(payload) } }), validated_at: now.toISOString(), updated_at:now.toISOString(), enabled: true });
    if (error) throw new Error('Catalog write failed');
    console.log(JSON.stringify({ status: 'validated', slug, observations: reports.reduce((n,r) => n+r.rows.length,0), requests: transport.requests }));
  } else if (command === 'recover') {
    console.log(JSON.stringify(await ingestUsda({ trigger: 'recovery', reason: required('--reason') })));
  } else if (command === 'backfill') {
    required('--reason');
    // One cycle per invocation makes a 12-week backfill resumable and bounded by the worker's 20-call budget.
    const cycle = sourceDay(required('--week-ending'));
    if (cycle >= currentAdCycle().start) throw new Error('Backfill must precede the current planning cycle');
    if (Date.now() - Date.parse(cycle) > 84 * 86400000) throw new Error('Initial backfill is limited to 12 weeks');
    console.log(JSON.stringify(await ingestUsda({ trigger: 'backfill', cycle, reason: required('--reason') })));
  } else if (command === 'import-sqlite') {
    if (!client) throw new Error('Server Supabase credentials required');
    const source = required('--file'); const snapshot = required('--snapshot');
    const snapshotExists = await fs.access(snapshot).then(()=>true,()=>false);
    if (!snapshotExists) {
    const sqlite = new DatabaseSync(source, { readOnly: true });
    // VACUUM INTO includes committed WAL contents and produces a consistent local snapshot.
    try { sqlite.prepare('VACUUM INTO ?').run(snapshot); } finally { sqlite.close(); }
    }
    await fs.chmod(snapshot, 0o600);
    const checksum = createHash('sha256').update(await fs.readFile(snapshot)).digest('hex');
    const copy = new DatabaseSync(snapshot, { readOnly:true });
    const tables: Record<string, Record<string,unknown>[]> = {};
    try {
      for (const table of ['weekly_offers','usda_snapshots']) tables[table] = copy.prepare(`SELECT * FROM ${table}`).all() as Record<string,unknown>[];
    } finally { copy.close(); }
    const counts = Object.fromEntries(Object.entries(tables).map(([name,rows])=>[name,rows.length]));
    const { data: receipt,error } = await client.from('market_legacy_imports').upsert({ snapshot_sha256:checksum,counts },{onConflict:'snapshot_sha256',ignoreDuplicates:true}).select('id').maybeSingle();
    if (error) throw new Error('Import receipt failed');
    const existing = receipt ?? (await client.from('market_legacy_imports').select('id').eq('snapshot_sha256',checksum).single()).data;
    if (!existing) throw new Error('Import receipt missing');
    const records = Object.entries(tables).flatMap(([table,rows])=>rows.map(row=>({import_id:existing.id,row_key:hash({table,row}),
      provenance:table==='usda_snapshots'||['CURATED_FALLBACK','SQLITE_HISTORICAL'].includes(String(row.source))?'synthetic_seed':'legacy_unverified', payload:asJson({table,row})})));
    for(let index=0;index<records.length;index+=100) {
      const { error } = await client.from('market_legacy_rows').upsert(records.slice(index,index+100),{onConflict:'import_id,row_key',ignoreDuplicates:true});
      if(error) throw new Error('Import incomplete; retry using the same snapshot');
    }
    console.log(JSON.stringify({status:'quarantined_legacy',snapshotSha256:checksum,counts}));
  } else if (command === 'health') {
    if (!client) throw new Error('Server Supabase credentials required');
    const { data, error } = await client.from('market_ingestion_runs').select('id,cycle,status,completed_at,request_count,outcomes')
      .eq('trigger','scheduled').eq('cycle', currentAdCycle().start).order('started_at', { ascending: false }).limit(1).maybeSingle();
    if (error) throw new Error('Health query failed');
    console.log(JSON.stringify(data ?? { status: 'missing_run' }));
    if (!data || !['succeeded','unchanged'].includes(data.status)) process.exitCode = 1;
  } else {
    throw new Error('Commands: discover --out FILE [--slug ID]; validate-report --definition FILE; recover --reason TEXT; backfill --week-ending YYYY-MM-DD --reason TEXT; health');
  }
}
main().catch((error: unknown) => { console.error(error instanceof Error && !/key|authorization|Basic /.test(error.message) ? error.message : 'market_admin_failed'); process.exitCode = 1; });
