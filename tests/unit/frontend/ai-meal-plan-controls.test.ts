// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement, type ComponentProps } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { webcrypto } from 'node:crypto';
import AiMealPlanControls from '@/components/AiMealPlanControls';
import AccountModal from '@/components/AccountModal';
import { aiRetryHint, createAiRequestFence } from '@/lib/ai/client-request';
let root:Root,container:HTMLDivElement;
const generate=vi.fn(),signIn=vi.fn(),standard=vi.fn(),prompt=vi.fn();
async function run(action:()=>unknown){await act(async()=>{await action();});}
async function render(overrides:Partial<ComponentProps<typeof AiMealPlanControls>>={}){
  await run(()=>root.render(createElement(AiMealPlanControls,{canUseAi:false,loading:false,prompt:'',banner:null,
    onGenerate:generate,onSignIn:signIn,onUseStandard:standard,onPromptChange:prompt,...overrides})));
}
function button(label:string){const node=[...container.querySelectorAll('button')].find(b=>b.textContent===label);if(!node)throw new Error('Missing button');return node;}
beforeEach(()=>{vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);vi.stubGlobal('crypto',webcrypto);vi.clearAllMocks();container=document.createElement('div');document.body.append(container);root=createRoot(container);});
afterEach(async()=>{await run(()=>root.unmount());container.remove();vi.unstubAllGlobals();});
describe('v1.7 AI controls',()=>{
  it('offers real sign-in instead of personal keys or paid generation to guests',async()=>{
    await render();await run(()=>button('Sign in to access AI').click());
    expect(signIn).toHaveBeenCalledOnce();expect(generate).not.toHaveBeenCalled();
    expect(container.querySelector('input[type=password]')).toBeNull();
    expect(container.textContent).not.toContain('Gemini');
    expect(container.textContent).toContain('Manual pantry entry');
  });
  it('keeps standard suggestions accessible during a verified request',async()=>{
    await render({canUseAi:true});await run(()=>button('Remix 3-dish plan with AI').click());expect(generate).toHaveBeenCalledOnce();
    await render({canUseAi:true,loading:true,banner:'AI allowance reached.'});
    expect(button('Generating meal plan...').disabled).toBe(true);
    await run(()=>button('Cancel and use standard suggestions').click());expect(standard).toHaveBeenCalledOnce();
    expect(container.querySelector('[role=status]')?.textContent).toBe('AI allowance reached.');
    expect(container.querySelector('input')?.maxLength).toBe(1000);
  });
  it('does not leave a local demo profile in a dead-end sign-in modal',async()=>{
    await run(()=>root.render(createElement(AccountModal,{isOpen:true,intent:'ai',authenticated:true,
      profile:{id:'local-demo',email:'demo@example.test',displayName:'Demo',provider:'google',isCloudBacked:false,createdAtIso:'',updatedAtIso:''},
      storageMode:'SQLITE_LOCAL_FALLBACK',supabaseConfigured:true,syncStatus:'IDLE',lastSyncedIso:null,authLoading:false,
      currentZip:'80542',activeStores:[],macroGoal:'ANY',dietaryConstraints:[],applianceFilter:'ANY',pantryItemCount:0,
      onClose:vi.fn(),onSignIn:async()=>{signIn();},onSignOut:async()=>{},onForceSync:async()=>{},onExportData:async()=>false,onDeleteAccount:async()=>false})));
    await run(()=>button('Continue with Google').click());expect(signIn).toHaveBeenCalledOnce();
    expect(container.textContent).toContain('Sign in to access AI features');
  });
  it('does not present local/demo OAuth as verified AI access when cloud auth is missing',async()=>{
    await run(()=>root.render(createElement(AccountModal,{isOpen:true,intent:'ai',authenticated:false,profile:null,
      storageMode:'SQLITE_LOCAL_FALLBACK',supabaseConfigured:false,syncStatus:'IDLE',lastSyncedIso:null,authLoading:false,
      currentZip:'80542',activeStores:[],macroGoal:'ANY',dietaryConstraints:[],applianceFilter:'ANY',pantryItemCount:0,
      onClose:vi.fn(),onSignIn:async()=>{signIn();},onSignOut:async()=>{},onForceSync:async()=>{},onExportData:async()=>false,onDeleteAccount:async()=>false})));
    expect(button('Continue with Google').disabled).toBe(true);expect(button('Sign in with Apple').disabled).toBe(true);
    expect(container.textContent).toContain('Sign-in for AI is unavailable right now');
  });
});
describe('AI response ownership and request fencing',()=>{
  it('invalidates responses on context changes, cancellation and account ABA changes',()=>{
    const fence=createAiRequestFence();const old=fence.begin('account:alice','one');
    expect(fence.isCurrent(old,'account:alice','two')).toBe(false);
    expect(fence.isCurrent(old,'account:bob','one')).toBe(false);
    fence.cancel();const latest=fence.begin('account:alice','one');
    expect(old.controller.signal.aborted).toBe(true);
    expect(fence.isCurrent(old,'account:alice','one')).toBe(false);
    expect(fence.isCurrent(latest,'account:alice','one')).toBe(true);
    fence.complete(old);expect(fence.isCurrent(latest,'account:alice','one')).toBe(true);
    fence.complete(latest);expect(fence.isCurrent(latest,'account:alice','one')).toBe(false);
  });
  it('replaces an older request and never reuses its idempotency key',()=>{
    const fence=createAiRequestFence();const first=fence.begin('account:alice','one'),second=fence.begin('account:alice','one');
    expect(first.id).not.toBe(second.id);expect(first.controller.signal.aborted).toBe(true);
    expect(fence.isCurrent(first,'account:alice','one')).toBe(false);expect(fence.isCurrent(second,'account:alice','one')).toBe(true);
  });
  it('expresses quota reset delays in readable units without echoing invalid headers',()=>{
    expect(aiRetryHint('60')).toContain('1 minute.');
    expect(aiRetryHint('86400')).toContain('1 day.');
    expect(aiRetryHint('1209600')).toContain('14 days.');
    expect(aiRetryHint('SECRET')).toBe('');
  });

});
