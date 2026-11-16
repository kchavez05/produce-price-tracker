import { createClient } from '@supabase/supabase-js';
import { AiAccessError, type AiAccessCode } from './access-errors';

export interface AiUsageBound { adapterKey: string; maximumCostMicroUsd: number }
export interface AiUsageReservation { reservationId: string; remainingActions?: number; remainingDailyMicroUsd: number }
interface UsageRpc { rpc(name: string, params: Record<string,unknown>): PromiseLike<{data:unknown;error:unknown}> }
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function usageClient(): UsageRpc | null {
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(), key=process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !key) return null;
  try { return createClient(url,key,{ auth:{ persistSession:false,autoRefreshToken:false,detectSessionInUrl:false },
    global:{ fetch:(input,init) => fetch(input,{...init,cache:'no-store',signal:AbortSignal.timeout(5000)}) } }); }
  catch {return null;}
}
const denials: Record<string,AiAccessCode> = { DISABLED:'AI_DISABLED',NOT_CONFIGURED:'AI_NOT_CONFIGURED',
  DAILY_QUOTA:'DAILY_QUOTA',MONTHLY_BUDGET:'MONTHLY_BUDGET',CONCURRENT_REQUEST:'CONCURRENT_REQUEST',DUPLICATE_REQUEST:'DUPLICATE_REQUEST' };
/** No provider call is permitted until a durable reservation is positively acknowledged. */
export async function reserveAiUsage(accountId: string, requestId: string, action: 'recipe'|'speech',
  bound: AiUsageBound | undefined, client: UsageRpc | null = usageClient()): Promise<AiUsageReservation> {
  if (!UUID.test(accountId) || !UUID.test(requestId)) throw new AiAccessError('INVALID_REQUEST');
  if (!bound || !bound.adapterKey || bound.adapterKey.length>160 || !Number.isSafeInteger(bound.maximumCostMicroUsd) || bound.maximumCostMicroUsd<=0) throw new AiAccessError('AI_NOT_CONFIGURED');
  if (!client) throw new AiAccessError('USAGE_UNAVAILABLE');
  try {
    const {data,error}=await client.rpc('ai_usage_reserve',{ p_account_id:accountId,p_request_id:requestId,p_action:action,
      p_adapter_key:bound.adapterKey,p_maximum_cost_micro_usd:bound.maximumCostMicroUsd });
    if (error || !data || typeof data!=='object' || Array.isArray(data)) throw new AiAccessError('USAGE_UNAVAILABLE');
    const result=data as Record<string,unknown>;
    if (result.allowed!==true) {
      const code=typeof result.reason==='string' ? denials[result.reason] : undefined;
      const retry=typeof result.retryAfterSeconds==='number' && Number.isSafeInteger(result.retryAfterSeconds) && result.retryAfterSeconds>0 && result.retryAfterSeconds<=2_678_400 ? result.retryAfterSeconds : undefined;
      throw new AiAccessError(code ?? 'USAGE_UNAVAILABLE',retry);
    }
    if (typeof result.reservationId!=='string' || !UUID.test(result.reservationId) ||
      (result.remainingActions!==null && (typeof result.remainingActions!=='number' || !Number.isSafeInteger(result.remainingActions) || result.remainingActions<0)) ||
      typeof result.remainingDailyMicroUsd!=='number' || !Number.isSafeInteger(result.remainingDailyMicroUsd) || result.remainingDailyMicroUsd<0) throw new AiAccessError('USAGE_UNAVAILABLE');
    return {reservationId:result.reservationId,...(typeof result.remainingActions==='number'?{remainingActions:result.remainingActions}:{}),remainingDailyMicroUsd:result.remainingDailyMicroUsd};
  } catch (error: unknown) {
    if (error instanceof AiAccessError) throw error;
    throw new AiAccessError('USAGE_UNAVAILABLE');
  }
}
/** Best-effort lease completion only. Failure never refunds or forgets the durable charge. */
export async function completeAiUsage(accountId: string, reservationId: string, client: UsageRpc | null = usageClient()): Promise<boolean> {
  if (!client || !UUID.test(accountId) || !UUID.test(reservationId)) return false;
  try { const {data,error}=await client.rpc('ai_usage_complete',{p_account_id:accountId,p_reservation_id:reservationId}); return !error && data===true; }
  catch {return false;}
}
