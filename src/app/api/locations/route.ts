import { NextResponse } from 'next/server';
import { MEAD_KING_SOOPERS_LOCATIONS } from '@/lib/connectors/usda-and-kroger';

export async function GET() {
  return NextResponse.json({
    zipCode: '80542',
    chain: 'KING_SOOPERS',
    locations: MEAD_KING_SOOPERS_LOCATIONS,
  });
}
