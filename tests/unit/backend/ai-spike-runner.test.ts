import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { audioBytes, CAP, jobs, Ledger, loadPacket, micros, object, projection, providerSchema, redact, schemaErrors, sha, type ObjectValue } from '../../../scripts/ai-spike-731/core.mjs';
import { credentialPresence, Providers, transport, type TextSpec, type Transport } from '../../../scripts/ai-spike-731/providers.mjs';
import { recipeChecks, speechScore, summarize } from '../../../scripts/ai-spike-731/scoring.mjs';
import { executeJob, qualificationTemplate, requireQualified } from '../../../scripts/ai-spike-731/run.mjs';
import { report, reviewQueue } from '../../../scripts/ai-spike-731/report.mjs';

const packet = loadPacket();
const directories: string[] = [];
function directory() { const path = mkdtempSync(resolve(tmpdir(),'ai-spike-ledger-')); directories.push(path); return path; }
const fixture = (id: string) => packet.speech.find(item => item.id === id)!;
function proposal(id: string, patch: ObjectValue = {}) {
  return { status:'proposal', items:[{ ingredientId:id, displayName:id, available:true, quantity:null, unit:null, ...patch }], reviewRequired:[] as string[] };
}
function spec(provider: TextSpec['provider']): TextSpec {
  return { provider, model:provider === 'google' ? 'gemini-3.5-flash-lite' : provider === 'openai' ? 'gpt-6-luna' : 'claude-haiku-5-5', system:'synthetic', input:{ synthetic:true }, schema:packet.recipeSchema, maxInput:8000, maxOutput:6000, inputRate:0.1, outputRate:0.5 };
}
beforeEach(() => { for (const name of ['GEMINI_API_KEY','GOOGLE_API_KEY','OPENAI_API_KEY','ANTHROPIC_API_KEY','DEEPGRAM_API_KEY']) vi.stubEnv(name,''); });
afterEach(() => { vi.unstubAllEnvs(); for (const path of directories.splice(0)) rmSync(path,{ recursive:true, force:true }); });

describe('approved isolated comparison packet', () => {
  it('preserves approved bytes, scored coverage, deterministic order and cap', () => {
    const schedule = jobs(packet);
    expect(schedule).toHaveLength(720);
    expect(new Set(schedule.map(item=>item.key)).size).toBe(720);
    expect(jobs(packet)).toEqual(schedule);
    expect(schedule.reduce((sum,item)=>sum+item.bound,400_000)).toBe(9_778_000);
    expect(packet.models.find(model=>model.id==='claude-haiku')?.maxInputTokens).toBe(9000);
    expect(packet.models.filter(model=>model.id!=='claude-haiku').every(model=>model.maxInputTokens===8000)).toBe(true);
    expect(packet.recipes).toHaveLength(40); expect(packet.speech).toHaveLength(20);
  });
  it('never projects grading oracles or source speech transcripts into provider input', () => {
    const recipe = projection(packet.recipes[0],'recipe',packet);
    expect(recipe).not.toHaveProperty('expected'); expect(recipe).not.toHaveProperty('category');
    const speech = projection(fixture('S10'),'speech',packet,'provider text');
    expect(speech).toHaveProperty('transcriptFromProvider','provider text');
    expect(speech).not.toHaveProperty('transcript'); expect(speech).not.toHaveProperty('expected');
  });
  it('fails on missing or altered audio bytes', () => {
    expect(()=>audioBytes(packet,'S01',directory())).toThrow();
  });
  it('does not discover subscription logins as API keys', () => {
    expect(Object.values(credentialPresence()).every(value=>!value)).toBe(true);
    vi.stubEnv('GOOGLE_API_KEY','fake-local-test'); expect(credentialPresence().google).toBe(true);
  });
  it('refuses incomplete qualification even after plan approval', () => {
    expect(()=>requireQualified(packet,qualificationTemplate(packet))).toThrow('Qualification missing');
  });
  it('requires exact verification timestamps and allows same-day requalification after an audit', () => {
    for (const name of ['GEMINI_API_KEY','OPENAI_API_KEY','ANTHROPIC_API_KEY','DEEPGRAM_API_KEY']) vi.stubEnv(name,'fake-local-test');
    const qualification=qualificationTemplate(packet);
    qualification.runnerReviewEvidence='private completed review'; qualification.audioListeningReviewEvidence='private listening record';
    for (const target of Object.values(object(qualification.targets))) Object.assign(object(target),{ modelAccessVerified:true,billingAndBoundsVerified:true,privacyVerified:true,tokenCountingFreeAndComplete:true,evidence:['private dated verification'] });
    const audit=Date.now()-2000;
    qualification.checkedOn=new Date(audit).toISOString().slice(0,10);
    expect(()=>requireQualified(packet,qualification,audit)).toThrow('full UTC ISO timestamp');
    for (const time of [audit-1,audit]) {
      qualification.checkedOn=new Date(time).toISOString();
      expect(()=>requireQualified(packet,qualification,audit)).toThrow('after the billing audit');
    }
    qualification.checkedOn=new Date(audit+1000).toISOString();
    expect(()=>requireQualified(packet,qualification,audit)).not.toThrow();
    qualification.checkedOn=new Date(Date.now()-25*60*60*1000).toISOString();
    expect(()=>requireQualified(packet,qualification)).toThrow('within 24 hours');
  });
  it('redacts exact secret values without logging headers', () => { expect(redact('prefix fake-secret suffix',['fake-secret'])).toBe('prefix [REDACTED] suffix'); });
});

