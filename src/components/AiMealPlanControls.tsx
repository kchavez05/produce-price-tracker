'use client';
import React from 'react';
import { LogIn, RefreshCw, Sparkles } from 'lucide-react';
interface Props {
  canUseAi:boolean; loading:boolean; prompt:string; banner:string|null;
  onPromptChange:(value:string)=>void; onGenerate:()=>void; onSignIn:()=>void; onUseStandard:()=>void;
}
export default function AiMealPlanControls({canUseAi,loading,prompt,banner,onPromptChange,onGenerate,onSignIn,onUseStandard}:Props) {
  return <div className="mt-4 border-t border-white/15 pt-4" aria-busy={loading}>
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <input type="text" value={prompt} onChange={event=>onPromptChange(event.target.value)} maxLength={1000}
        aria-label="Optional AI meal-plan request" placeholder="Optional AI request: extra-spicy stews, a high-protein sheet-pan roast…"
        className="flex-1 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2 text-xs text-white placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none" />
      <button type="button" onClick={canUseAi?onGenerate:onSignIn} disabled={loading}
        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50">
        {loading?<><RefreshCw aria-hidden="true" className="h-4 w-4 animate-spin"/><span>Generating meal plan...</span></>:
          canUseAi?<><Sparkles aria-hidden="true" className="h-4 w-4"/><span>Remix 3-dish plan with AI</span></>:
            <><LogIn aria-hidden="true" className="h-4 w-4"/><span>Sign in to access AI</span></>}
      </button>
    </div>
    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
      <button type="button" onClick={onUseStandard} className="font-semibold text-emerald-200 underline">
        {loading?'Cancel and use standard suggestions':'Use standard suggestions'}
      </button>
      <span className="text-slate-300">Manual pantry entry and standard suggestions are always available.</span>
    </div>
    {banner?<p role="status" aria-live="polite" className="mt-2 rounded-lg bg-white/10 px-3 py-1.5 text-xs text-amber-200">{banner}</p>:null}
  </div>;
}
