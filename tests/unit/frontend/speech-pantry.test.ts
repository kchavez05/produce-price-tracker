// @vitest-environment jsdom
import { act, createElement, type ComponentProps } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
const capture=vi.hoisted(()=>({start:vi.fn(),supported:vi.fn()}));
vi.mock('@/lib/ai/speech/capture',()=>({startSpeechRecording:capture.start,speechCaptureSupported:capture.supported}));
import SpeechPantryEntry from '@/components/SpeechPantryEntry';
import { expectNoA11yViolations } from 'tests/helpers/render';
import { prepareSpeechConfirmation, createSpeechConfirmationRunner } from '@/lib/ai/speech/confirmation';
import type { SpeechProposal } from '@/lib/ai/speech/types';
import type { PantryEntry } from '@/types/pantry';
let root:Root,container:HTMLDivElement;
const owner='account:00000000-0000-4000-8000-000000000001' as const;
const save=vi.fn(),close=vi.fn(),stop=vi.fn(),cancel=vi.fn(),fetchMock=vi.fn();
const existing:PantryEntry={id:'beans-entry',revision:3,updatedAtIso:'2026-11-14T00:00:00Z',ingredientId:'black-beans-canned',displayName:'Black beans, canned',available:false,quantity:4,unit:'cans',location:'PANTRY',useByDate:'2027-01-01'};
const proposal={spokenText:'two cans of black beans',ingredientId:'black-beans-canned',displayName:'Black beans',quantity:2,unit:'cans'};
async function run(action:()=>unknown){await act(async()=>{await action();});}
async function render(props:Partial<ComponentProps<typeof SpeechPantryEntry>>={}){await run(()=>root.render(createElement(SpeechPantryEntry,{key:props.owner??owner,owner,configured:true,entries:[],acceptedCatalogIds:['black-beans-canned','salt'],onSave:save,onClose:close,...props})));}
function button(name:string){const found=[...container.querySelectorAll('button')].find(node=>node.textContent===name);if(!found)throw new Error(`Missing ${name}`);return found;}
async function review(proposals:SpeechProposal[]=[proposal],props:Partial<ComponentProps<typeof SpeechPantryEntry>>={}){
  fetchMock.mockResolvedValue(new Response(JSON.stringify({transcript:'Two cans of beans; no rice.',status:'PROPOSALS',proposals})));
  await render(props);await run(()=>button('Record ingredients').click());await run(()=>button('Stop recording').click());await run(()=>button('Send recording for review').click());
}
beforeEach(()=>{vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);vi.stubGlobal('crypto',webcrypto);vi.stubGlobal('fetch',fetchMock);vi.clearAllMocks();capture.supported.mockReturnValue(true);capture.start.mockResolvedValue({stop,cancel});stop.mockResolvedValue(new Uint8Array(32044));save.mockResolvedValue(undefined);container=document.createElement('div');document.body.append(container);root=createRoot(container);});
afterEach(async()=>{await run(()=>root.unmount());container.remove();vi.unstubAllGlobals();});
describe('speech capture and reviewed pantry changes',()=>{
  it('keeps manual entry available when unsupported, unconfigured or denied',async()=>{
    await render({configured:false});expect(button('Record ingredients').disabled).toBe(true);expect(container.textContent).toContain('Enter ingredients manually');
    capture.supported.mockReturnValue(false);await render({owner:'account:other'});expect(button('Record ingredients').disabled).toBe(true);
    capture.supported.mockReturnValue(true);capture.start.mockRejectedValue(new Error('denied'));await render({owner:'account:third'});await run(()=>button('Record ingredients').click());expect(container.querySelector('[role=alert]')?.textContent).toContain('denied');expect(save).not.toHaveBeenCalled();
  });
  it('requires explicit send and confirmation; preserves existing quantities by default',async()=>{
    fetchMock.mockResolvedValue(new Response(JSON.stringify({transcript:'beans',status:'PROPOSALS',proposals:[proposal]})));
    await render({entries:[existing]});await run(()=>button('Record ingredients').click());expect(fetchMock).not.toHaveBeenCalled();await run(()=>button('Stop recording').click());expect(fetchMock).not.toHaveBeenCalled();await run(()=>button('Send recording for review').click());
    expect(save).not.toHaveBeenCalled();expect((container.querySelector('[aria-label="Ingredient 1 quantity"]') as HTMLInputElement).value).toBe('4');
    expect(container.textContent).toContain('Spoken amount: 2 cans');await run(()=>button('Confirm pantry changes').click());
    expect(save).toHaveBeenCalledOnce();expect(save).toHaveBeenCalledWith(expect.objectContaining({available:true,quantity:4,unit:'cans',location:'PANTRY',useByDate:'2027-01-01'}),'beans-entry',expect.objectContaining({expectedRevision:3}));
    expect(container.textContent).toContain('Check pantry sync status');
  });
  it('lets the reviewer remove a negated or unwanted proposal before saving',async()=>{
    await review([proposal,{spokenText:'salt',ingredientId:'salt',displayName:'Salt',quantity:null,unit:null}]);await run(()=>button('Remove ingredient 2').click());await run(()=>button('Confirm pantry changes').click());expect(save).toHaveBeenCalledOnce();expect(save.mock.calls[0][0].ingredientId).toBe('black-beans-canned');
  });
  it('freezes partial-failure operations and retries only the unqueued row',async()=>{
    save.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('queue failed')).mockResolvedValue(undefined);
    await review([proposal,{spokenText:'salt',ingredientId:'salt',displayName:'Salt',quantity:null,unit:null}]);await run(()=>button('Confirm pantry changes').click());expect(save).toHaveBeenCalledTimes(2);const failed=save.mock.calls[1];expect(container.querySelector('fieldset')?.disabled).toBe(true);
    await run(()=>button('Retry same confirmation').click());expect(save).toHaveBeenCalledTimes(3);expect(save.mock.calls[2]).toEqual(failed);
  });
  it('rejects changed pantry revisions until explicit refreshed review',async()=>{
    await review([proposal],{entries:[existing]});await render({entries:[{...existing,revision:4,quantity:8}]});await run(()=>button('Confirm pantry changes').click());expect(save).not.toHaveBeenCalled();expect(container.textContent).toContain('Pantry changed');await run(()=>button('Refresh review from current pantry').click());expect((container.querySelector('[aria-label="Ingredient 1 quantity"]') as HTMLInputElement).value).toBe('8');await run(()=>button('Confirm pantry changes').click());expect(save.mock.calls[0][2].expectedRevision).toBe(4);
  });
  it('discards stale provider responses and cancels microphone on account change',async()=>{
    let resolve!:(response:Response)=>void;fetchMock.mockImplementation(()=>new Promise<Response>(done=>{resolve=done;}));await render();await run(()=>button('Record ingredients').click());await run(()=>button('Stop recording').click());await run(()=>button('Send recording for review').click());await render({owner:'account:00000000-0000-4000-8000-000000000002'});await run(()=>resolve(new Response(JSON.stringify({transcript:'PRIVATE',status:'PROPOSALS',proposals:[proposal]}))));expect(container.textContent).not.toContain('PRIVATE');expect(save).not.toHaveBeenCalled();
    await run(()=>button('Record ingredients').click());await run(()=>root.unmount());expect(cancel).toHaveBeenCalled();root=createRoot(container);
  });
  it('stops a late microphone grant after cancellation and never sends it',async()=>{
    let resolve!:(recording:{stop:typeof stop;cancel:typeof cancel})=>void;capture.start.mockImplementation(()=>new Promise(done=>{resolve=done;}));await render();await run(()=>button('Record ingredients').click());await run(()=>button('Cancel speech').click());await run(()=>resolve({stop,cancel}));expect(cancel).toHaveBeenCalled();expect(fetchMock).not.toHaveBeenCalled();
  });
  it('does not turn no-add or unclear speech into pantry writes',async()=>{
    fetchMock.mockResolvedValue(new Response(JSON.stringify({transcript:'Do not add anything',status:'NO_ADD',proposals:[]})));await render();await run(()=>button('Record ingredients').click());await run(()=>button('Stop recording').click());await run(()=>button('Send recording for review').click());expect(container.textContent).toContain('Nothing was changed');expect(container.querySelector('fieldset')).toBeNull();expect(save).not.toHaveBeenCalled();
  });
});
describe('confirmation ownership and identity',()=>{
  it('captures exact identity/revision and rejects duplicates',()=>{const inputs=[{displayName:existing.displayName,ingredientId:existing.ingredientId,quantity:2,unit:'cans',available:true}];const [addition]=prepareSpeechConfirmation([existing],inputs);expect(addition).toMatchObject({entryId:'beans-entry',intent:{expectedRevision:3},input:{quantity:2,location:'PANTRY'}});expect(()=>prepareSpeechConfirmation([],inputs.concat(inputs))).toThrow('duplicate');});
  it('stops the next write immediately after owner invalidation and does not repeat completed mutations',async()=>{const additions=prepareSpeechConfirmation([],[{displayName:'Salt',ingredientId:'salt',available:true},{displayName:'custom',available:true}]);const runner=createSpeechConfirmationRunner();let current=true;const write=vi.fn().mockImplementation(async()=>{current=false;});await expect(runner.run(additions,()=>current,write)).rejects.toThrow('account changed');expect(write).toHaveBeenCalledOnce();current=true;write.mockResolvedValue(undefined);expect(await runner.run(additions,()=>current,write)).toBe(true);expect(write).toHaveBeenCalledTimes(2);expect(write.mock.calls[1][0].intent.mutationId).toBe(additions[1].intent.mutationId);});
});

