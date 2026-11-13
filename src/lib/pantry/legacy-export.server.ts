import { CommodityCategory, FreezerItem, StoreChain, UserProfile } from '@/types/domain';
import { getUserFreezerItemsFromSqlite, getUserPreferencesFromSqlite } from '@/lib/db/sqlite';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { PantryError } from './mutations';

interface LegacyRow {
  id: string; canonical_ingredient_id: string; ingredient_name: string; category: string;
  quantity_lb_or_doz: number; unit: string; purchase_price_per_unit: number; regular_price_per_unit: number;
  total_cost_basis: number; estimated_savings: number; store: string; store_banner: string;
  purchased_at_iso: string; notes: string | null;
}

/** Data-rights compatibility only. The caller's profile comes from verified auth;
 * the request-scoped RLS client independently enforces ownership on both reads. */
export async function legacyInventoryForExport(profile: UserProfile): Promise<{ freezerItems: FreezerItem[]; onHandIngredientIds: string[] }> {
  if (!profile.isCloudBacked) return { freezerItems: getUserFreezerItemsFromSqlite(profile.id),
    onHandIngredientIds: getUserPreferencesFromSqlite(profile.id).onHandIngredientIds };
  const client = await createServerSupabaseClient();
  if (!client) throw new PantryError('storage_unavailable', 503, 'Could not export original inventory. Retry when connected.');
  const [lots, prefs] = await Promise.all([
    client.from('user_freezer_items').select('*').eq('user_id', profile.id),
    client.from('user_preferences').select('on_hand_ingredient_ids').eq('user_id', profile.id).maybeSingle(),
  ]);
  if (lots.error || prefs.error) throw new PantryError('storage_unavailable', 503, 'Could not export original inventory. Retry when connected.');
  return { onHandIngredientIds: prefs.data?.on_hand_ingredient_ids ?? [],
    freezerItems: ((lots.data ?? []) as LegacyRow[]).map((row) => ({ id: row.id,
      canonicalIngredientId: row.canonical_ingredient_id, ingredientName: row.ingredient_name,
      category: row.category as CommodityCategory, quantityLbOrDoz: Number(row.quantity_lb_or_doz),
      unit: row.unit === 'doz' ? 'doz' : 'lb', purchasePricePerUnit: Number(row.purchase_price_per_unit),
      regularPricePerUnit: Number(row.regular_price_per_unit), totalCostBasis: Number(row.total_cost_basis),
      estimatedSavings: Number(row.estimated_savings), store: row.store as StoreChain,
      storeBanner: row.store_banner, purchasedAtIso: row.purchased_at_iso, notes: row.notes ?? undefined,
    })) };
}
