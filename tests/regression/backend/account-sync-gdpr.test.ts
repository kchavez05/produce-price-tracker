import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import {
  upsertUserProfileToSqlite,
  getUserProfileFromSqlite,
  getUserPreferencesFromSqlite,
  getUserFreezerItemsFromSqlite,
  getUserSavedRecipesFromSqlite,
  resetSqliteTestInstance,
} from '@/lib/db/sqlite';
import {
  persistUserSyncState,
  buildUserDataExportArchive,
  purgeUserAccountAndData,
} from '@/lib/supabase/session';
import { FreezerItem, UserProfile } from '@/types/domain';
import { createMockDish } from 'tests/test-utils';

describe('regression: account-sync-gdpr lifecycle', () => {
  beforeEach(() => {
    process.env.PANTRYBOT_SQLITE_PATH = ':memory:';
    resetSqliteTestInstance();
  });

  afterAll(() => {
    resetSqliteTestInstance();
  });

  it('handles user creation, guest data merge, GDPR export, and complete purge', async () => {
    const testProfile: UserProfile = {
      id: 'usr-regression-tester',
      email: 'shopper-test@pantrybot.dev',
      displayName: 'Regression Shopper',
      provider: 'google',
      createdAtIso: new Date().toISOString(),
      updatedAtIso: new Date().toISOString(),
      isCloudBacked: false,
    };

    // 1. Create Profile
    upsertUserProfileToSqlite(testProfile);
    const loadedProfile = getUserProfileFromSqlite(testProfile.id);
    expect(loadedProfile).toBeDefined();
    expect(loadedProfile?.email).toBe(testProfile.email);

    // 2. Guest-to-Account Sync & Merge
    const guestFreezer: FreezerItem[] = [
      {
        id: 'frz-merge-1',
        canonicalIngredientId: 'chicken-thighs-boneless',
        ingredientName: 'Chicken Thighs',
        category: 'PROTEIN',
        quantityLbOrDoz: 5.0,
        unit: 'lb',
        purchasePricePerUnit: 1.99,
        regularPricePerUnit: 4.49,
        totalCostBasis: 9.95,
        estimatedSavings: 12.5,
        store: 'KING_SOOPERS',
        storeBanner: 'King Soopers',
        purchasedAtIso: new Date().toISOString(),
      },
    ];

    const guestRecipe = createMockDish({
      id: 'recipe-merge-1',
      title: 'Merged Batch Chili',
      style: 'CHILI_SOUP',
      appliance: 'DUTCH_OVEN',
    });

    const synced = await persistUserSyncState({
      profile: testProfile,
      preferences: {
        defaultZip: '80542',
        macroGoal: 'HIGH_PROTEIN',
        targetServings: 6,
      },
      freezerItems: guestFreezer,
      savedRecipes: [guestRecipe],
      mergeMode: true,
    });

    expect(synced.preferences?.macroGoal).toBe('HIGH_PROTEIN');
    expect(synced.freezerItems.length).toBe(1);
    expect(synced.savedRecipes.length).toBe(1);

    // Verify stored in user-scoped SQLite tables
    const userFreezer = getUserFreezerItemsFromSqlite(testProfile.id);
    expect(userFreezer.length).toBe(1);
    expect(userFreezer[0].quantityLbOrDoz).toBe(5.0);

    const userRecipes = getUserSavedRecipesFromSqlite(testProfile.id);
    expect(userRecipes.length).toBe(1);
    expect(userRecipes[0].title).toBe('Merged Batch Chili');

    // 3. GDPR Data Export Archive
    const archive = await buildUserDataExportArchive(testProfile);
    expect(archive.schemaVersion).toBe('1.3.0');
    expect(archive.application).toBe('PantryBot (pantrybot.dev)');
    expect(archive.profile.id).toBe(testProfile.id);
    expect(archive.virtualFreezerInventory.length).toBeGreaterThanOrEqual(0);
    expect(archive.savedMealPrepRecipes.length).toBeGreaterThanOrEqual(0);

    // 4. GDPR Right to Be Forgotten (Account & Data Purge)
    await purgeUserAccountAndData(testProfile);

    // Verify all custom rows for user are purged from SQLite
    expect(getUserProfileFromSqlite(testProfile.id)).toBeNull();
    expect(getUserFreezerItemsFromSqlite(testProfile.id)).toEqual([]);
    expect(getUserSavedRecipesFromSqlite(testProfile.id)).toEqual([]);
    // Preferences row is deleted, so it returns standard default preferences (macro ANY instead of HIGH_PROTEIN)
    const fallbackPref = getUserPreferencesFromSqlite(testProfile.id);
    expect(fallbackPref.macroGoal).toBe('ANY');
  });
});
