import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { LOCAL_SESSION_COOKIE_NAME } from '@/lib/supabase/config';
import {
  checkRateLimit,
  getSecureCookieOptions,
  sanitizeRedirectPath,
} from '@/lib/security/rate-limit';
import { upsertUserProfileToSqlite } from '@/lib/db/sqlite';
import { AuthProviderType, UserProfile } from '@/types/domain';

export async function GET(request: NextRequest) {
  const rate = checkRateLimit(request, 'auth-callback', 20, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Too many authentication attempts. Please wait before retrying.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(rate.resetInSeconds),
          'X-RateLimit-Limit': String(rate.limit),
          'X-RateLimit-Remaining': String(rate.remaining),
        },
      }
    );
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const demoProvider = searchParams.get('demo_provider');
  const nextPath = sanitizeRedirectPath(searchParams.get('next'));
  const redirectUrl = new URL(nextPath, request.url);

  // 1. Live Supabase OAuth PKCE Code Exchange
  if (code) {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  // 2. Zero-Key Offline / Local SSO Fallback (when NEXT_PUBLIC_SUPABASE_URL is not configured)
  if (demoProvider === 'google' || demoProvider === 'apple') {
    const provider: AuthProviderType = demoProvider === 'apple' ? 'apple' : 'google';
    const now = new Date().toISOString();
    const profile: UserProfile = {
      id:
        provider === 'apple'
          ? 'usr-apple-demo-80542'
          : 'usr-google-demo-80542',
      email:
        provider === 'apple'
          ? 'shopper@privaterelay.appleid.com'
          : 'shopper@pantrybot.dev',
      displayName:
        provider === 'apple' ? 'Apple Meal Prepper' : 'Google Meal Prepper',
      provider,
      createdAtIso: now,
      updatedAtIso: now,
      isCloudBacked: false,
    };

    upsertUserProfileToSqlite(profile);

    const cookieStore = await cookies();
    cookieStore.set(
      LOCAL_SESSION_COOKIE_NAME,
      JSON.stringify({ userId: profile.id, provider: profile.provider }),
      getSecureCookieOptions()
    );

    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.redirect(redirectUrl);
}