describe('persisted global budget and restart protection', () => {
  it('preserves coverage commitment and rejects exceeding the cap', () => {
    const ledger = new Ledger(directory(),packet.hash);
    try {
      expect(()=>ledger.reserve('bad',1,CAP)).toThrow('Cap');
      ledger.reserve('good',100,200); ledger.settle('good',75,{ synthetic:true });
      expect(ledger.exposure()).toBe(75);
      expect(()=>ledger.reserve('good',100,0)).toThrow('never replay');
    } finally { ledger.close(); }
  });
  it('prevents concurrent processes and replay after restart', () => {
    const path = directory(); const first = new Ledger(path,packet.hash);
    expect(()=>new Ledger(path,packet.hash)).toThrow();
    first.reserve('once',100,0); first.settle('once',100,{}); first.close();
    const resumed = new Ledger(path,packet.hash);
    try { expect(()=>resumed.reserve('once',100,0)).toThrow('never replay'); expect(resumed.exposure()).toBe(100); }
    finally { resumed.close(); }
  });
  it('retains the entire uncertain charge and blocks new dispatch after restart', () => {
    const path = directory(); const first = new Ledger(path,packet.hash);
    first.reserve('timeout',1000,0); first.uncertain('timeout',{ failure:'deadline' }); first.close();
    const resumed = new Ledger(path,packet.hash);
    try { expect(resumed.exposure()).toBe(1000); expect(()=>resumed.reserve('next',1,0)).toThrow('halted'); }
    finally { resumed.close(); }
  });
  it('treats an abandoned pending entry as uncertain instead of replaying it', () => {
    const path = directory(); const first = new Ledger(path,packet.hash); first.reserve('pending',1000,0); first.close();
    const resumed = new Ledger(path,packet.hash);
    try { expect(()=>resumed.reserve('other',1,0)).toThrow('uncertain'); } finally { resumed.close(); }
  });
  it('records an observed overrun before halting and never reopens the budget', () => {
    const path = directory(); const first = new Ledger(path,packet.hash); first.reserve('overrun',100,0);
    expect(()=>first.settle('overrun',101,{})).toThrow('Usage exceeded'); first.close();
    const resumed = new Ledger(path,packet.hash);
    try { expect(resumed.exposure()).toBe(101); expect(()=>resumed.reserve('next',1,0)).toThrow('halted'); } finally { resumed.close(); }
  });
  it('rejects nonfinite/negative money and keeps plan identity bound to the ledger', () => {
    expect(()=>micros(NaN)).toThrow(); expect(()=>micros(-1)).toThrow();
    const path = directory(); new Ledger(path,packet.hash).close();
    expect(()=>new Ledger(path,'different-packet')).toThrow('identity');
    expect(JSON.parse(readFileSync(resolve(path,'ledger.json'),'utf8')).packet).toBe(packet.hash);
  });
  it('retains all charges across reviewed runner revisions without rebinding the budget', () => {
    const path=directory(); const first=new Ledger(path,packet.hash);
    first.reserve('old',100,0,'a'.repeat(64)); first.settle('old',80,{}); first.close();
    const next=new Ledger(path,packet.hash);
    try {
      next.reserve('new',100,0,'b'.repeat(64)); next.settle('new',90,{});
      expect(next.exposure()).toBe(170); expect(next.entries().map(entry=>entry.runnerHash)).toEqual(['a'.repeat(64),'b'.repeat(64)]);
    } finally { next.close(); }
  });
  it('audits uncertain work at its full bound without refund or replay', () => {
    const ledger=new Ledger(directory(),packet.hash); ledger.reserve('timeout',1000,0); ledger.uncertain('timeout',{});
    try {
      expect(()=>ledger.acknowledgeUncertain('timeout','',true)).toThrow('audit evidence');
      expect(()=>ledger.acknowledgeUncertain('timeout','private receipt',false)).toThrow('audit evidence');
      ledger.acknowledgeUncertain('timeout','2026-11-13 private billing receipt: charge <= bound',true);
      expect(ledger.exposure()).toBe(1000); expect(ledger.latestAuditTime()).toBeGreaterThan(0);
      expect(()=>ledger.reserve('timeout',1000,0)).toThrow('never replay');
      ledger.reserve('next',100,0); ledger.settle('next',50,{}); expect(ledger.exposure()).toBe(1050);
    } finally { ledger.close(); }
  });
});

