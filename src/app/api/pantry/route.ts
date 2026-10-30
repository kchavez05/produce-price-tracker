import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, verifySameOrigin } from '@/lib/security/rate-limit';
import { migratePrivatePantry, mutatePrivatePantry, readPrivatePantry, resolvePantryContext } from '@/lib/pantry/server';
import { PantryError, validatePantryMutation } from '@/lib/pantry/mutations';

function json(value: unknown, status = 200) {
  return NextResponse.json(value, { status, headers: { 'Cache-Control': 'private, no-store' } });
}
function handleError(error: unknown) {
  return error instanceof PantryError
    ? json({ error: error.message, code: error.code }, error.status)
    : json({ error: 'Couldn’t sync — Retry', code: 'storage_unavailable' }, 503);
}
function guard(request: NextRequest) {
  if (process.env.PANTRYBOT_PANTRY_ENABLED !== 'true') return json({ error: 'Virtual Pantry is not enabled yet.', code: 'not_enabled' }, 503);
  const rate = checkRateLimit(request, 'api-pantry', 90, 60_000);
  if (!rate.allowed) return NextResponse.json({ error: 'Try again shortly.' }, { status: 429, headers: { 'Retry-After': String(rate.resetInSeconds), 'Cache-Control': 'private, no-store' } });
  return null;
}

export async function GET(request: NextRequest) {
  const blocked = guard(request);
  if (blocked) return blocked;
  try { return json(await readPrivatePantry(await resolvePantryContext())); }
  catch (error) { return handleError(error); }
}

export async function POST(request: NextRequest) {
  if (!verifySameOrigin(request)) return json({ error: 'Forbidden cross-origin request' }, 403);
  const blocked = guard(request);
  if (blocked) return blocked;
  try {
    const raw = await request.text();
    if (raw.length > 8192) return json({ error: 'Pantry request is too large.' }, 413);
    let body: unknown;
    try { body = JSON.parse(raw); } catch { return json({ error: 'Invalid JSON payload' }, 400); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ error: 'Invalid pantry request' }, 400);
    const input = body as Record<string, unknown>;
    const context = await resolvePantryContext();
    // This is a replay fence, not authentication: the session selected context.
    if (input.owner !== context.owner) return json({ error: 'Sign in to the original account before retrying.', code: 'owner_changed' }, 409);
    if (input.action === 'migrate') return json(await migratePrivatePantry(context));
    if (input.action !== 'mutate') return json({ error: 'Choose migrate or mutate.' }, 400);
    const result = await mutatePrivatePantry(context, validatePantryMutation(input.mutation, true));
    return json({ owner: context.owner, ...result }, result.status === 'conflict' ? 409 : 200);
  } catch (error) { return handleError(error); }
}
