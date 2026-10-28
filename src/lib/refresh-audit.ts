import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { getRefreshAuditFromSqlite, recordRefreshAuditToSqlite } from '@/lib/db/sqlite';

export interface RefreshAudit {
  id: string;
  zip_code: string;
  cycle: string;
  attempted_at: string;
  completed_at: string;
  status: 'live' | 'estimates_only' | 'failed';
  flipp_offer_count: number;
  kroger_offer_count: number;
  usda_live: boolean;
}

function auditClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, {
      ...init, cache: 'no-store', signal: AbortSignal.timeout(2500),
    }) },
  });
}

export async function recordRefreshAudit(entry: Omit<RefreshAudit, 'id' | 'completed_at'>) {
  const row: RefreshAudit = { ...entry, id: randomUUID(), completed_at: new Date().toISOString() };
  // Structured runtime logs remain useful if either database is unavailable.
  console.info(JSON.stringify({ event: 'weekly_refresh', ...row }));
  let localSaved = false;
  try {
    recordRefreshAuditToSqlite(row);
    localSaved = true;
  } catch { console.error('Local refresh audit write failed'); }
  try {
    const client = auditClient();
    if (!client) return localSaved ? 'local' as const : 'unavailable' as const;
    const { error } = await client.from('weekly_refresh_audit').insert(row);
    if (error) throw error;
    return 'cloud' as const;
  } catch {
    console.error('Durable refresh audit write failed');
    return 'unavailable' as const;
  }
}

export async function lastSuccessfulRefresh(zip: string): Promise<string | null> {
  try {
    const client = auditClient();
    if (client) {
      const { data, error } = await client.from('weekly_refresh_audit')
        .select('completed_at').eq('zip_code', zip).eq('status', 'live')
        .order('completed_at', { ascending: false }).limit(1).retry(false).maybeSingle();
      if (!error && data) return data.completed_at;
    }
  } catch { /* Local audit is the keyless fallback. */ }
  try { return getRefreshAuditFromSqlite(zip); } catch { return null; }
}
