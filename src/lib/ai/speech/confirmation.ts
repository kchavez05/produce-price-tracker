import { pantryIdentity, validatePantryEntry } from '@/lib/pantry/model';
import type { PantryEntry, PantryEntryInput, PantrySaveIntent } from '@/types/pantry';
export interface SpeechAddition { input:PantryEntryInput;entryId:string;intent:PantrySaveIntent }
/** Called only after editable review. Freeze IDs/revisions once for safe partial-failure retries. */
export function prepareSpeechConfirmation(entries:readonly PantryEntry[],inputs:readonly PantryEntryInput[],makeId=()=>crypto.randomUUID()):SpeechAddition[] {
  const identities=new Set<string>();
  return inputs.map(input=>{
    const valid=validatePantryEntry(input);if(!valid.ok)throw new Error(Object.values(valid.errors).join(' '));
    const identity=pantryIdentity(valid.value);if(identities.has(identity))throw new Error('Review duplicate ingredients before confirming.');identities.add(identity);
    const existing=entries.find(entry=>pantryIdentity(entry)===identity);
    return {input:{...valid.value,available:true,...(existing?.location?{location:existing.location}:{}),...(existing?.useByDate?{useByDate:existing.useByDate}:{})},
      entryId:existing?.id??makeId(),intent:{mutationId:makeId(),expectedRevision:existing?.revision??0}};
  });
}
export function createSpeechConfirmationRunner() {
  const completed=new Set<string>();let running=false;
  return {async run(additions:readonly SpeechAddition[],isCurrent:()=>boolean,save:(addition:SpeechAddition)=>Promise<void>) {
    if(running)return false;running=true;
    try {for(const addition of additions){if(!isCurrent())throw new Error('Pantry account changed. Reopen speech review.');
      if(completed.has(addition.intent.mutationId))continue;await save(addition);completed.add(addition.intent.mutationId);}
      return isCurrent();
    } finally {running=false;}
  }};
}
