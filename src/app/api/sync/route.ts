import { NextRequest, NextResponse } from 'next/server';
import {
  loadUserSyncPayload,
  persistUserSyncState,
  resolveCurrentUserProfile,
} from '@/lib/supabase/session';
import { checkRateLimit, verifySameOrigin } from '@/lib/security/rate-limit';
import {
  FreezerItem,
  RecommendedDish,
  UserPreferences,
} from '@/types/domain';

export async function GET(request: NextRequest) {
  const rate = checkRateLimit(request, 'api-sync-get', 60, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again shortly.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(rate.resetInSeconds),
        },
      }
    );
  }

  try {
    const payload = await loadUserSyncPayload();
    return NextResponse.json(payload);
  } catch (error) {
    console.error('Error loading user sync payload:', error);
    return NextResponse.json(
      { error: 'Failed to load user sync state' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!verifySameOrigin(request)) {
    return NextResponse.json(
      { error: 'Forbidden cross-origin mutation request' },
      { status: 403 }
    );
  }

  const rate = checkRateLimit(request, 'api-sync-post', 30, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded for cloud sync updates.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(rate.resetInSeconds),
        },
      }
    );
  }

  try {
    const { profile } = await resolveCurrentUserProfile();
    if (!profile) {
      return NextResponse.json(
        { error: 'Authentication required to sync cloud preferences' },
        { status: 401 }
      );
    }

    let body: {
      preferences?: Partial<UserPreferences>;
      freezerItems?: FreezerItem[];
      savedRecipes?: RecommendedDish[];
      mergeMode?: boolean;
    };
    try {
      body = await request.json();
      if (!body || typeof body !== 'object') {
        return NextResponse.json(
          { error: 'Invalid JSON payload' },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    const updated = await persistUserSyncState({
      profile,
      preferences: body.preferences,
      freezerItems: Array.isArray(body.freezerItems)
        ? body.freezerItems
        : undefined,
      savedRecipes: Array.isArray(body.savedRecipes)
        ? body.savedRecipes
        : undefined,
      mergeMode: Boolean(body.mergeMode),
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error persisting user sync state:', error);
    return NextResponse.json(
      { error: 'Failed to sync user preferences' },
      { status: 500 }
    );
  }
}
