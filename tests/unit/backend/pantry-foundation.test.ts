import { describe, expect, it } from 'vitest';
import { PANTRY_INGREDIENTS } from '@/data/pantry-ingredients';
import { availableRecipeIngredientIds, isCalendarDate, normalizePantryName, pantryIdentity, searchPantryCatalog, validatePantryEntry } from '@/lib/pantry/model';
import { LegacyPantrySource, migrateLegacyPantry, PantryMigrationSnapshot } from '@/lib/pantry/migration';
import { evaluatePantryRequirements } from '@/lib/pantry/requirements';
import { FreezerItem } from '@/types/domain';
import { PantryEntry } from '@/types/pantry';

const now = '2026-10-29T12:00:00Z';
const entry = (patch: Partial<PantryEntry> = {}): PantryEntry => ({
  id: 'entry-1', ingredientId: 'chicken-broth', displayName: 'Chicken broth', available: true,
  revision: 1, updatedAtIso: now, ...patch,
});
const lot = (patch: Partial<FreezerItem> = {}): FreezerItem => ({
  id: 'lot-a', canonicalIngredientId: 'chicken-thighs-boneless', ingredientName: 'Chicken thighs',
  category: 'PROTEIN', quantityLbOrDoz: 2, unit: 'lb', purchasePricePerUnit: 2,
  regularPricePerUnit: 4, totalCostBasis: 4, estimatedSavings: 4, store: 'KING_SOOPERS',
  storeBanner: 'King Soopers', purchasedAtIso: now, notes: 'Keep this purchase record', ...patch,
});
const empty: PantryMigrationSnapshot = { owner: 'guest:private-session', entries: [], needsCatalogMatch: [] };
const source = (patch: Partial<LegacyPantrySource> = {}): LegacyPantrySource => ({
  owner: empty.owner, freezerItems: [], onHandIngredientIds: [], ...patch,
});

describe('pantry input and exact identity', () => {
  it('accepts name-only availability and whitelists editable fields', () => {
    expect(validatePantryEntry({ displayName: '  My   spice  ', available: true, owner: 'account:foreign', revision: 99 }))
      .toEqual({ ok: true, value: { displayName: 'My spice', available: true } });
  });
  it('keeps explicit availability independent of quantity and use-by date', () => {
    for (const available of [true, false]) {
      const input = { displayName: 'Rice', available, quantity: 0, useByDate: '2000-01-01', unit: ' bags ' };
      expect(validatePantryEntry(input)).toEqual({ ok: true, value: { ...input, unit: 'bags' } });
    }
  });
  it.each([NaN, Infinity, -Infinity, -1, '2', null])('rejects invalid quantity %s', (quantity) => {
    expect(validatePantryEntry({ displayName: 'Rice', available: true, quantity })).toMatchObject({ ok: false, errors: { quantity: expect.any(String) } });
  });
  it.each(['2026-02-29', '1900-02-29', '2026-04-31', '2026-13-01', '2026-00-01', '2026-01-00', '2026-1-01', '0000-01-01', '2026-01-01T00:00:00Z'])('rejects invalid calendar date %s', (date) => {
    expect(isCalendarDate(date)).toBe(false);
  });
  it.each(['2000-02-29', '2024-02-29', '2026-10-29'])('keeps valid calendar date %s unchanged', (date) => {
    expect(validatePantryEntry({ displayName: 'Rice', available: true, useByDate: date }))
      .toMatchObject({ ok: true, value: { useByDate: date } });
  });
  it('reports recoverable errors for all invalid fields', () => {
    expect(validatePantryEntry({ displayName: ' ', available: 'Yes', ingredientId: 'unknown', location: ['PANTRY'], unit: 'x'.repeat(41) }))
      .toMatchObject({ ok: false, errors: { displayName: expect.any(String), available: expect.any(String), ingredientId: expect.any(String), location: expect.any(String), unit: expect.any(String) } });
    for (const input of [null, [], 'rice', { displayName: 'a'.repeat(121), available: true }]) {
      expect(validatePantryEntry(input).ok).toBe(false);
    }
  });
  it('deduplicates custom case/whitespace without merging cooking distinctions', () => {
    expect(normalizePantryName('  CAFÉ\n Rice  ')).toBe(normalizePantryName('cafe\u0301 rice'));
    expect(pantryIdentity({ displayName: '  Black beans ', available: true }))
      .toBe(pantryIdentity({ displayName: 'black BEANS', available: false }));
    expect(pantryIdentity({ displayName: 'Rice', available: true })).not.toBe(pantryIdentity(entry({ ingredientId: 'basmati-rice-dry' })));
    expect(new Set(PANTRY_INGREDIENTS.map((item) => item.id)).size).toBe(PANTRY_INGREDIENTS.length);
  });
  it('searches generic identities and reviewed alternate names without granting a match', () => {
    expect(searchPantryCatalog('garbanzo').map((item) => item.id)).toEqual(['chickpeas-canned']);
    expect(searchPantryCatalog('rice').map((item) => item.id)).toContain('jasmine-rice-dry');
    expect(searchPantryCatalog('')).toEqual([]);
    expect(availableRecipeIngredientIds([
      entry({ ingredientId: undefined, displayName: 'Boneless skinless chicken thighs' }),
      entry({ ingredientId: 'chicken-thighs-boneless', quantity: 0 }),
      entry({ ingredientId: 'chicken-breast-boneless', available: false }),
      entry({ ingredientId: 'ground-turkey', deletedAtIso: now }),
    ])).toEqual(['chicken-thighs-boneless']);
  });
});

