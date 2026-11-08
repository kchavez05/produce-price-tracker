import { beforeFinalQualificationBlueprints } from './final-qualification-blueprints';
import proposal from '../../catalog/proposals/2026-11-07-market-dairy/recipe-use-proposal.json';

/** Reconstruct the exact protein-era blueprints for retained-history assertions. */
export function beforeDairyBlueprints() {
  const before = beforeFinalQualificationBlueprints();
  for (const p of [...proposal.instructionTitleAndLabelPatches].reverse()) {
    const b = before.find((r) => r.id === p.recipeId)!;
    if (p.field === 'steps') b.steps[p.stepIndex!] = p.before;
    else b.slots.find((s) => s.slotKey === p.slotKey)!.label = p.before;
  }
  for (const split of proposal.slotStructurePatches) {
    const b = before.find((r) => r.id === split.recipeId)!;
    b.slots.splice(b.slots.findIndex((s) => s.slotKey === split.before.slotKey), split.after.length, split.before);
  }
  for (const removal of proposal.candidateRemovals) {
    const row = proposal.decisions.find((r) => r.id === removal.id)!;
    before.find((b) => b.id === row.recipeId)!.slots.find((s) => s.slotKey === row.slotKey)!.candidateIngredientIds = removal.before.candidateIngredientIds;
  }
  return before;
}
