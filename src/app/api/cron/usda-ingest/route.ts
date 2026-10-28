import { NextResponse } from 'next/server';
import { authorizedCron } from '@/lib/security/cron';
import { ingestUsda } from '@/lib/usda/ingest';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;
export async function GET(request: Request) {
  if (!authorizedCron(request)) return NextResponse.json({ error: 'Unauthorized cron request' }, { status: 401 });
  // Recovery/backfill are CLI-only; URL parameters can never alter scheduling policy.
  if (new URL(request.url).search) return NextResponse.json({ error: 'Parameters are not supported' }, { status: 400 });
  try {
    const result = await ingestUsda();
    return NextResponse.json(result, { status: ['failed','unavailable','partial'].includes(result.status) ? 503 : 200, headers: { 'Cache-Control': 'private, no-store' } });
  } catch { return NextResponse.json({ error: 'USDA ingestion failed' }, { status: 503 }); }
}
