import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { getSupabaseConfig } from './config';

/**
 * Creates a request-scoped Supabase Server Client using Next.js 15 async cookies().
 * Enforces HttpOnly, SameSite=Lax, and Secure in production.
 * Returns null if Supabase credentials are not configured (Zero-Key Offline Mode).
 */
export async function createServerSupabaseClient(): Promise<SupabaseClient | null> {
  const config = getSupabaseConfig();
  if (!config) {
    return null;
  }

  const cookieStore = await cookies();
  const isProd = process.env.NODE_ENV === 'production';

  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, {
              ...options,
              httpOnly: true,
              sameSite: 'lax',
              secure: isProd,
              path: options?.path || '/',
            });
          }
        } catch {
          // Called from a Server Component where setting cookies is ignored;
          // Edge middleware handles session token refresh automatically.
        }
      },
    },
  });
}
