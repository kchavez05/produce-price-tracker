import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from './config';

let browserClient: SupabaseClient | null = null;

/**
 * Creates a singleton browser Supabase client if credentials are configured.
 * Returns null in Zero-Key Offline Mode so client components never crash.
 */
export function createBrowserSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config) {
    return null;
  }

  if (!browserClient) {
    browserClient = createBrowserClient(config.url, config.anonKey);
  }
  return browserClient;
}
