import { NextResponse } from 'next/server';

/** Keep the documented endpoint for at least one release after retirement.
 * No session data is read and no inventory mutation is acknowledged. */
function retired(_request: Request) {
  return NextResponse.json({ code: 'freezer_retired',
    error: 'Virtual Freezer has retired. Reload PantryBot and manage inventory in Virtual Pantry.',
    replacement: '/api/pantry',
  }, { status: 410, headers: { 'Cache-Control': 'no-store' } });
}
export const GET = retired;
export const POST = retired;
export const PATCH = retired;
export const DELETE = retired;
