import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  buildUserDataExportArchive,
  loadUserSyncPayload,
  purgeUserAccountAndData,
  resolveCurrentUserProfile,
} from '@/lib/supabase/session';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isSupabaseConfigured, LOCAL_SESSION_COOKIE_NAME } from '@/lib/supabase/config';
import {
  checkRateLimit,
  getSecureCookieOptions,
  verifySameOrigin,
} from '@/lib/security/rate-limit';
import { createLocalSession, revokeLocalSession, upsertUserProfileToSqlite } from '@/lib/db/sqlite';
import { AuthProviderType, UserProfile } from '@/types/domain';

export async function GET(request: NextRequest) {
  const rate = checkRateLimit(request, 'api-account-export', 15, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Too many data export requests. Please try again in a minute.' },
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
        { error: 'Must be signed in to export account data' },
        { status: 401 }
      );
    }

    const archive = await buildUserDataExportArchive(profile);
    return NextResponse.json(archive);
  } catch (error) {
    console.error('Error building user data export archive:', error);
    return NextResponse.json(
      { error: 'Failed to export grocery account data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!verifySameOrigin(request)) {
    return NextResponse.json(
      { error: 'Forbidden cross-origin request' },
      { status: 403 }
    );
  }

  const rate = checkRateLimit(request, 'api-account-auth', 20, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Too many authentication requests. Please wait a moment.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(rate.resetInSeconds),
        },
      }
    );
  }

  try {
    let body: {
      action?: 'SIGN_IN_LOCAL' | 'SIGN_OUT';
      provider?: AuthProviderType;
      email?: string;
      displayName?: string;
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

    if (body.action === 'SIGN_OUT') {
      if (isSupabaseConfigured()) {
        const supabase = await createServerSupabaseClient();
        if (supabase) {
          await supabase.auth.signOut();
        }
      }
      const cookieStore = await cookies();
      revokeLocalSession(cookieStore.get(LOCAL_SESSION_COOKIE_NAME)?.value);
      cookieStore.delete(LOCAL_SESSION_COOKIE_NAME);
      return NextResponse.json({
        authenticated: false,
        ok: true,
      });
    }

    if (body.action === 'SIGN_IN_LOCAL') {
      const provider: AuthProviderType =
        body.provider === 'apple' ? 'apple' : 'google';
      const now = new Date().toISOString();
      const profile: UserProfile = {
        id: `usr-local-${randomUUID()}`,
        email:
          (typeof body.email === 'string' ? body.email.trim() : '') ||
          (provider === 'apple'
            ? 'shopper@privaterelay.appleid.com'
            : 'shopper@pantrybot.dev'),
        displayName:
          (typeof body.displayName === 'string' ? body.displayName.trim() : '') ||
          (provider === 'apple' ? 'Apple Meal Prepper' : 'Google Meal Prepper'),
        provider,
        createdAtIso: now,
        updatedAtIso: now,
        isCloudBacked: false,
      };

      upsertUserProfileToSqlite(profile);

      const cookieStore = await cookies();
      revokeLocalSession(cookieStore.get(LOCAL_SESSION_COOKIE_NAME)?.value);
      cookieStore.set(
        LOCAL_SESSION_COOKIE_NAME,
        createLocalSession(profile.id),
        getSecureCookieOptions()
      );

      const payload = await loadUserSyncPayload();
      return NextResponse.json(payload);
    }

    return NextResponse.json(
      { error: 'Unsupported account action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error handling account action:', error);
    return NextResponse.json(
      { error: 'Account operation failed' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!verifySameOrigin(request)) {
    return NextResponse.json(
      { error: 'Forbidden cross-origin deletion request' },
      { status: 403 }
    );
  }

  const rate = checkRateLimit(request, 'api-account-delete', 5, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded for account deletion.' },
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
        { error: 'Not signed in' },
        { status: 401 }
      );
    }

    // Expected owner is a replay fence, never authentication.
    const expectedUserId = request.headers.get('x-pantrybot-account-id');
    if (expectedUserId !== null && expectedUserId !== profile.id) return NextResponse.json({ error: 'The account changed. Retry from the original account.' }, { status: 409 });

    await purgeUserAccountAndData(profile);

    return NextResponse.json({
      deleted: true,
      purgedUserId: profile.id,
      purgedAtIso: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error deleting user account:', error);
    return NextResponse.json(
      { error: 'Failed to delete user account and data' },
      { status: 500 }
    );
  }
}
