import { beforeEach, describe, expect, it, vi } from 'vitest';
const cloud = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createServerSupabaseClient: async () => cloud }));
import { legacyInventoryForExport } from '@/lib/pantry/legacy-export.server';
const profile = { id: 'alice', email: '', displayName: 'Alice', provider: 'google' as const, createdAtIso: '', updatedAtIso: '', isCloudBacked: true };

describe('retained legacy data-rights export', () => {
  beforeEach(() => vi.clearAllMocks());
  it('scopes both reads to the verified owner and rejects incomplete archives', async () => {
    const eq = vi.fn((_column: string, _owner: string) => ({ then: (resolve: (value: unknown) => void) => resolve({ data: null, error: { message: 'offline' } }),
      maybeSingle: async () => ({ data: { on_hand_ingredient_ids: ['rice'] }, error: null }) }));
    cloud.from.mockReturnValue({ select: () => ({ eq }) });
    await expect(legacyInventoryForExport(profile)).rejects.toMatchObject({ code: 'storage_unavailable', status: 503 });
    expect(eq.mock.calls).toEqual([['user_id', 'alice'], ['user_id', 'alice']]);
  });
  it('preserves original on-hand selections separately from current Pantry availability', async () => {
    cloud.from.mockImplementation((table: string) => ({ select: () => ({ eq: () => table === 'user_preferences'
      ? { maybeSingle: async () => ({ data: { on_hand_ingredient_ids: ['ground-turkey'] }, error: null }) }
      : Promise.resolve({ data: [], error: null }) }) }));
    expect(await legacyInventoryForExport(profile)).toEqual({ freezerItems: [], onHandIngredientIds: ['ground-turkey'] });
  });
});
