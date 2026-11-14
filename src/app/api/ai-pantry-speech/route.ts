import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { verifySameOrigin, checkRateLimit } from '@/lib/security/rate-limit';
import { requireAiAccount } from '@/lib/ai/auth';
import { AiAccessError } from '@/lib/ai/access-errors';
import { AiGenerationError } from '@/lib/ai/errors';
import { completeAiUsage, reserveAiUsage } from '@/lib/ai/usage';
import { readSpeechAudio } from '@/lib/ai/speech/audio';
import { createSpeechPipeline } from '@/lib/ai/speech/providers';
import { generateSpeechDraft } from '@/lib/ai/speech/service';
export async function POST(request:NextRequest) {
  if(!verifySameOrigin(request))return NextResponse.json({error:'Forbidden cross-origin request'},{status:403});
  const ingress=checkRateLimit(request,'api-ai-pantry-speech',10,60000);
  if(!ingress.allowed)return NextResponse.json({error:'Too many speech requests'},{status:429,headers:{'Retry-After':String(ingress.resetInSeconds)}});
  try {
    const account=await requireAiAccount();
    const requestId=request.headers.get('x-ai-request-id')??randomUUID();
    if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestId))throw new AiAccessError('INVALID_REQUEST');
    const audio=await readSpeechAudio(request);
    const pipeline=createSpeechPipeline(); if(!pipeline)throw new AiAccessError('AI_NOT_CONFIGURED');
    const reserved=await reserveAiUsage(account,requestId,'speech',pipeline.usageBound);
    try {const draft=await generateSpeechDraft(pipeline,audio,request.signal);return NextResponse.json({...draft,remainingAiActions:reserved.remainingActions,remainingDailyMicroUsd:reserved.remainingDailyMicroUsd},{headers:{'Cache-Control':'no-store'}});}
    finally {await completeAiUsage(account,reserved.reservationId);}
  } catch(error:unknown) {
    if(error instanceof AiAccessError)return NextResponse.json({code:error.code,error:error.message},{status:error.status,headers:{'Cache-Control':'no-store',...(error.retryAfterSeconds?{'Retry-After':String(error.retryAfterSeconds)}:{})}});
    const known=error instanceof AiGenerationError?error:null;
    return NextResponse.json({code:known?.code??'SERVICE_UNAVAILABLE',error:known?.message??'Speech assistance could not complete. Enter ingredients manually or try again.'},{status:known?.code==='TIMEOUT'?504:known?502:500,headers:{'Cache-Control':'no-store'}});
  }
}
