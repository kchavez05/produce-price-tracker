import { readProfilePantryAvailability } from '@/lib/pantry/server';
import { checkRateLimit, verifySameOrigin } from '@/lib/security/rate-limit';
import { loadInventoryState } from '@/lib/supabase/session';
import { NextRequest, NextResponse } from 'next/server';
import { createRecipeProvider } from '@/lib/ai/providers';
import { generateMealPlan } from '@/lib/ai/meal-plan';
import { AiGenerationError } from '@/lib/ai/errors';
import { AiAccessError } from '@/lib/ai/access-errors';
import { requireAiAccount } from '@/lib/ai/auth';
import { parseMealPlanRequest } from '@/lib/ai/request';
import { completeAiUsage, reserveAiUsage } from '@/lib/ai/usage';
import { buildDashboardPayload } from '@/lib/scoring-and-matcher';

export async function POST(request: NextRequest) {
  if (!verifySameOrigin(request)) return NextResponse.json({error:'Forbidden cross-origin request'},{status:403});
  // Best-effort ingress protection only. Durable account/cost limits do not trust IP headers.
  const rate=checkRateLimit(request,'api-ai-meal-plan',10,60_000);
  if(!rate.allowed)return NextResponse.json({error:'Too many meal-plan requests'},{status:429,headers:{'Retry-After':String(rate.resetInSeconds)}});
  try {
    const body=await parseMealPlanRequest(request);
    const provider=createRecipeProvider();
    const accountId=provider ? await requireAiAccount() : null;
    const inventory=await loadInventoryState();
    if(accountId && (!inventory.profile?.isCloudBacked || inventory.profile.id!==accountId))throw new AiAccessError('ACCOUNT_CHANGED');
    const onHandIngredientIds=body.onHandIngredientIds ?? await readProfilePantryAvailability(inventory.profile);
    const dashboard=await buildDashboardPayload({savedRecipes:inventory.savedRecipes,zipCode:body.zipCode,storeFilter:body.storeFilter,
      pinnedIngredientIds:body.pinnedIngredientIds,onHandIngredientIds,targetServings:body.targetServings,macroGoal:body.macroGoal,
      dietaryConstraints:body.dietaryConstraints,applianceFilter:body.applianceFilter});
    if(!provider || !accountId)return NextResponse.json({usedAi:false,
      message:'AI generation is not configured. Returned standard meal-prep suggestions tailored to your preferences.',dishes:dashboard.recommendedTrio});
    const reservation=await reserveAiUsage(accountId,body.requestId,'recipe',provider.usageBound);
    try {
      const dishes=await generateMealPlan(provider,{...body,dashboard,onHandIngredientIds},{signal:request.signal});
      return NextResponse.json({usedAi:true,message:'Generated a custom 3-dish meal-prep plan!',dishes,remainingAiActions:reservation.remainingActions,remainingDailyMicroUsd:reservation.remainingDailyMicroUsd});
    } finally { await completeAiUsage(accountId,reservation.reservationId); }
  } catch(error:unknown) {
    if(error instanceof AiAccessError)return NextResponse.json({usedAi:false,code:error.code,error:error.message},
      {status:error.status,...(error.retryAfterSeconds ? {headers:{'Retry-After':String(error.retryAfterSeconds)}} : {})});
    const known=error instanceof AiGenerationError ? error : null;
    return NextResponse.json({usedAi:false,code:known?.code ?? 'SERVICE_UNAVAILABLE',
      error:known?.message ?? 'Unable to generate a meal plan. Please try again or use standard suggestions.'},
      {status:known?.code==='TIMEOUT' ? 504 : known ? 502 : 500});
  }
}
