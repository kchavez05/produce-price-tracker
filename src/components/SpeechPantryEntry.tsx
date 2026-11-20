'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Banner, Button, Card } from '@/components/ui';
import { controlBox } from '@/components/ui/Field';
import { cx, focusRing } from '@/components/ui/cx';
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
// v2.0 M4-4c (wireframe Pantry Voice): the speech entry on the design tokens and primitives. The recording, the request fence, the
// provider disclosure, the review and the confirmation runner, and every string, are unchanged; only the markup moved.
const field=cx(controlBox,focusRing);
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
  return <Card as="section" aria-labelledby="speech-pantry-title" className="space-y-3" onKeyDown={event=>{if(event.key==='Escape')close();}}>
    <div className="flex items-center justify-between gap-3"><h3 id="speech-pantry-title" ref={heading} tabIndex={-1} className="text-base font-bold text-ink">Speak pantry ingredients (experimental)</h3><Button variant="quiet" onClick={close}>{locked?'Close review':'Cancel speech'}</Button></div>
    <p className="text-sm text-muted">Experimental speech entry may not work in every browser. Manual pantry entry is always available.</p>
    <p className="text-sm text-muted">Record up to 30 seconds, then send it for transcription and ingredient suggestions. Review every form, quantity and unit before confirming. Nothing is added by recording or transcription.</p>
    <p className="text-xs text-muted">Sending shares this recording and its transcript with OpenAI. PantryBot keeps them only for this review. OpenAI may retain text for abuse monitoring. See the privacy policy for details. Manual pantry entry remains available.</p>
    {!configured?<p role="status" className="text-sm text-ink">Speech assistance is not ready yet. Enter ingredients manually.</p>:!supported?<p role="status" className="text-sm text-ink">Microphone recording needs a supported browser and secure connection. Enter ingredients manually.</p>:null}
    {error?<Banner tone="error">{error}</Banner>:null}
    {phase==='ready'?<Button variant="primary" disabled={!configured||!supported||!owner.startsWith('account:')} onClick={()=>void record()}>Record ingredients</Button>:null}
    {phase==='permission'?<p role="status" className="text-sm text-ink">Waiting for microphone permission. You can cancel without recording.</p>:null}
    {phase==='recording'?<div className="space-y-2 text-ink"><p role="status">Recording… stops at 30 seconds.</p><Button variant="primary" onClick={()=>void stop()}>Stop recording</Button></div>:null}
    {phase==='recorded'?<div className="space-y-2 text-ink"><p>Recording stopped. Send only when ready for provider processing.</p><Button variant="primary" onClick={()=>void send()}>Send recording for review</Button></div>:null}
    {phase==='sending'?<p role="status" className="text-ink">Preparing suggestions… Cancel to discard this review. An admitted request may still consume allowance.</p>:null}
    {phase==='review'&&draft?<div className="space-y-3 text-ink"><h4 className="font-semibold">Review what was heard</h4><p className="whitespace-pre-wrap rounded-control bg-chip p-3 text-sm">{draft.transcript||'No intelligible speech.'}</p>
      {draft.status!=='PROPOSALS'?<p role="status">{draft.status==='NO_ADD'?'No additions requested. Nothing was changed.':'No clear additions found. Enter ingredients manually or record again.'}</p>:<>
        <p className="text-sm text-muted">Existing quantities and units are preserved by default. Edit them explicitly to replace them; quantities are never added together. Custom names have no recipe match.</p>
        {rows.map((row,index)=><fieldset key={row.key} disabled={locked} className="space-y-2 rounded-card border border-border-strong p-3"><legend className="px-1 font-semibold">Ingredient {index+1}: {row.spokenText}</legend>
          <p className="text-xs text-muted">Spoken amount: {row.spokenQuantity||'Unspecified'}. Review all details, including corrections and negation.</p>
          <label className="flex flex-col gap-1 text-sm font-semibold">Ingredient and form<select aria-label={`Ingredient ${index+1} catalog match`} className={`pantry-select ${field} font-normal`} value={row.ingredientId} onChange={event=>selectIngredient(row,event.target.value)}><option value="">Custom name — no recipe match</option>
            {row.ingredientId&&!acceptedCatalogIds.includes(row.ingredientId)?<option value={row.ingredientId}>{row.displayName} (unavailable for this account)</option>:null}
            {activeCookingIngredients.filter(item=>acceptedCatalogIds.includes(item.id)&&item.lifecycle!=='retired').map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
          </select></label>
          <label className="flex flex-col gap-1 text-sm font-semibold">Name<input aria-label={`Ingredient ${index+1} name`} className={`${field} font-normal`} maxLength={120} value={row.displayName} disabled={Boolean(row.ingredientId)||locked} onChange={event=>change(row.key,{displayName:event.target.value})}/></label>
          <div className="grid gap-2 sm:grid-cols-2"><label className="flex flex-col gap-1 text-sm font-semibold">Quantity<input aria-label={`Ingredient ${index+1} quantity`} type="number" min="0" step="any" className={`${field} font-normal`} value={row.quantity} onChange={event=>change(row.key,{quantity:event.target.value})}/></label><label className="flex flex-col gap-1 text-sm font-semibold">Unit<input aria-label={`Ingredient ${index+1} unit`} className={`${field} font-normal`} maxLength={40} value={row.unit} onChange={event=>change(row.key,{unit:event.target.value})}/></label></div>
          <Button variant="quiet" onClick={()=>setRows(previous=>previous.filter(item=>item.key!==row.key))}>Remove ingredient {index+1}</Button>
        </fieldset>)}
        <div className="flex flex-wrap gap-2">
          {!locked?<Button variant="secondary" onClick={()=>beginReview(draft)}>Refresh review from current pantry</Button>:null}
          <Button variant="primary" disabled={busy||!rows.length} onClick={()=>void confirm()}>{busy?'Confirming…':locked?'Retry same confirmation':'Confirm pantry changes'}</Button>
        </div>
      </>}
    </div>:null}
    {phase==='confirmed'?<p role="status" className="font-semibold text-ink">Confirmed changes queued for this account. Check pantry sync status; retries keep the same changes.</p>:null}
  </Card>;
}
