import { NextResponse } from 'next/server';
import { authorizedCron } from '@/lib/security/cron';
import { claimMarkets, finishMarket } from '@/lib/market/active';
import { buildDashboardPayload } from '@/lib/scoring-and-matcher';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;
export async function GET(request: Request) {
  if (!authorizedCron(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const claims = await claimMarkets();
    const results = [];
    for (const claim of claims) {
      let success = false;
      try {
        const payload = await buildDashboardPayload({ zipCode: claim.zip_code, archiveHistory: true });
        success = payload.marketHistory?.archiveStorage === 'cloud' &&
          (payload.freshness?.usableLiveOffers ?? 0) > 0;
      } catch { console.error('active_market_collection_failed'); }
      await finishMarket(claim, success);
      results.push({ zip: claim.zip_code, success });
    }
    return NextResponse.json({ results }, { status: results.some((r) => !r.success) ? 503 : 200 });
  } catch {
    return NextResponse.json({ error: 'Active market collection failed' }, { status: 503 });
  }
}
