'use client';
import React, { useEffect, useRef, useState } from 'react';
import { activeCookingIngredients, pantryCatalog, pantryIdentity, validatePantryEntry } from '@/lib/pantry/model';
import { aiRetryHint, createAiRequestFence } from '@/lib/ai/client-request';
import { speechCaptureSupported, startSpeechRecording, type SpeechRecording } from '@/lib/ai/speech/capture';
import { createSpeechConfirmationRunner, prepareSpeechConfirmation, type SpeechAddition } from '@/lib/ai/speech/confirmation';
import { parseSpeechExtraction } from '@/lib/ai/speech/service';
import type { SpeechDraft } from '@/lib/ai/speech/types';
import type { PantryEntry, PantryEntryInput, PantryOwner, PantrySaveIntent } from '@/types/pantry';
interface Props {
  owner:PantryOwner; configured:boolean; entries:readonly PantryEntry[]; acceptedCatalogIds:readonly string[];
  onSave:(input:PantryEntryInput,id?:string,intent?:PantrySaveIntent)=>Promise<void>; onClose:()=>void;
}
interface Row { key:string;spokenText:string;ingredientId:string;displayName:string;quantity:string;unit:string;spokenQuantity:string }
const button='rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-emerald-50 disabled:opacity-50';
const field='mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2';
export default function SpeechPantryEntry({owner,configured,entries,acceptedCatalogIds,onSave,onClose}:Props) {
  const [phase,setPhase]=useState<'ready'|'permission'|'recording'|'recorded'|'sending'|'review'|'confirmed'>('ready');
  const [supported,setSupported]=useState(false),[error,setError]=useState<string|null>(null);
  const [draft,setDraft]=useState<SpeechDraft|null>(null),[rows,setRows]=useState<Row[]>([]);
  const [locked,setLocked]=useState(false),[busy,setBusy]=useState(false);
  const active=useRef(true),mounted=useRef(true),ownerRef=useRef(owner),recording=useRef<SpeechRecording|null>(null),audio=useRef<Uint8Array|null>(null);
  const requests=useRef(createAiRequestFence()),capture=useRef<AbortController|null>(null),heading=useRef<HTMLHeadingElement>(null);
  const reviewedEntries=useRef<readonly PantryEntry[]>([]),operations=useRef<SpeechAddition[]|null>(null),runner=useRef(createSpeechConfirmationRunner()),saving=useRef(false);
  ownerRef.current=owner;
  useEffect(()=>{mounted.current=true;setSupported(speechCaptureSupported());heading.current?.focus();
    const fence=requests.current;
    return()=>{mounted.current=false;capture.current?.abort();recording.current?.cancel();audio.current=null;fence.cancel();};
  },[]);
  // The parent keys the panel by owner; this render-time check also fences callbacks before cleanup.
  const initialOwner=useRef(owner);
  const current=()=>active.current && mounted.current && ownerRef.current===initialOwner.current;
  function cancel(){capture.current?.abort();recording.current?.cancel();recording.current=null;audio.current=null;requests.current.cancel();}
  function close(){active.current=false;cancel();onClose();}
  async function stop() {
    const session=recording.current;if(!session)return;recording.current=null;
    try {const bytes=await session.stop();if(!current())return;audio.current=bytes;setPhase('recorded');}
    catch {if(current()){setError('Recording could not finish. Record at least a quarter second or enter ingredients manually.');setPhase('ready');}}
  }
  async function record() {
    if(!configured||!supported||!owner.startsWith('account:'))return;
    cancel();const controller=new AbortController();capture.current=controller;setError(null);setPhase('permission');
    try {const session=await startSpeechRecording(controller.signal,()=>void stop());
      if(!current()||controller.signal.aborted){session.cancel();return;}recording.current=session;setPhase('recording');
    }catch {if(current()&&!controller.signal.aborted){setError('Microphone access was denied or recording is unavailable. Check browser permissions or enter ingredients manually.');setPhase('ready');}}
  }
  function beginReview(next:SpeechDraft) {
    reviewedEntries.current=entries.map(entry=>({...entry}));operations.current=null;runner.current=createSpeechConfirmationRunner();setLocked(false);
    setRows(next.proposals.map(proposal=>{
      const identity=pantryIdentity({displayName:proposal.displayName,available:true,...(proposal.ingredientId?{ingredientId:proposal.ingredientId}:{})});
      const existing=entries.find(entry=>pantryIdentity(entry)===identity);
      return {key:crypto.randomUUID(),spokenText:proposal.spokenText,ingredientId:proposal.ingredientId??'',displayName:proposal.displayName,
        quantity:String(existing?existing.quantity??'':proposal.quantity??''),unit:existing?existing.unit??'':proposal.unit??'',
        spokenQuantity:[proposal.quantity,proposal.unit].filter(value=>value!==null).join(' ')};
    }));setDraft(next);setPhase('review');setError(null);
  }
  async function send() {
    const bytes=audio.current;if(!bytes||!current())return;audio.current=null;
    const ticket=requests.current.begin(owner,'speech');setPhase('sending');setError(null);
    try {const response=await fetch('/api/ai-pantry-speech',{method:'POST',headers:{'Content-Type':'audio/wav','X-AI-Request-ID':ticket.id},body:new Blob([Uint8Array.from(bytes)],{type:'audio/wav'}),signal:ticket.controller.signal});
      const raw=await response.text();if(!requests.current.isCurrent(ticket,ownerRef.current,'speech')||!current())return;
      if(raw.length>40000)throw new Error('Invalid response');const result=JSON.parse(raw);
      if(!response.ok){audio.current=bytes;setError((typeof result.error==='string'?result.error:'Speech assistance is unavailable. Enter ingredients manually.')+aiRetryHint(response.headers.get('Retry-After')));setPhase('recorded');return;}
      if(typeof result.transcript!=='string'||result.transcript.length>8000)throw new Error('Invalid response');
      beginReview(parseSpeechExtraction(JSON.stringify({status:result.status,proposals:result.proposals}),result.transcript));audio.current=null;
    }catch {if(requests.current.isCurrent(ticket,ownerRef.current,'speech')&&current()){audio.current=bytes;setError('Speech assistance could not complete. Retry explicitly or enter ingredients manually.');setPhase('recorded');}}
    finally {requests.current.complete(ticket);}
  }
  function change(key:string,patch:Partial<Row>){if(!locked)setRows(previous=>previous.map(row=>row.key===key?{...row,...patch}:row));}
  function selectIngredient(row:Row,id:string) {
    const ingredient=pantryCatalog.get(id);const existing=entries.find(entry=>entry.ingredientId===id);
    // Selecting an identity is an explicit review action; preserve its current details by default.
    reviewedEntries.current=[...reviewedEntries.current.filter(entry=>entry.ingredientId!==id),...(existing?[{...existing}]:[])];
    change(row.key,{ingredientId:id,displayName:ingredient?.name??row.displayName,quantity:String(existing?.quantity??''),unit:existing?.unit??''});
  }
  async function confirm() {
    if(saving.current||!current()||!rows.length)return;saving.current=true;setBusy(true);setError(null);
    try {
      if(!operations.current){const inputs=rows.map(row=>{
        if(row.ingredientId&&!acceptedCatalogIds.includes(row.ingredientId))throw new Error('Choose an ingredient available to this account or an explicit custom name.');
        const parsed=validatePantryEntry({displayName:row.displayName,available:true,...(row.ingredientId?{ingredientId:row.ingredientId}:{}),
          ...(row.quantity.trim()?{quantity:Number(row.quantity)}:{}),...(row.unit.trim()?{unit:row.unit}:{})});
        if(!parsed.ok)throw new Error(Object.values(parsed.errors).join(' '));return parsed.value;
      });
      const prepared=prepareSpeechConfirmation(reviewedEntries.current,inputs);
      if(prepared.some(addition=>{const latest=entries.find(entry=>entry.id===addition.entryId);return latest && latest.revision!==addition.intent.expectedRevision;}))throw new Error('Pantry changed during review. Refresh the review before confirming.');
      operations.current=prepared;setLocked(true);}
      const complete=await runner.current.run(operations.current,current,addition=>onSave(addition.input,addition.entryId,addition.intent));
      if(complete&&current())setPhase('confirmed');
    }catch(failure){if(current())setError(failure instanceof Error?failure.message:'Could not queue changes. Retry this confirmation or use manual pantry entry.');}
    finally {saving.current=false;if(current())setBusy(false);}
  }
  return <section aria-labelledby="speech-pantry-title" className="mt-3 rounded-xl border border-sky-200 bg-sky-50 p-4" onKeyDown={event=>{if(event.key==='Escape')close();}}>
    <div className="flex items-center justify-between gap-3"><h3 id="speech-pantry-title" ref={heading} tabIndex={-1} className="font-bold">Speak pantry ingredients (experimental)</h3><button type="button" className={button} onClick={close}>{locked?'Close review':'Cancel speech'}</button></div>
    <p className="mt-2 text-sm">Experimental speech entry may not work in every browser. Manual pantry entry is always available.</p>
    <p className="mt-2 text-sm">Record up to 30 seconds, then send it for transcription and ingredient suggestions. Review every form, quantity and unit before confirming. Nothing is added by recording or transcription.</p>
    <p className="mt-1 text-xs text-slate-600">Sending shares this recording and its transcript with OpenAI. PantryBot keeps them only for this review. OpenAI may retain text for abuse monitoring. See the privacy policy for details. Manual pantry entry remains available.</p>
    {!configured?<p role="status" className="mt-3 text-sm">Speech assistance is not ready yet. Enter ingredients manually.</p>:!supported?<p role="status" className="mt-3 text-sm">Microphone recording needs a supported browser and secure connection. Enter ingredients manually.</p>:null}
    {error?<p role="alert" className="mt-2 text-sm text-red-800">{error}</p>:null}
    {phase==='ready'?<button type="button" className={`${button} mt-3`} disabled={!configured||!supported||!owner.startsWith('account:')} onClick={()=>void record()}>Record ingredients</button>:null}
    {phase==='permission'?<p role="status" className="mt-3 text-sm">Waiting for microphone permission. You can cancel without recording.</p>:null}
    {phase==='recording'?<div className="mt-3"><p role="status">Recording… stops at 30 seconds.</p><button type="button" className={`${button} mt-2`} onClick={()=>void stop()}>Stop recording</button></div>:null}
    {phase==='recorded'?<div className="mt-3"><p>Recording stopped. Send only when ready for provider processing.</p><button type="button" className={`${button} mt-2`} onClick={()=>void send()}>Send recording for review</button></div>:null}
    {phase==='sending'?<p role="status" className="mt-3">Preparing suggestions… Cancel to discard this review. An admitted request may still consume allowance.</p>:null}
    {phase==='review'&&draft?<div className="mt-3"><h4 className="font-semibold">Review what was heard</h4><p className="my-2 whitespace-pre-wrap text-sm">{draft.transcript||'No intelligible speech.'}</p>
      {draft.status!=='PROPOSALS'?<p role="status">{draft.status==='NO_ADD'?'No additions requested. Nothing was changed.':'No clear additions found. Enter ingredients manually or record again.'}</p>:<>
        <p className="text-sm">Existing quantities and units are preserved by default. Edit them explicitly to replace them; quantities are never added together. Custom names have no recipe match.</p>
        {rows.map((row,index)=><fieldset key={row.key} disabled={locked} className="mt-3 rounded-lg border border-slate-300 p-3"><legend className="px-1 font-semibold">Ingredient {index+1}: {row.spokenText}</legend>
          <p className="text-xs">Spoken amount: {row.spokenQuantity||'Unspecified'}. Review all details, including corrections and negation.</p>
          <label className="mt-2 block text-sm">Ingredient and form<select aria-label={`Ingredient ${index+1} catalog match`} className={`pantry-select ${field}`} value={row.ingredientId} onChange={event=>selectIngredient(row,event.target.value)}><option value="">Custom name — no recipe match</option>
            {row.ingredientId&&!acceptedCatalogIds.includes(row.ingredientId)?<option value={row.ingredientId}>{row.displayName} (unavailable for this account)</option>:null}
            {activeCookingIngredients.filter(item=>acceptedCatalogIds.includes(item.id)&&item.lifecycle!=='retired').map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
          </select></label>
          <label className="mt-2 block text-sm">Name<input aria-label={`Ingredient ${index+1} name`} className={field} maxLength={120} value={row.displayName} disabled={Boolean(row.ingredientId)||locked} onChange={event=>change(row.key,{displayName:event.target.value})}/></label>
          <div className="mt-2 grid gap-2 sm:grid-cols-2"><label className="text-sm">Quantity<input aria-label={`Ingredient ${index+1} quantity`} type="number" min="0" step="any" className={field} value={row.quantity} onChange={event=>change(row.key,{quantity:event.target.value})}/></label><label className="text-sm">Unit<input aria-label={`Ingredient ${index+1} unit`} className={field} maxLength={40} value={row.unit} onChange={event=>change(row.key,{unit:event.target.value})}/></label></div>
          <button type="button" className={`${button} mt-2`} onClick={()=>setRows(previous=>previous.filter(item=>item.key!==row.key))}>Remove ingredient {index+1}</button>
        </fieldset>)}
        {!locked?<button type="button" className={`${button} mt-3`} onClick={()=>beginReview(draft)}>Refresh review from current pantry</button>:null}
        <button type="button" className={`${button} mt-3 ml-2`} disabled={busy||!rows.length} onClick={()=>void confirm()}>{busy?'Confirming…':locked?'Retry same confirmation':'Confirm pantry changes'}</button>
      </>}
    </div>:null}
    {phase==='confirmed'?<p role="status" className="mt-3 font-semibold">Confirmed changes queued for this account. Check pantry sync status; retries keep the same changes.</p>:null}
  </section>;
}
