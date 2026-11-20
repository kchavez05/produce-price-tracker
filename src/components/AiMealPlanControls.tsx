'use client';
import React from 'react';
import { LogIn, RefreshCw, Sparkles } from 'lucide-react';
import { Banner, Button, Card } from '@/components/ui';
import { controlBox } from '@/components/ui/Field';
import { cx, focusRing } from '@/components/ui/cx';
interface Props {
  canUseAi:boolean; loading:boolean; prompt:string; banner:string|null;
  /** A failure is shown as an alert with Try again; anything else (a plan made, standard suggestions back) as a status. */
  bannerTone?:'info'|'error'; onDismissBanner?:()=>void;
  onPromptChange:(value:string)=>void; onGenerate:()=>void; onSignIn:()=>void; onUseStandard:()=>void;
}
// v2.0 M4-5a and M4-5c (wireframes Plan, Plan AI Chef signed out, Plan AI Chef error): the AI request card and its states. Signed out it
// says what an account gives (no key, private) and offers "Sign in to use"; signed in it asks what you want and offers "Suggest Dishes";
// while a request is out the button says so and standard suggestions can be chosen at once; a failure is an alert that names the
// problem and offers Try Again (when signed in) and Dismiss; a plan made, or standard suggestions restored, is a status. The prompt, the
// actions and the request logic are the old card's; the standard suggestions are always there, so nothing here blocks the Plan.
export default function AiMealPlanControls({canUseAi,loading,prompt,banner,bannerTone='info',onDismissBanner,onPromptChange,onGenerate,onSignIn,onUseStandard}:Props) {
  const failed=Boolean(banner)&&bannerTone==='error';
  return <Card as="section" aria-label="AI meal plan" className="space-y-3" aria-busy={loading}>
    <div>
      <h3 className="text-base font-bold text-ink">Ask AI Chef</h3>
      {!canUseAi?<p className="mt-1 text-sm text-muted">AI suggestions are free with an account. No API key needed. Your pantry and plans stay private.</p>:null}
    </div>
    {failed?<Banner tone="error" title="AI Chef could not make a plan">
      <p>{banner}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {canUseAi?<Button type="button" variant="primary" onClick={onGenerate} disabled={loading}>Try Again</Button>:null}
        {onDismissBanner?<Button type="button" variant="secondary" onClick={onDismissBanner}>Dismiss</Button>:null}
      </div>
    </Banner>:null}
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <input type="text" value={prompt} onChange={event=>onPromptChange(event.target.value)} maxLength={1000}
        aria-label="Optional AI meal-plan request" placeholder="Describe what you want, like “use the chicken thighs”"
        className={cx(controlBox,focusRing,'flex-1')} />
      <Button type="button" variant={canUseAi?'primary':'secondary'} onClick={canUseAi?onGenerate:onSignIn} disabled={loading}>
        {loading?<><RefreshCw aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none"/><span>Generating meal plan...</span></>:
          canUseAi?<><Sparkles aria-hidden="true" className="size-4"/><span>Suggest Dishes</span></>:
            <><LogIn aria-hidden="true" className="size-4"/><span>Sign in to use</span></>}
      </Button>
    </div>
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <Button type="button" variant="quiet" onClick={onUseStandard}>
        {loading?'Cancel and use standard suggestions':'Use standard suggestions'}
      </Button>
      <span className="text-muted">Manual pantry entry and standard suggestions are always available.</span>
    </div>
    {banner&&!failed?<div role="status" aria-live="polite" className="flex items-start justify-between gap-2 rounded-control bg-chip px-3 py-2 text-sm text-ink">
      <p className="min-w-0">{banner}</p>
      {onDismissBanner?<Button type="button" variant="quiet" className="-my-2 shrink-0" onClick={onDismissBanner}>Dismiss</Button>:null}
    </div>:null}
  </Card>;
}