describe('ownership-preserving legacy migration preparation', () => {
  it('merges overlapping manual/freezer sources and preserves all original purchase lots', () => {
    const legacy = source({ freezerItems: [lot({ quantityLbOrDoz: 0 }), lot({ id: 'lot-b', quantityLbOrDoz: 3, unit: 'doz' })], onHandIngredientIds: ['chicken-thighs-boneless'] });
    const before = JSON.stringify(legacy);
    const migrated = migrateLegacyPantry(empty, legacy, now);
    expect(migrated.entries).toHaveLength(1);
    expect(migrated.entries[0]).toMatchObject({ available: true, location: 'FREEZER', quantity: 0, unit: 'lb' });
    expect(migrated.legacySource).toEqual(legacy);
    expect(JSON.stringify(legacy)).toBe(before);
    expect(migrateLegacyPantry(migrated, legacy, now)).toBe(migrated);
  });
  it('migrates retained zero records to No and manual-only selections to Yes without location', () => {
    const migrated = migrateLegacyPantry(empty, source({ freezerItems: [lot({ quantityLbOrDoz: 0 })], onHandIngredientIds: ['ground-turkey'] }), now);
    expect(migrated.entries[0]).toMatchObject({ available: false, quantity: 0, location: 'FREEZER' });
    expect(migrated.entries[1]).toMatchObject({ available: true, ingredientId: 'ground-turkey' });
    expect(migrated.entries[1].location).toBeUndefined();
  });
  it('preserves ambiguous and unknown legacy identities without guessing a specific food', () => {
    const legacy = source({ freezerItems: [lot({ canonicalIngredientId: 'broccoli-cauliflower', ingredientName: 'Broccoli or cauliflower' }), lot({ id: 'unknown-lot', canonicalIngredientId: 'old-id', ingredientName: 'My ingredient' }), lot({ id: 'unknown-lot-2', canonicalIngredientId: 'old-id', ingredientName: 'An older display name' })], onHandIngredientIds: ['old-id'] });
    const migrated = migrateLegacyPantry(empty, legacy, now);
    expect(migrated.entries).toHaveLength(2);
    expect(migrated.entries.every((item) => !item.ingredientId && item.available)).toBe(true);
    expect(migrated.needsCatalogMatch).toHaveLength(2);
    expect(availableRecipeIngredientIds(migrated.entries)).toEqual([]);
    expect(migrated.legacySource?.freezerItems).toEqual(legacy.freezerItems);
  });
  it('never promotes invalid legacy quantities to available or drops their purchase history', () => {
    const legacy = source({ freezerItems: [lot({ quantityLbOrDoz: -2 })] });
    const migrated = migrateLegacyPantry(empty, legacy, now);
    expect(migrated.entries[0]).toMatchObject({ available: false });
    expect(migrated.entries[0].quantity).toBeUndefined();
    expect(migrated.legacySource).toEqual(legacy);
  });
  it('preserves new-model No decisions and tombstones when preparing a resumed migration', () => {
    for (const deletedAtIso of [undefined, now]) {
      const existing = entry({ ingredientId: 'chicken-thighs-boneless', available: false, deletedAtIso, quantity: 9, revision: 5 });
      const migrated = migrateLegacyPantry({ ...empty, entries: [existing] }, source({ freezerItems: [lot()], onHandIngredientIds: ['chicken-thighs-boneless'] }), now);
      expect(migrated.entries).toEqual([existing]);
    }
  });
  it('requires matching owner scopes and produces stable IDs within the original scope', () => {
    const legacy = source({ freezerItems: [lot()] });
    expect(() => migrateLegacyPantry({ ...empty, owner: 'account:bob' }, legacy, now)).toThrow('owner mismatch');
    const first = migrateLegacyPantry(empty, legacy, now).entries[0].id;
    expect(migrateLegacyPantry(empty, legacy, '2026-10-30T12:00:00Z').entries[0].id).toBe(first);
    expect(migrateLegacyPantry({ ...empty, owner: 'account:alice' }, { ...legacy, owner: 'account:alice' }, now).entries[0].id).not.toBe(first);
  });
});

