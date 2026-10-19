import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseConfig } from './config';

/**
 * Refreshes the user's Supabase session token on incoming requests via Edge Middleware.
 * In Zero-Key Offline Mode (no Supabase credentials), passes the request through immediately.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const config = getSupabaseConfig();
  let supabaseResponse = NextResponse.next({
    request,
  });

  if (!config) {
    return supabaseResponse;
  }

  const isProd = process.env.NODE_ENV === 'production';

  const supabase = createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        supabaseResponse = NextResponse.next({
          request,
        });
        for (const { name, value, options } of cookiesToSet) {
          supabaseResponse.cookies.set(name, value, {
            ...options,
            httpOnly: true,
            sameSite: 'lax',
            secure: isProd,
            path: options?.path || '/',
          });
        }
      },
    },
  });

  try {
    // Refresh session if expired
    await supabase.auth.getUser();
  } catch {
    // Network or auth error; continue safely in guest mode
  }

  return supabaseResponse;
}
