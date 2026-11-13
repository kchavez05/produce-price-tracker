import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { atomicJson, audioBytes, jobs, Ledger, loadPacket, object, projection, readJson, redact, ROOT, sha, STATE, type Fixture, type Job, type ObjectValue, type Packet } from './core.mjs';
import { credentialPresence, Providers, type Result, type TextSpec } from './providers.mjs';
import { recipeChecks, speechScore } from './scoring.mjs';
import { exportReview, receipts, report } from './report.mjs';

export function runnerHash(): string {
  return sha(['core.mts','providers.mts','scoring.mts','report.mts','run.mts'].map(name => sha(readFileSync(resolve(ROOT,'scripts/ai-spike-731',name)))).join(':'));
}
export function qualificationTemplate(packet: Packet): ObjectValue {
  return { issue:731, packetHash:packet.hash, runnerHash:runnerHash(), approvedPlan:'docs/research/ai-provider-spike-731/execution-approval.json',
    runnerReviewEvidence:'', audioListeningReviewEvidence:'', checkedOn:'',
    targets:Object.fromEntries(jobs(packet).map(job => [job.target, { modelAccessVerified:false, billingAndBoundsVerified:false, privacyVerified:false, tokenCountingFreeAndComplete:false, evidence:[] }])) };
}
export function requireQualified(packet: Packet, qualification: ObjectValue): void {
  if (qualification.issue !== 731 || qualification.packetHash !== packet.hash || qualification.runnerHash !== runnerHash()) throw new Error('Qualification does not bind this approved packet and runner');
  for (const field of ['runnerReviewEvidence','audioListeningReviewEvidence','checkedOn']) if (typeof qualification[field] !== 'string' || !String(qualification[field]).trim()) throw new Error(`Qualification missing ${field}`);
  const date = Date.parse(String(qualification.checkedOn));
  if (!Number.isFinite(date) || date > Date.now() + 60_000 || Date.now() - date > 24*60*60*1000) throw new Error('Qualification must be refreshed within 24 hours');
  const targets = object(qualification.targets);
  for (const target of new Set(jobs(packet).map(job => job.target))) {
    const record = object(targets[target]);
    for (const flag of ['modelAccessVerified','billingAndBoundsVerified','privacyVerified','tokenCountingFreeAndComplete']) if (record[flag] !== true) throw new Error(`Unqualified ${target}: ${flag}`);
    if (!Array.isArray(record.evidence) || !record.evidence.length || record.evidence.some(item => typeof item !== 'string' || !item.trim())) throw new Error(`Missing evidence for ${target}`);
  }
  if (Object.values(credentialPresence()).some(present => !present)) throw new Error('Missing provider credentials; no paid call made');
}
function recipeSpec(packet: Packet, job: Job, fixture: Fixture): TextSpec {
  const candidate = packet.models.find(model => model.id === job.target);
  if (!candidate) throw new Error('Unknown recipe target');
  return { provider:candidate.provider, model:candidate.model, system:String(packet.prompts.recipeSystem), input:projection(fixture,'recipe',packet), schema:packet.recipeSchema,
    maxInput:candidate.maxInputTokens, maxOutput:candidate.maxBillableOutputTokens, inputRate:candidate.inputUsdPerMillion, outputRate:candidate.outputUsdPerMillion };
}
function speechSpec(packet: Packet, fixture: Fixture, transcript?: string): TextSpec {
  return { provider:transcript === undefined ? 'google' : 'openai', model:transcript === undefined ? 'gemini-3.5-flash-lite' : 'gpt-6-luna', system:String(packet.prompts.speechSystem), input:projection(fixture,'speech',packet,transcript), schema:packet.speechSchema,
    maxInput:transcript === undefined ? 4960 : 4000, maxOutput:1024, inputRate:transcript === undefined ? 0.3 : 0.1, outputRate:transcript === undefined ? 2.5 : 0.5 };
}
export interface Receipt extends ObjectValue { job: Job; completed: boolean; completionMs: number | null; score: ObjectValue }
export async function executeJob(packet: Packet, job: Job, ledger: Ledger, remaining: number, audioDirectory: string, providers: Providers, resultsDirectory = resolve(STATE,'results')): Promise<Receipt> {
  const fixture = (job.task === 'recipe' ? packet.recipes : packet.speech).find(item => item.id === job.fixture);
  if (!fixture) throw new Error('Unknown fixture');
  const clip = job.task === 'speech' ? audioBytes(packet,job.fixture,audioDirectory) : undefined;
  const secrets = ['GEMINI_API_KEY','GOOGLE_API_KEY','OPENAI_API_KEY','ANTHROPIC_API_KEY','DEEPGRAM_API_KEY'].map(name => process.env[name] ?? '').filter(Boolean);
  ledger.reserve(job.key,job.bound,remaining,runnerHash());
  const stages: Result[] = []; let dispatched = false; let started = 0; let firstUpload = 0; let firstUploadEnd: number | undefined; let preflightMs = 0;
  let text = ''; let failure: string | null = null; let parsed: unknown = null;
  let firstPaidDispatch = 0; let timer: ReturnType<typeof setTimeout> | undefined; let controller: AbortController | undefined;
  let boundViolation = false;
  let countFailed = false;
  const startDeadline = () => {
    if (!controller) { firstPaidDispatch = performance.now(); controller = new AbortController(); timer = setTimeout(() => controller?.abort(),job.task === 'recipe' ? 45_000 : 15_000); }
    return controller.signal;
  };
  const record = (result: Result, maxInput?: number, maxOutput?: number, expectedModel?: string) => {
    stages.push(result); dispatched = false;
    if (stages.length === 1) { firstUpload = result.timing.uploadMs; firstUploadEnd=result.timing.uploadCompletedAt; }
    if (expectedModel && result.model !== expectedModel && !result.model.startsWith(`${expectedModel}-`)) { dispatched=true; throw new Error('Unexpected reported model identity; billing requires audit'); }
    if (maxInput !== undefined && (result.inputTokens === undefined || result.inputTokens > maxInput) || maxOutput !== undefined && (result.outputTokens === undefined || result.outputTokens > maxOutput)) {
      boundViolation = true; throw new Error('Observed billable bound violation');
    }
    return result;
  };
  const generate = async (spec: TextSpec) => {
    const countStart = performance.now();
    try { await providers.count(spec, controller?.signal ?? AbortSignal.timeout(30_000)); }
    catch (error) { countFailed = true; throw error; }
    preflightMs += performance.now() - countStart;
    const signal = startDeadline(); dispatched = true;
    return record(await providers.generate(spec,signal), spec.maxInput, spec.maxOutput, spec.model);
  };
  started = performance.now();
  try {
    if (job.task === 'recipe') text = (await generate(recipeSpec(packet,job,fixture))).text;
    else if (job.target === 'google-direct') text = (await generate({ ...speechSpec(packet,fixture), audio:clip })).text;
    else {
      if (!clip) throw new Error('Missing audio');
      const provider = job.target === 'google-transcribe-luna' ? 'google' : job.target === 'openai-transcribe-luna' ? 'openai' : job.target === 'deepgram-luna' ? 'deepgram' : null;
      if (!provider) throw new Error('Unknown pipeline');
      if (provider === 'google') {
        const countStart = performance.now();
        try { await providers.countGoogleTranscription(clip.bytes,String(packet.prompts.transcriptionInstruction),AbortSignal.timeout(30_000)); }
        catch (error) { countFailed = true; throw error; }
        preflightMs += performance.now()-countStart;
      }
      const signal = startDeadline(); dispatched = true;
      const transcript = record(await providers.transcribe(provider,clip.bytes,clip.seconds,String(packet.prompts.transcriptionInstruction),signal), provider === 'google' ? 1216 : undefined, provider === 'google' ? 512 : undefined, provider === 'google' ? 'gemini-3.5-transcribe' : provider === 'openai' ? 'gpt-transcribe' : 'nova-3').text;
      text = (await generate(speechSpec(packet,fixture,transcript))).text;
    }
    text = redact(text,secrets);
    parsed = JSON.parse(text);
  } catch {
    failure = boundViolation ? 'observed_billable_bound_violation' : dispatched ? 'provider_or_usage_uncertain' : countFailed ? stages.length ? 'preflight_failed_after_paid_stage' : 'preflight_failed' : stages.length ? 'output_invalid' : 'preflight_failed';
  } finally { clearTimeout(timer); }
  const elapsed = performance.now() - started;
  const score = job.task === 'recipe' ? recipeChecks(parsed,fixture,packet) : { ...speechScore(parsed,fixture,packet) };
  const valid = !failure && (job.task === 'recipe' ? score.schemaValid === true && !(score.automaticErrors as unknown[]).length && !(score.automaticCritical as unknown[]).length : score.taskValid === true);
  const finished = performance.now();
  const completionMs = valid ? (job.task === 'recipe' ? finished - firstPaidDispatch : finished - (firstUploadEnd ?? firstPaidDispatch + firstUpload)) : null;
  const cost = stages.reduce((sum,stage) => sum+stage.cost,0);
  const receipt: Receipt = { job, packetHash:packet.hash, runnerHash:runnerHash(), startedAt:new Date(Date.now()-elapsed).toISOString(), completed:valid,
    completionMs, elapsedMs:elapsed, preflightMs, firstUploadMs:firstUpload, failure,
    text, proposal:parsed, score, usage:stages.map(stage => ({ model:stage.model, ...stage.usage, costMicroUsd:stage.cost, ...stage.timing })),
    costMicroUsd:dispatched ? null : cost, retainedReservationMicroUsd:dispatched ? job.bound : 0,
    schemaSha256:sha(JSON.stringify(job.task === 'recipe' ? packet.recipeSchema : packet.speechSchema)), humanReviewRequired:job.task === 'recipe' };
  const safeReceipt = object(JSON.parse(redact(JSON.stringify(receipt),secrets))) as Receipt;
  const receiptPath = resolve(resultsDirectory,`${sha(job.key)}.json`);
  atomicJson(receiptPath,safeReceipt);
  const reference = { filename:`results/${sha(job.key)}.json`, sha256:sha(readFileSync(receiptPath)), completed:valid };
  if (dispatched) ledger.uncertain(job.key,reference);
  else {
    ledger.settle(job.key,cost,reference);
    // A parsed result may expose a violated individual input/output limit even
    // when its combined monetary charge remains below the job reservation.
    if (boundViolation) ledger.halt();
  }
  return safeReceipt;
}
export async function main(argv: string[]): Promise<void> {
  const packet = loadPacket(); const schedule = jobs(packet);
  const option = (flag: string) => { const index = argv.indexOf(flag); return index < 0 ? undefined : argv[index+1]; };
  if (option('--acknowledge-uncertain')) {
    const evidence=option('--evidence'); if (!evidence || !argv.includes('--bound-confirmed')) throw new Error('Billing audit evidence and confirmed charge bound required');
    const ledger=new Ledger(STATE,packet.hash);
    try { ledger.acknowledgeUncertain(option('--acknowledge-uncertain')!,evidence,true); console.log(JSON.stringify({ action:'audited_full_bound_retained',exposureUsd:ledger.exposure()/1_000_000,apiCallsMade:0 })); }
    finally { ledger.close(); }
    return;
  }
  if (argv.includes('--summary') || option('--export-review')) {
    const results=receipts(packet);
    if (option('--export-review')) exportReview(packet,results,resolve(option('--export-review')!));
    const reviewPath=option('--reviews');
    const reviews=reviewPath ? object(readJson(resolve(reviewPath))).rows as ObjectValue[] : [];
    const saltPath=resolve(STATE,'private','review-salt.json');
    const salt=existsSync(saltPath) ? String(object(readJson(saltPath)).salt) : undefined;
    const summary=report(packet,results,reviews,salt);
    if (option('--write-summary')) atomicJson(resolve(option('--write-summary')!),summary);
    console.log(JSON.stringify(summary,null,2)); return;
  }
  if (!argv.includes('--run')) {
    const report = { issue:731, packetHash:packet.hash, runnerHash:runnerHash(), credentials:credentialPresence(), apiCallsMade:0, apiSpendUsd:0,
      plannedAttempts:schedule.length, plannedReservationUsd:schedule.reduce((sum,job)=>sum+job.bound,400_000)/1_000_000,
      status:'preflight-only; model access, pricing/privacy, billable bounds, runner review and audio listening must be qualified', scope:'API counters describe this offline preflight only; inspect the shared ledger for previous exposure', stateDirectory:STATE };
    if (option('--write-preflight')) atomicJson(resolve(option('--write-preflight')!),report);
    if (option('--write-qualification-template')) atomicJson(resolve(option('--write-qualification-template')!),qualificationTemplate(packet));
    console.log(JSON.stringify(report,null,2)); return;
  }
  const qualificationPath = option('--qualification'); const audioDirectory = option('--audio-dir');
  if (!qualificationPath || !audioDirectory) throw new Error('--run requires --qualification and --audio-dir');
  const qualification=object(readJson(resolve(qualificationPath)));
  requireQualified(packet,qualification);
  // Verify every approved byte before opening the budget or dispatching anything.
  for (const fixture of packet.speech) audioBytes(packet,fixture.id,audioDirectory);
  const frozenRunnerHash=runnerHash();
  // Budget identity survives reviewed runner fixes. Each reservation and receipt
  // retains its exact runner hash; the qualified current code cannot replay keys.
  const ledger = new Ledger(STATE,packet.hash);
  try {
    ledger.assertRunnable();
    if (Date.parse(String(qualification.checkedOn))<=ledger.latestAuditTime()) throw new Error('Renew qualification after the billing audit');
    const providers = new Providers();
    for (const job of schedule) {
      if (runnerHash()!==frozenRunnerHash) throw new Error('Runner changed during execution');
      if (ledger.activeMs() > 8*60*60*1000) throw new Error('Approved active execution timebox reached');
      const prior = ledger.entries();
      if (prior.some(entry=>entry.key===job.key)) continue;
      const remaining = schedule.filter(item=>item.key!==job.key && !prior.some(entry=>entry.key===item.key)).reduce((sum,item)=>sum+item.bound,400_000);
      const receipt = await executeJob(packet,job,ledger,remaining,audioDirectory,providers);
      console.log(JSON.stringify({ key:job.key, completed:receipt.completed, failure:receipt.failure, exposureUsd:ledger.exposure()/1_000_000 }));
      if (['provider_or_usage_uncertain','observed_billable_bound_violation','preflight_failed','preflight_failed_after_paid_stage'].includes(String(receipt.failure))) throw new Error('Request requires audit or renewed qualification');
    }
  } finally { ledger.close(); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main(process.argv.slice(2)).catch(() => { console.error('Spike halted. Inspect sanitized preflight/ledger receipts; no automatic retry.'); process.exitCode=1; });
}
