import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, verifySameOrigin } from '@/lib/security/rate-limit';
import { validateBarcode } from '@/lib/barcodes/validation';
import { lookupConfiguredBarcode } from '@/lib/barcodes/index.server';
import type { BarcodeLookupResult } from '@/types/barcode';

export const runtime = 'nodejs';
export const maxDuration = 5;
function json(value: BarcodeLookupResult, status = 200, extra: Record<string, string> = {}) {
  const body = JSON.stringify(value);
  if (Buffer.byteLength(body) > 16384) return NextResponse.json({ status: 'SERVICE_UNAVAILABLE', message: 'Product details could not be displayed. Choose an ingredient manually.' }, { status: 503, headers: { 'Cache-Control': 'private, no-store' } });
  return new NextResponse(body, { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store', ...extra } });
}
export async function POST(request: NextRequest) {
  if (!verifySameOrigin(request)) return json({ status: 'INVALID', message: 'A same-origin request is required.' }, 403);
  if (process.env.PANTRYBOT_PANTRY_ENABLED !== 'true' || process.env.PANTRYBOT_BARCODE_LOOKUP_ENABLED !== 'true') return json({ status: 'DISABLED', message: 'Product lookup is not enabled. Ingredient search and custom entry remain available.' }, 503);
  // In-process throttling is supplementary. Public activation needs deployed shared enforcement.
  if (process.env.NODE_ENV === 'production' && process.env.PANTRYBOT_BARCODE_SHARED_LIMIT_VERIFIED !== 'true') return json({ status: 'SERVICE_UNAVAILABLE', message: 'Product lookup is not configured for public use. Choose an ingredient manually.' }, 503);
  const rate = checkRateLimit(request, 'barcode-lookup', 30, 60_000);
  if (!rate.allowed) return json({ status: 'THROTTLED', message: 'Too many lookups. Wait briefly or choose an ingredient manually.' }, 429, { 'Retry-After': String(rate.resetInSeconds) });
  try {
    const reader = request.body?.getReader();
    if (!reader) return json({ status: 'INVALID', message: 'Enter a barcode.' }, 400);
    const chunks: Uint8Array[] = []; let length = 0; let timedOut = false;
    const deadline = setTimeout(() => { timedOut = true; void reader.cancel().catch(() => {}); }, 2000);
    try {
      while (true) {
        const { value, done } = await reader.read(); if (done) break;
        length += value.byteLength;
        if (length > 256) { void reader.cancel().catch(() => {}); return json({ status: 'INVALID', message: 'Barcode request is too large.' }, 413); }
        chunks.push(value);
      }
    } finally { clearTimeout(deadline); reader.releaseLock(); }
    if (timedOut) return json({ status: 'SERVICE_UNAVAILABLE', message: 'Lookup request timed out. Choose an ingredient manually or retry.' }, 503);
    let input: unknown;
    try { input = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return json({ status: 'INVALID', message: 'Enter a valid barcode request.' }, 400); }
    if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some((key) => !['barcode', 'format'].includes(key))) return json({ status: 'INVALID', message: 'Only barcode text and format are accepted.' }, 400);
    const body = input as Record<string, unknown>;
    const validated = validateBarcode(body.barcode, body.format === undefined ? 'MANUAL' : body.format);
    if (!validated.ok) return json({ status: validated.status, message: validated.message }, 400);
    const result = await lookupConfiguredBarcode(validated.barcode);
    return json(result, result.status === 'SERVICE_UNAVAILABLE' ? 503 : 200);
  } catch { return json({ status: 'SERVICE_UNAVAILABLE', message: 'Lookup could not complete. Choose an ingredient manually.' }, 503); }
}
