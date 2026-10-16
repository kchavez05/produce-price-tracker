import { NextRequest, NextResponse } from 'next/server';
import { MEAD_KING_SOOPERS_LOCATIONS } from '@/lib/connectors/usda-and-kroger';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const zipCode = searchParams.get('zipCode') || searchParams.get('zip') || '80542';

  return NextResponse.json({
    zipCode,
    chain: 'KING_SOOPERS',
    locations: MEAD_KING_SOOPERS_LOCATIONS,
  });
}
