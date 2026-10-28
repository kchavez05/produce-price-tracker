import { NextRequest, NextResponse } from 'next/server';
import { marketClient } from '@/lib/market/client';
import { currentAdCycle } from '@/lib/offer-freshness';
import { checkRateLimit } from '@/lib/security/rate-limit';
export const dynamic='force-dynamic';
/** Sanitized operational status: no report bodies, credentials, accounts or inventory. */
export async function GET(request: NextRequest) {
  if (!checkRateLimit(request,'market-health',10,60000).allowed) return NextResponse.json({ status:'rate_limited' },{status:429});
  const client=marketClient();
  if (!client) return NextResponse.json({ status:'unavailable' },{status:503});
  try {
    const {data,error}=await client.from('market_ingestion_runs').select('status,completed_at')
      .eq('cycle',currentAdCycle().start).in('trigger',['scheduled','recovery']).order('started_at',{ascending:false}).limit(1).maybeSingle().retry(false);
    const healthy=!error&&data&&['succeeded','unchanged'].includes(data.status);
    return NextResponse.json({status:healthy?'healthy':'attention_required',completedAt:healthy?data.completed_at:null},
      {status:healthy?200:503,headers:{'Cache-Control':'no-store'}});
  } catch { return NextResponse.json({status:'unavailable'},{status:503}); }
}
