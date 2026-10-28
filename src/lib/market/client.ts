import type { MarketDatabase, Json } from '@/types/market-database';
import { createClient } from '@supabase/supabase-js';

/** Server-only shared market access; never import this module from client components. */
export function marketClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !key) return null;
  return createClient<MarketDatabase>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, {
      ...init, cache: 'no-store', signal: init?.signal ?? AbortSignal.timeout(5000),
    }) },
  });
}

/** Values cross this boundary only after JSON serialization; undefined object fields are omitted. */
export function asJson(value: unknown): Json { return JSON.parse(JSON.stringify(value)) as Json; }