describe('static staple estimates and boolean recipe coverage', () => {
  const requirements = [
    { ingredientId: 'chicken-broth', quantity: 4, unit: 'cup' },
    { ingredientId: 'olive-oil', quantity: 2, unit: 'tbsp' },
    { ingredientId: 'chicken-broth', quantity: 1, unit: 'cup' },
    { ingredientId: 'basmati-rice-dry', quantity: 1, unit: 'cup', optional: true },
  ];
  it('costs missing staples at fixed estimates and counts distinct required identities', () => {
    expect(evaluatePantryRequirements(requirements, [])).toMatchObject({ requiredCount: 2, availableRequiredCount: 0, optionalCount: 1, estimatedAdditionalCost: 2.40, estimateComplete: true, priceBasis: 'STATIC_ESTIMATE' });
  });
  it('omits available staples regardless of zero quantity or old dates without mutating entries', () => {
    const stocked = [entry({ quantity: 0, useByDate: '2000-01-01' })];
    const before = JSON.stringify(stocked);
    const result = evaluatePantryRequirements(requirements, stocked);
    expect(result).toMatchObject({ availableRequiredCount: 1, estimatedAdditionalCost: 0.40 });
    expect(result.needToBuy.map((item) => item.ingredientId)).toEqual(['olive-oil']);
    expect(JSON.stringify(stocked)).toBe(before);
  });
  it('keeps No/custom/tombstoned ingredients uncovered and reports unknown prices', () => {
    const result = evaluatePantryRequirements([...requirements, { ingredientId: 'custom-food', quantity: 2, unit: 'bag' }], [
      entry({ available: false }), entry({ ingredientId: 'olive-oil', deletedAtIso: now }), entry({ ingredientId: undefined }),
    ]);
    expect(result).toMatchObject({ availableRequiredCount: 0, estimateComplete: false, unpricedIngredientIds: ['custom-food'] });
    expect(evaluatePantryRequirements([{ ingredientId: 'chicken-broth', quantity: 1, unit: 'can' }], []).estimateComplete).toBe(false);
  });
  it('counts optional ingredients separately and prevents double-counting a required identity', () => {
    expect(evaluatePantryRequirements([...requirements, { ...requirements[0], optional: true }], [entry({ ingredientId: 'basmati-rice-dry' })]))
      .toMatchObject({ requiredCount: 2, optionalCount: 1, availableOptionalCount: 1, estimatedAdditionalCost: 2.40 });
  });
  it.each([NaN, Infinity, -1, Number.MAX_VALUE])('rejects unsafe recipe quantities/costs %s', (quantity) => {
    expect(() => evaluatePantryRequirements([{ ingredientId: 'chicken-broth', quantity, unit: 'cup' }], [])).toThrow();
  });
});