// v2.0 M4-4c: the speech entry on the design tokens and primitives (wireframe Pantry Voice).
describe('markup on the design tokens',()=>{
  it('has no accessibility violations before recording, at the review and on an error',async()=>{
    await render();await expectNoA11yViolations(container);
    capture.start.mockRejectedValue(new Error('denied'));await run(()=>button('Record ingredients').click());expect(container.querySelector('[role=alert]')).not.toBeNull();await expectNoA11yViolations(container);
    capture.start.mockResolvedValue({stop,cancel});await review();expect(container.textContent).toContain('Review what was heard');await expectNoA11yViolations(container);
  });
  it('makes the one next step primary in each phase, with a labelled row for each proposal',async()=>{
    await render();const primary=()=>[...container.querySelectorAll('button')].filter(node=>node.className.includes('bg-accent')).map(node=>node.textContent);
    expect(primary()).toEqual(['Record ingredients']);
    await run(()=>button('Record ingredients').click());expect(primary()).toEqual(['Stop recording']);
    await run(()=>button('Stop recording').click());expect(primary()).toEqual(['Send recording for review']);
    await review([proposal],{owner:'account:fresh'});expect(primary()).toEqual(['Confirm pantry changes']);
    const row=container.querySelector('fieldset')!;expect(row.querySelector('legend')!.textContent).toContain('two cans of black beans');
    expect(row.querySelector('[aria-label="Ingredient 1 catalog match"]')).not.toBeNull();expect(row.querySelector('[aria-label="Ingredient 1 quantity"]')).not.toBeNull();
  });
  it('shows the provider disclosure and the not-ready state as readable text',async()=>{
    await render({configured:false});expect(container.textContent).toContain('shares this recording and its transcript with OpenAI');
    expect(container.querySelector('[role=status]')!.textContent).toContain('Speech assistance is not ready yet.');
  });
});