describe('schema and scoring honesty', () => {
  it('adapts Claude unsupported bounds without weakening original local validation or other providers', () => {
    const adapted=providerSchema(packet.recipeSchema,'anthropic');
    const dishes=object(object(adapted.properties).dishes);
    expect(dishes).not.toHaveProperty('maxItems'); expect(dishes.description).toContain('maxItems: 3');
    const fields=object(object(dishes.items).properties);
    expect(fields.servings).not.toHaveProperty('minimum'); expect(object(fields.servings).description).toContain('minimum: 1');
    expect(fields.title).not.toHaveProperty('minLength');
    expect(fields.ingredients).toHaveProperty('minItems',1);
    expect(object(object(providerSchema(packet.recipeSchema).properties).dishes)).toHaveProperty('maxItems',3);
    const original={type:'array',maxItems:3,items:{type:'number',exclusiveMinimum:0}};
    expect(schemaErrors([0,1,2,3],original)).not.toEqual([]);
    expect(providerSchema(original,'anthropic')).not.toHaveProperty('maxItems');
    expect(object(providerSchema(original,'anthropic').items)).not.toHaveProperty('exclusiveMinimum');
    expect(providerSchema({type:'array',minItems:3,items:{type:'string'}},'anthropic')).toMatchObject({description:'minItems: 3'});
  });
  it('validates conditional clarification schemas and rejects nonfinite quantities', () => {
    expect(schemaErrors({ status:'needs_clarification', explanation:'Conflict', dishes:[] },packet.recipeSchema)).toEqual([]);
    expect(schemaErrors({ status:'ok', explanation:'', dishes:[] },packet.recipeSchema)).not.toEqual([]);
    expect(schemaErrors(Infinity,{ type:'number' })).not.toEqual([]);
    expect(()=>schemaErrors({}, { unsupported:true })).toThrow('Unsupported');
    expect(providerSchema(packet.recipeSchema)).not.toHaveProperty('allOf');
    expect(object(object(providerSchema(packet.speechSchema).properties).status)).toHaveProperty('type','string');
  });
  it('scores hostile object-shaped fields as invalid without prototype lookup or coercion', () => {
    expect(schemaErrors(JSON.parse('{"toString":1}'),{ type:'object',additionalProperties:false,properties:{} })).toEqual(['$.toString: unexpected']);
    const value={ status:{ toString:'bad' },items:[{ ingredientId:{ toString:'bad' } }],reviewRequired:[] };
    expect(speechScore(value,fixture('S03'),packet)).toMatchObject({ schemaValid:false,taskValid:false,fn:1 });
  });
  it('does not declare recipe business compliance or culinary grade automatically', () => {
    const result = recipeChecks({ status:'needs_clarification', explanation:'Conflict', dishes:[] },packet.recipes[38],packet);
    expect(result.schemaValid).toBe(true); expect(result.businessRulesPassed).toBeNull(); expect(result.humanReviewRequired).toBe(true);
  });
  it('scores misses in speech quantity denominators, and duplicate identities as false positives', () => {
    const missing = speechScore({ status:'proposal', items:[], reviewRequired:[] },fixture('S03'),packet);
    expect(missing).toMatchObject({ tp:0, fn:1, quantityCorrect:0, quantityTotal:1 });
    const value = proposal('olive-oil'); value.items.push({ ...value.items[0] });
    expect(speechScore(value,fixture('S01'),packet)).toMatchObject({ tp:1, fp:1, taskValid:false });
  });
  it('rejects guessed identities even when a clarification is also flagged', () => {
    const value = proposal('brown-rice-dry'); value.status='needs_review'; value.reviewRequired=['Which rice?'];
    expect(speechScore(value,fixture('S13'),packet).critical).toContain('unexpected_proposal_in_no_add_case');
  });
  it('accepts both safe noise outcomes and requires clarification for ambiguous food', () => {
    expect(speechScore({ status:'no_change', items:[], reviewRequired:[] },fixture('S17'),packet).taskValid).toBe(true);
    expect(speechScore({ status:'needs_review', items:[], reviewRequired:['Repeat please'] },fixture('S17'),packet).taskValid).toBe(true);
    expect(speechScore({ status:'no_change', items:[], reviewRequired:[] },fixture('S13'),packet).taskValid).toBe(false);
  });
  it('normalizes only approved unit aliases while preserving raw-schema failure', () => {
    const value = proposal('brown-rice-dry',{ quantity:2, unit:'pounds' });
    expect(speechScore(value,fixture('S03'),packet)).toMatchObject({ taskValid:true, schemaValid:false, quantityCorrect:1 });
    expect(speechScore(proposal('brown-rice-dry',{ quantity:32, unit:'oz' }),fixture('S03'),packet).quantityCorrect).toBe(0);
    expect(speechScore(proposal('olive-oil',{ quantity:1, unit:'cup' }),fixture('S01'),packet).taskValid).toBe(false);
  });
  it('retains missing results in the p95 and rate denominators', () => {
    const result = summarize([{ job:{ key:'one',target:'x',fixture:'R01',task:'recipe' },completed:true,completionMs:10,score:{ schemaValid:true,humanReviewRequired:true } }],120);
    expect(result).toMatchObject({ firstAttemptSchemaRate:1/120, observedP95Ms:null, decisionComplete:false,humanReviewPending:true });
  });
  it('never reports a passing provider or winner before the planned attempts exist', () => {
    const summary=report(packet,[]);
    expect(summary).toMatchObject({ observedAttempts:0,plannedAttempts:720,decisionComplete:false,winner:null });
    expect((summary.targets as ObjectValue[]).every(target=>target.gatesPass===false)).toBe(true);
    const speech=(summary.targets as ObjectValue[]).find(target=>target.task==='speech')!;
    expect(speech.fn).toBe(75); expect(speech.quantityTotal).toBe(21);
  });
  it('exports blinded review rows without model identities or costs', () => {
    const job=jobs(packet).find(row=>row.task==='recipe')!;
    const row=reviewQueue(packet,[{ job,completed:false,completionMs:null,score:{},text:'synthetic',proposal:null }],'secret-salt')[0];
    expect(row).not.toHaveProperty('job'); expect(row).not.toHaveProperty('target'); expect(row).not.toHaveProperty('cost');
    expect(row.businessRulesPassed).toBeNull(); expect(String(row.reviewId)).not.toContain(job.target);
  });
  it('does not repair nonfinite raw speech output through JSON receipt serialization', () => {
    const job=jobs(packet).find(item=>item.task==='speech' && item.fixture==='S01')!;
    const row={ job,completed:false,completionMs:null,score:{ schemaValid:false },proposal:proposal('olive-oil'),text:'{"status":"proposal","items":[{"ingredientId":"olive-oil","displayName":"oil","available":true,"quantity":1e400,"unit":"cup"}],"reviewRequired":[]}' };
    const target=(report(packet,[row]).targets as ObjectValue[]).find(item=>item.target===job.target)!;
    expect(target.fn).toBe(75); expect(target.tp).toBe(0);
  });
});

