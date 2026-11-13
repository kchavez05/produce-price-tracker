import { randomBytes } from 'node:crypto';
import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { atomicJson, jobs, object, readJson, sha, STATE, type ObjectValue, type Packet } from './core.mjs';
import { speechScore, summarize } from './scoring.mjs';
import type { Receipt } from './run.mjs';

const DIMENSIONS = ['practicality','methodClarity','quantitiesAndServings','adherence','variety'] as const;
export function receipts(packet: Packet, directory = resolve(STATE,'results')): Receipt[] {
  if (!existsSync(directory)) return [];
  const schedule = new Map(jobs(packet).map(job=>[job.key,job]));
  return readdirSync(directory).filter(name=>name.endsWith('.json')).map(name => {
    const receipt = object(readJson(resolve(directory,name))) as Receipt;
    if (!receipt.job || !schedule.has(receipt.job.key) || name !== `${sha(receipt.job.key)}.json` || receipt.packetHash !== packet.hash || JSON.stringify(receipt.job) !== JSON.stringify(schedule.get(receipt.job.key))) throw new Error('Unknown or drifted result receipt');
    return receipt;
  });
}
export function reviewQueue(packet: Packet, results: Receipt[], salt: string): ObjectValue[] {
  return results.filter(result=>result.job.task==='recipe').map(result=>({
    reviewId:sha(`${salt}:${result.job.key}`).slice(0,24),
    fixture:packet.recipes.find(fixture=>fixture.id===result.job.fixture),
    response:result.text, proposal:result.proposal,
    businessRulesPassed:null, criticalDietaryViolation:null,
    grades:Object.fromEntries(DIMENSIONS.map(name=>[name,null])), reason:'',
  })).sort((a,b)=>a.reviewId.localeCompare(b.reviewId));
}
export function exportReview(packet: Packet, results: Receipt[], output: string): void {
  const saltPath=resolve(STATE,'private','review-salt.json');
  const salt=existsSync(saltPath) ? String(object(readJson(saltPath)).salt) : randomBytes(32).toString('hex');
  if (!existsSync(saltPath)) atomicJson(saltPath,{ salt });
  atomicJson(output,{ issue:731,packetHash:packet.hash,rows:reviewQueue(packet,results,salt),note:'Blinded recipe review only. Do not inspect private provider/run mapping before locking scores. Null fields remain unreviewed.' });
}
export function report(packet: Packet, results: Receipt[], reviews: ObjectValue[] = [], salt?: string): ObjectValue {
  const allJobs=jobs(packet); const reviewMap=new Map<string,ObjectValue>();
  for (const review of reviews) {
    if (typeof review.reviewId!=='string' || reviewMap.has(review.reviewId)) throw new Error('Duplicate/invalid review ID');
    reviewMap.set(review.reviewId,review);
  }
  if (reviews.length && !salt) throw new Error('Review salt is required');
  const knownReviewIds=new Set(results.filter(row=>row.job.task==='recipe').map(row=>sha(`${salt}:${row.job.key}`).slice(0,24)));
  if (reviews.some(row=>!knownReviewIds.has(String(row.reviewId)))) throw new Error('Review does not match these results');
  const targets: ObjectValue[]=[];
  for (const target of new Set(allJobs.map(job=>job.target))) {
    const planned=allJobs.filter(job=>job.target===target); const observed=results.filter(row=>row.job.target===target);
    const task=planned[0].task;
    const base=summarize(observed,planned.length);
    if (task==='recipe') {
      let reviewed=0; let rulePass=0; let critical=0; let culinarySum=0;
      const adjusted=observed.map(row=>{
        const review=reviewMap.get(sha(`${salt}:${row.job.key}`).slice(0,24));
        if (!review || review.businessRulesPassed===null || review.criticalDietaryViolation===null) return row;
        if (typeof review.businessRulesPassed!=='boolean' || typeof review.criticalDietaryViolation!=='boolean') throw new Error('Review gates must be explicit booleans');
        const grades=object(review.grades);
        if (row.score.schemaValid===true && DIMENSIONS.some(name=>typeof grades[name]!=='number' || !Number.isInteger(grades[name]) || Number(grades[name])<1 || Number(grades[name])>5)) throw new Error('Culinary grades must be integers 1–5');
        reviewed++;
        const pass=review.businessRulesPassed && row.score.schemaValid===true && !(row.score.automaticErrors as unknown[]).length;
        if (pass) rulePass++;
        if (review.criticalDietaryViolation || (row.score.automaticCritical as unknown[]).length) critical++;
        const grade=row.score.schemaValid===true ? DIMENSIONS.reduce((sum,name)=>sum+Number(grades[name]),0)/DIMENSIONS.length : 0;
        if (grade>0 && grade<4 && (typeof review.reason!=='string' || !review.reason.trim())) throw new Error('Below-4 grade needs a reason');
        culinarySum+=grade;
        return { ...row,completed:row.completed && pass && !review.criticalDietaryViolation };
      });
      const final=summarize(adjusted,planned.length);
      const complete=reviewed===planned.length && observed.length===planned.length;
      targets.push({ target,task,evaluationStatus:observed.length ? 'observed' : 'not_run',...final,reviewed,rulePass,critical,meanCulinaryIncludingFailures:culinarySum/planned.length,
        gatesPass:complete && Number(final.schemaValid)>=118 && rulePass>=114 && critical===0 && typeof final.observedP95Ms==='number' && final.observedP95Ms<=30_000,
        humanReviewPending:!complete,decisionComplete:complete });
    } else {
      let tp=0; let fp=0; let fn=0; let correct=0; let quantityTotal=0; let critical=0; let exact=0;
      for (const job of planned) {
        const receipt=observed.find(row=>row.job.key===job.key);
        const fixture=packet.speech.find(row=>row.id===job.fixture)!;
        // The original redacted text is authoritative. JSON serialization of a
        // parsed nonfinite number would otherwise repair Infinity to null.
        let raw: unknown=null;
        try { if (typeof receipt?.text==='string') raw=JSON.parse(receipt.text); } catch { /* Invalid output remains a miss. */ }
        const score=speechScore(raw,fixture,packet);
        tp+=score.tp; fp+=score.fp; fn+=score.fn; correct+=score.quantityCorrect; quantityTotal+=score.quantityTotal; critical+=score.critical.length; exact+=Number(score.taskValid);
      }
      const precision=tp+fp ? tp/(tp+fp) : 0; const recall=tp+fn ? tp/(tp+fn) : 0; const quantityAccuracy=quantityTotal ? correct/quantityTotal : 0;
      const complete=observed.length===planned.length;
      targets.push({ target,task,evaluationStatus:observed.length ? 'observed' : 'not_run',...base,tp,fp,fn,precision,recall,quantityCorrect:correct,quantityTotal,quantityAccuracy,exactClips:exact,critical,
        gatesPass:complete && precision>=0.95 && recall>=0.95 && quantityAccuracy>=0.95 && critical===0 && typeof base.observedP95Ms==='number' && base.observedP95Ms<=8_000,
        decisionComplete:complete });
    }
  }
  const runnerVersions=[...new Set(results.map(result=>String(result.runnerHash)))];
  return { issue:731,packetHash:packet.hash,observedAttempts:results.length,plannedAttempts:allJobs.length,targets,runnerVersions,
    mixedRunnerVersions:runnerVersions.length>1,decisionComplete:targets.every(target=>target.decisionComplete===true) && runnerVersions.length<=1,winner:null,
    costProjection:'Pending complete measured receipts, account-rate/rounding qualification and joint $25 envelope analysis; no winner is inferred automatically.' };
}
