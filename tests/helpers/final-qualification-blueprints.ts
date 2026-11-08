import { MEAL_PREP_BLUEPRINTS } from '@/data/meal-prep-blueprints';
import proposal from '../../catalog/proposals/2026-11-07-final-qualification/recipe-use-proposal.json';
export function beforeFinalQualificationBlueprints() {
  const before = structuredClone(MEAL_PREP_BLUEPRINTS);
  for (const p of [...proposal.instructionTitleAndLabelPatches].reverse()) {
    const b = before.find((b) => b.id === p.recipeId)!;
    if (p.field === 'steps') b.steps[p.stepIndex!] = p.before;
    else if (p.field === 'slotLabel') b.slots.find((s) => s.slotKey === p.slotKey)!.label = p.before;
    else b.flavorProfile = p.before;
  }
  for (const removal of proposal.candidateRemovals) {
    const row = proposal.recipeCandidateDecisions.find((r) => r.id === removal.id)!;
    const s = before.find((b) => b.id === row.recipeId)!.slots.find((s) => s.slotKey === row.slotKey)!;
    s.candidateIngredientIds = removal.before.candidateIngredientIds;
    if (s.lowCarbCandidateIds) s.lowCarbCandidateIds = removal.before.lowCarbCandidateIds;
  }
  return before;
}