describe('dispatch transaction and receipts', () => {
  const job = jobs(packet).find(item=>item.fixture==='R39' && item.target==='google-lite' && item.repeat===1)!;
  function fakeProvider() {
    const provider=new Providers(async ()=>{ throw new Error('Unexpected egress'); });
    vi.spyOn(provider,'count').mockResolvedValue(100);
    return provider;
  }
  it('persists the reservation before sending and settles a known usage receipt', async () => {
    const path=directory(); const ledger=new Ledger(path,packet.hash); const provider=fakeProvider();
    vi.spyOn(provider,'generate').mockImplementation(async ()=> {
      expect(ledger.entries()[0].state).toBe('pending');
      return { text:JSON.stringify({ status:'needs_clarification',explanation:'Conflict',dishes:[] }),inputTokens:100,outputTokens:20,cost:80,model:'gemini-3.5-flash-lite',timing:{ uploadMs:1,totalMs:2 },usage:{ inputTokens:100,outputTokens:20 } };
    });
    try {
      const receipt=await executeJob(packet,job,ledger,0,'unused',provider,resolve(path,'results'));
      expect(receipt.completed).toBe(true); expect(ledger.exposure()).toBe(80); expect(ledger.entries()[0].state).toBe('settled');
      expect(receipt.score.humanReviewRequired).toBe(true);
    } finally { ledger.close(); }
  });
  it('retains an uncertain full reservation and never retries', async () => {
    const path=directory(); const ledger=new Ledger(path,packet.hash); const provider=fakeProvider();
    const generate=vi.spyOn(provider,'generate').mockRejectedValue(new Error('timeout'));
    try {
      const receipt=await executeJob(packet,job,ledger,0,'unused',provider,resolve(path,'results'));
      expect(receipt.failure).toBe('provider_or_usage_uncertain'); expect(generate).toHaveBeenCalledOnce();
      expect(ledger.exposure()).toBe(job.bound); expect(ledger.entries()[0].state).toBe('uncertain');
    } finally { ledger.close(); }
  });
  it('settles a no-dispatch token preflight failure at zero without sending generation', async () => {
    const path=directory(); const ledger=new Ledger(path,packet.hash); const provider=fakeProvider();
    vi.spyOn(provider,'count').mockRejectedValue(new Error('Input too large')); const generate=vi.spyOn(provider,'generate');
    try {
      const receipt=await executeJob(packet,job,ledger,0,'unused',provider,resolve(path,'results'));
      expect(receipt.failure).toBe('preflight_failed'); expect(generate).not.toHaveBeenCalled(); expect(ledger.exposure()).toBe(0);
    } finally { ledger.close(); }
  });
  it('counts malformed generation as a failed attempt with a known billable charge', async () => {
    const path=directory(); const ledger=new Ledger(path,packet.hash); const provider=fakeProvider();
    vi.spyOn(provider,'generate').mockResolvedValue({ text:'not JSON',inputTokens:100,outputTokens:20,cost:80,model:'gemini-3.5-flash-lite',timing:{ uploadMs:1,totalMs:2 },usage:{} });
    try {
      const receipt=await executeJob(packet,job,ledger,0,'unused',provider,resolve(path,'results'));
      expect(receipt.completed).toBe(false); expect(receipt.failure).toBe('output_invalid'); expect(ledger.exposure()).toBe(80);
    } finally { ledger.close(); }
  });
  it('identifies a failed extraction preflight after paid transcription without hiding its charge', async () => {
    const path=directory(); const bytes=Buffer.from('synthetic test fixture'); writeFileSync(resolve(path,'S01.wav'),bytes);
    const testPacket={ ...packet,audio:[{ id:'S01',filename:'S01.wav',sha256:sha(bytes),durationSeconds:2 }] };
    const speechJob=jobs(packet).find(item=>item.target==='openai-transcribe-luna' && item.fixture==='S01')!;
    const ledger=new Ledger(path,packet.hash); const provider=fakeProvider();
    vi.spyOn(provider,'transcribe').mockResolvedValue({ text:'Add olive oil',model:'gpt-transcribe',cost:4500,timing:{ uploadMs:1,totalMs:2 },usage:{ audioSeconds:2 } });
    vi.spyOn(provider,'count').mockRejectedValue(new Error('count quota'));
    try {
      const receipt=await executeJob(testPacket,speechJob,ledger,0,path,provider,resolve(path,'results'));
      expect(receipt.failure).toBe('preflight_failed_after_paid_stage'); expect(ledger.exposure()).toBe(4500); expect(receipt.costMicroUsd).toBe(4500);
      expect(ledger.entries()[0].state).toBe('settled');
    } finally { ledger.close(); }
  });
});

