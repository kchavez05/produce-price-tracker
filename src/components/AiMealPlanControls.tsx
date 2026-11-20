'use client';
import React from 'react';
import { LogIn, RefreshCw, Sparkles } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { controlBox } from '@/components/ui/Field';
import { cx, focusRing } from '@/components/ui/cx';
interface Props {
  canUseAi:boolean; loading:boolean; prompt:string; banner:string|null;
  onPromptChange:(value:string)=>void; onGenerate:()=>void; onSignIn:()=>void; onUseStandard:()=>void;
}
// v2.0 M4-5a: the AI request on the design tokens (the signed-out, error and results states are M4-5c). The prompt, the actions and
// every string are unchanged.
export default function AiMealPlanControls({canUseAi,loading,prompt,banner,onPromptChange,onGenerate,onSignIn,onUseStandard}:Props) {
  return <Card as="section" aria-label="AI meal plan" className="space-y-3" aria-busy={loading}>
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <input type="text" value={prompt} onChange={event=>onPromptChange(event.target.value)} maxLength={1000}
        aria-label="Optional AI meal-plan request" placeholder="Optional AI request: extra-spicy stews, a high-protein sheet-pan roast…"
        className={cx(controlBox,focusRing,'flex-1')} />
      <Button type="button" variant="primary" onClick={canUseAi?onGenerate:onSignIn} disabled={loading}>
        {loading?<><RefreshCw aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none"/><span>Generating meal plan...</span></>:
          canUseAi?<><Sparkles aria-hidden="true" className="size-4"/><span>Remix 3-dish plan with AI</span></>:
            <><LogIn aria-hidden="true" className="size-4"/><span>Sign in to access AI</span></>}
      </Button>
    </div>
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <Button type="button" variant="quiet" onClick={onUseStandard}>
        {loading?'Cancel and use standard suggestions':'Use standard suggestions'}
      </Button>
      <span className="text-muted">Manual pantry entry and standard suggestions are always available.</span>
    </div>
    {banner?<p role="status" aria-live="polite" className="rounded-control bg-warning-bg px-3 py-2 text-sm text-warning">{banner}</p>:null}
  </Card>;
}
