import { marketClient } from './client';

export interface MarketClaim { zip_code: string; lease_id: string }
export async function marketCoverage(zip: string) {
  const client = marketClient();
  if (!client) return null;
  try {
    const { data, error } = await client.from('active_markets')
      .select('first_requested_at,last_requested_at,last_collected_at,last_status')
      .eq('zip_code', zip).maybeSingle();
    if (error) return null;
    return data ? { ...data, active: Date.parse(data.last_requested_at) > Date.now() - 30 * 86400000 } : null;
  } catch { return null; }
}
export async function claimMarkets(zip?: string): Promise<MarketClaim[]> {
  const client = marketClient();
  if (!client) return [];
  const { data, error } = await client.rpc('claim_active_markets', { p_zip: zip ?? '', p_limit: zip ? 1 : 3 }).retry(false);
  if (error) throw new Error('active_market_claim_failed');
  if (!Array.isArray(data)) throw new Error('invalid_market_claims');
  return data.flatMap((row) => row && typeof row === 'object' && !Array.isArray(row) &&
    typeof row.zip_code === 'string' && typeof row.lease_id === 'string'
    ? [{ zip_code: row.zip_code, lease_id: row.lease_id }] : []);
}
export async function requestMarket(zip: string): Promise<MarketClaim | undefined> {
  const client = marketClient();
  if (!client) return;
  try {
    const { error } = await client.rpc('request_active_market', { p_zip: zip }).retry(false);
    if (error) throw error;
    return (await claimMarkets(zip))[0];
  } catch { console.error('active_market_registration_failed'); }
}
export async function finishMarket(claim: MarketClaim, success: boolean) {
  const client = marketClient();
  if (!client) throw new Error('market_storage_unavailable');
  const { data, error } = await client.rpc('finish_active_market', {
    p_zip: claim.zip_code, p_lease: claim.lease_id, p_success: success,
  }).retry(false);
  if (error || data !== true) throw new Error('active_market_finish_failed');
}