describe('provider wire contracts without external calls', () => {
  it('sends OpenAI structured output, store:false and token limits without tools/retries', async () => {
    vi.stubEnv('OPENAI_API_KEY','fake-local-test');
    const calls: {url:string;body:ObjectValue}[] = [];
    const fetcher: Transport = async (input,init) => {
      const request = new Request(input,init); expect(request.headers.get('authorization')).toBe('Bearer fake-local-test'); const body=object(await request.json()); calls.push({ url:request.url,body });
      return new Response(JSON.stringify(request.url.endsWith('input_tokens') ? { input_tokens:100 } : { model:'gpt-6-luna',status:'completed',usage:{ input_tokens:100,output_tokens:20 },output:[{ content:[{ type:'output_text',text:'{}' }] }] }),{ status:200 });
    };
    const provider = new Providers(fetcher); await provider.count(spec('openai'),AbortSignal.timeout(1000));
    const result = await provider.generate(spec('openai'),AbortSignal.timeout(1000));
    expect(calls).toHaveLength(2); expect(calls[1].body).toMatchObject({ store:false,max_output_tokens:6000,tools:[],service_tier:'default' });
    expect(result).toMatchObject({ text:'{}',inputTokens:100,outputTokens:20,cost:20 });
  });
  it('uses the real Gemini SDK with one attempt, bounded output and JSON schema', async () => {
    vi.stubEnv('GEMINI_API_KEY','fake-local-test'); const calls: ObjectValue[]=[];
    const fetcher: Transport = async (input,init) => {
      const request=new Request(input,init); expect(request.headers.get('x-goog-api-key')).toBe('fake-local-test'); calls.push(object(await request.json()));
      return new Response(JSON.stringify({ modelVersion:'gemini-3.5-flash-lite',candidates:[{ content:{ role:'model',parts:[{ text:'{}' }] } }],usageMetadata:{ promptTokenCount:100,candidatesTokenCount:20,thoughtsTokenCount:0 } }),{ status:200,headers:{ 'content-type':'application/json' } });
    };
    const result=await new Providers(fetcher).generate(spec('google'),AbortSignal.timeout(1000));
    expect(calls).toHaveLength(1); expect(calls[0].generationConfig).toMatchObject({ maxOutputTokens:6000,candidateCount:1,responseMimeType:'application/json',thinkingConfig:{ thinkingBudget:0 } });
    expect(result.text).toBe('{}');
  });
  it('never retries a Gemini provider error', async () => {
    vi.stubEnv('GEMINI_API_KEY','fake-local-test'); let calls=0;
    const fetcher: Transport = async () => { calls++; return new Response(JSON.stringify({ error:{ code:503,message:'unavailable' } }),{ status:503 }); };
    await expect(new Providers(fetcher).generate(spec('google'),AbortSignal.timeout(1000))).rejects.toThrow(); expect(calls).toBe(1);
  });
  it('counts the full Google system/schema request through the real SDK without unsupported count config', async () => {
    vi.stubEnv('GEMINI_API_KEY','fake-local-test'); const calls:ObjectValue[]=[];
    const fetcher:Transport=async (input,init)=> {
      const request=new Request(input,init); calls.push(object(await request.json()));
      return new Response(JSON.stringify({ totalTokens:123 }),{ status:200,headers:{ 'content-type':'application/json' } });
    };
    expect(await new Providers(fetcher).count(spec('google'),AbortSignal.timeout(1000))).toBe(123);
    expect(calls).toHaveLength(1); expect(calls[0]).not.toHaveProperty('contents');
    expect(calls[0].generateContentRequest).toMatchObject({ model:'models/gemini-3.5-flash-lite',systemInstruction:{ parts:[{ text:'synthetic' }] },generationConfig:{ maxOutputTokens:6000,responseMimeType:'application/json' } });
    expect(object(object(calls[0].generateContentRequest).generationConfig).responseJsonSchema).toBeDefined();
  });
  it('preserves Anthropic count/generation schema settings and records usage', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY','fake-local-test'); vi.stubEnv('ANTHROPIC_WORKSPACE_ID','wrkspc_test731'); const calls:ObjectValue[]=[];
    const fetcher: Transport = async (input,init) => {
      const request=new Request(input,init);
      expect(request.headers.get('authorization')).toBe('Bearer fake-local-test'); expect(request.headers.get('anthropic-version')).toBe('2026-10-21'); expect(request.headers.get('anthropic-workspace-id')).toBe('wrkspc_test731');
      const body=object(await request.json()); calls.push(body);
      return new Response(JSON.stringify(request.url.endsWith('count_tokens') ? { input_tokens:50 } : { model:'claude-haiku-5-5',usage:{ input_tokens:50,cache_read_input_tokens:25,output_tokens:10 },content:[{ type:'text',text:'{}' }],stop_reason:'end_turn' }),{ status:200 });
    };
    const provider=new Providers(fetcher); await provider.count(spec('anthropic'),AbortSignal.timeout(1000)); const result=await provider.generate(spec('anthropic'),AbortSignal.timeout(1000));
    const wireSchema=object(object(object(calls[0].output_config).format).schema);
    expect(object(object(wireSchema.properties).dishes)).not.toHaveProperty('maxItems');
    expect(object(object(wireSchema.properties).dishes).description).toContain('maxItems: 3');
    expect(calls[0].output_config).toEqual(calls[1].output_config); expect(calls[1].max_tokens).toBe(6000); expect(result.outputTokens).toBe(10); expect(result.inputTokens).toBe(75); expect(result.cost).toBe(13);
  });
  it('opts out of Deepgram model improvement and retains duration-charge allowance', async () => {
    vi.stubEnv('DEEPGRAM_API_KEY','fake-local-test'); let url='';
    const fetcher: Transport = async (input,init) => { url=String(input); expect(new Request(input,init).headers.get('authorization')).toBe('Token fake-local-test'); return new Response(JSON.stringify({ results:{ channels:[{ alternatives:[{ transcript:'Add onions' }] }] } }),{ status:200 }); };
    const result=await new Providers(fetcher).transcribe('deepgram',Buffer.from('synthetic'),3,'transcribe',AbortSignal.timeout(1000));
    expect(url).toContain('mip_opt_out=true'); expect(result.cost).toBe(10_000); expect(result.usage.accounting).toBe('qualified-opt-out-duration-upper-bound');
  });
  it('refuses unapproved origins without sending credentials', async () => {
    await expect(transport(()=>{})('https://example.com')).rejects.toThrow('Unapproved provider origin');
  });
});
