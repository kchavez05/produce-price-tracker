import { describe, expect, it } from 'vitest';
import previousData from '../../../catalog/releases/2026-11-06.4/catalog.json';
import currentData from '../../../catalog/releases/2026-11-06.5/catalog.json';
import ledgerData from '../../../catalog/curation-ledger.json';
import proposalData from '../../../catalog/proposals/2026-11-06-final-audit/ledger.json';
import approvedHashes from '../../../catalog/proposals/2026-11-06-final-audit/decision-hashes.json';
import evidenceData from '../../../catalog/proposals/2026-11-06-final-audit/source-evidence.json';
import runtime from '@/data/cooking-catalog.json';
import { decisionHash, parseArtifact, parseLedger, parseSources } from '../../../scripts/lib/catalog-curation';
import { availableCookingIngredientIds, searchCookingCatalog } from '@/lib/pantry/catalog-search';
import { PantryEntry } from '@/types/pantry';

const previous = parseArtifact(previousData), current = parseArtifact(currentData);
const ledger = parseLedger(ledgerData), proposal = parseLedger(proposalData);

describe('approved final-audit provenance integration', () => {
  it('binds all 53 approvals to the exact reviewed payloads and preserves all prior approvals', () => {
    expect(approvedHashes).toHaveLength(53);
    expect(current.decisions).toHaveLength(147);
    expect(current.decisions).toEqual(expect.arrayContaining(previous.decisions));
    expect(ledger.decisions.filter((d) => previous.decisions.some((h) => h.id === d.id && h.revision === d.revision))).toEqual(proposal.decisions.filter((d) => d.status === 'approved'));
    for (const hash of approvedHashes) {
      const decision = ledger.decisions.find((d) => d.id === hash.id && d.revision === hash.revision)!;
      expect(decisionHash(decision)).toBe(hash.payloadSha256);
      expect(decision.review).toMatchObject({ date: '2026-11-06', payloadSha256: hash.payloadSha256 });
      expect(decision.status).toBe('approved');
    }
  });
  it('preserves every identity, estimate and recipe rule except the two approved discovery metadata changes', () => {
    expect(current.ingredients.map((r) => r.id)).toEqual(previous.ingredients.map((r) => r.id));
    for (const before of previous.ingredients) {
      const expected = structuredClone(before);
      if (before.id === 'masa-harina') expected.aliases = [...expected.aliases, 'corn masa flour'];
      if (before.id === 'ground-cumin') { expected.familyId = 'cumin'; expected.form = 'ground'; }
      expect(current.ingredients.find((r) => r.id === before.id)).toEqual(expected);
    }
    expect(current.compatibility).toEqual(previous.compatibility);
    expect(runtime.retainedCatalogs.find((r) => r.version === previous.catalogVersion)).toMatchObject({ ingredients: previous.ingredients, compatibility: previous.compatibility });
    expect(searchCookingCatalog(current.ingredients, 'flour', 1000)).toHaveLength(11);
    expect(searchCookingCatalog(current.ingredients, 'corn masa flour').map((r) => r.id)).toEqual(['masa-harina']);
  });
  it('uses only the reviewed eligible sources and keeps cumin family evidence separate from exact form evidence', () => {
    const evidence = parseSources(evidenceData);
    const oldLinks = new Set(previous.sourceLinks.map((r) => `${r.ingredientId}:${r.key}`));
    expect(current.sourceLinks.filter((r) => r.purpose === 'identity')).toHaveLength(123);
    expect(current.sourceLinks.filter((r) => r.purpose === 'general-reference')).toHaveLength(5);
    expect(new Set(current.sourceLinks.map((r) => r.ingredientId)).size).toBe(122);
    for (const link of current.sourceLinks.filter((r) => !oldLinks.has(`${r.ingredientId}:${r.key}`))) {
      expect(evidence.records.find((r) => r.key === link.key)).toMatchObject({ fingerprint: link.fingerprint, disposition: 'candidate' });
    }
    expect(current.sourceLinks.filter((r) => r.ingredientId === 'ground-cumin')).toMatchObject([{ key: 'sr_legacy_food:170923', purpose: 'general-reference', familyId: 'cumin' }]);
  });
  it('does not let new metadata or source links change ownership, exact No or private custom entries', () => {
    for (const ingredientId of ['ground-cumin', 'masa-harina']) {
      const entry: PantryEntry = { id: ingredientId, ingredientId, displayName: ingredientId, available: true, revision: 1, updatedAtIso: '' };
      expect(availableCookingIngredientIds([entry], current.ingredients, current.compatibility)).toEqual([ingredientId]);
      expect(availableCookingIngredientIds([entry, { ...entry, id: `no-${ingredientId}`, available: false }], current.ingredients, current.compatibility)).toEqual([]);
      expect(availableCookingIngredientIds([{ ...entry, ingredientId: undefined }], current.ingredients, current.compatibility)).toEqual([]);
    }
  });
});
