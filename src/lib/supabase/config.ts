export const LOCAL_SESSION_COOKIE_NAME = 'pantrybot_session_v14';
export const GUEST_SESSION_COOKIE_NAME = 'pantrybot_guest_v14';

export interface SupabaseEnvConfig {
  url: string;
  anonKey: string;
}

/**
 * Returns true only when valid non-empty Supabase URL and Anon Key environment variables are present.
 * Ensures Zero-Key Offline Resilience when running without external cloud credentials.
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return Boolean(
    url &&
      anonKey &&
      url.startsWith('http') &&
      !url.includes('your-project-ref')
  );
}

export function getSupabaseConfig(): SupabaseEnvConfig | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim(),
  };
}
