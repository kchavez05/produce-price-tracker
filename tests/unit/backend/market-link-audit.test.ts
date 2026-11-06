import { describe, expect, it } from 'vitest';
import { CANONICAL_INGREDIENTS } from '@/data/canonical-ingredients';
import audit from '../../../catalog/market-link-audit.json';
import release from '../../../catalog/releases/2026-11-06.1/catalog.json';
import runtime from '@/data/cooking-catalog.json';
import { parseArtifact } from '../../../scripts/lib/catalog-curation';
import { validateMarketLinkAudit } from '../../../scripts/lib/market-link-audit';

const catalog = parseArtifact(release);
const check = (value: unknown) => validateMarketLinkAudit(value, catalog, runtime.recipeLinks, CANONICAL_INGREDIENTS);
describe('complete pantry-to-market applicability audit', () => {
  it('accounts for all identities and keeps fresh/powdered onions in separate dispositions', () => {
    expect(check(audit)).toEqual({ linked: 15, noMarketItem: 96 });
    expect(audit.linkedIngredientIds).toContain('onions-fresh');
    expect(audit.noMarketItem.ingredientIds).toContain('onion-powder');
  });
  it('rejects missing, duplicate, or incorrectly linked identities', () => {
    expect(() => check({ ...audit, linkedIngredientIds: audit.linkedIngredientIds.slice(1) })).toThrow('exactly one');
    expect(() => check({ ...audit, noMarketItem: { ...audit.noMarketItem, ingredientIds: [...audit.noMarketItem.ingredientIds.slice(1), audit.linkedIngredientIds[0]] } })).toThrow('exactly one');
    expect(() => check({ ...audit, linkedIngredientIds: audit.linkedIngredientIds.map((id) => id === 'onions-fresh' ? 'onion-powder' : id), noMarketItem: { ...audit.noMarketItem, ingredientIds: audit.noMarketItem.ingredientIds.map((id) => id === 'onion-powder' ? 'onions-fresh' : id) } })).toThrow('Applicable market links');
  });
  it('requires re-audit after pantry, market, or reviewed-link changes', () => {
    expect(() => validateMarketLinkAudit(audit, { ...catalog, contentHash: 'changed' }, runtime.recipeLinks, CANONICAL_INGREDIENTS)).toThrow('stale');
    expect(() => validateMarketLinkAudit(audit, catalog, runtime.recipeLinks, [...CANONICAL_INGREDIENTS, { id: 'onion-powder', name: 'Onion powder', standardUnit: 'oz' }])).toThrow('stale');
    expect(() => validateMarketLinkAudit(audit, catalog, [], CANONICAL_INGREDIENTS)).toThrow('stale');
    expect(() => validateMarketLinkAudit(audit, catalog, runtime.recipeLinks, CANONICAL_INGREDIENTS.map((r) => r.id === 'yellow-white-onions' ? { ...r, excludeKeywords: [] } : r))).toThrow('stale');
  });
});
