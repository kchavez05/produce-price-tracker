import { describe, expect, it } from 'vitest';
import cases from '../../../catalog/proposals/2026-11-07-final-qualification/behavior-cases.json';
import proposal from '../../../catalog/proposals/2026-11-07-final-qualification/recipe-use-proposal.json';
import envelope from '../../../catalog/proposals/2026-11-07-final-qualification/review-envelope.json';
import previous from '../../../catalog/releases/2026-11-07.3/catalog.json';
import artifact from '../../../catalog/releases/2026-11-07.4/catalog.json';
import approval from '../../../catalog/market-coverage-approvals.json';
import original from '../../../catalog/scoped-recipe-uses.json';
import runtime from '@/data/cooking-catalog.json';
import { beforeFinalQualificationBlueprints } from '../../helpers/final-qualification-blueprints';
import { MEAL_PREP_BLUEPRINTS } from '@/data/meal-prep-blueprints';
import { CANONICAL_INGREDIENTS } from '@/data/canonical-ingredients';
import { exactOfferAllowed, EXACT_OFFER_IDS } from '@/lib/pantry/exact-offer';
import { qualifiedExactCommodity } from '@/lib/pantry/commodity-offers';
import { marketCounterpartIds } from '@/lib/pantry/market-counterparts';
import { availablePantryIngredientIds, cookingCatalogView } from '@/lib/pantry/model';
import { isProtectedMarketIngredient } from '@/lib/pantry/recipe-use';
import { applyPantryToRecipe } from '@/lib/pantry/recipe';
import { buildShoppingListAndStoreComparison } from '@/lib/shopping-list';
import { rankMealPrepDishes } from '@/lib/meal-prep-matcher';
import { scoreAllCommodities } from '@/lib/scoring-and-matcher';
import { calculateValueScore } from '@/lib/value-score';
import { compileExactQualifications, compileMarketCounterparts } from '../../../scripts/lib/market-coverage-approvals';
import { compileScopedRecipeUses } from '../../../scripts/lib/scoped-recipe-uses';
import { parseArtifact, sha256 } from '../../../scripts/lib/catalog-curation';
import { createMockCommodity, createMockDish, createMockOffer } from 'tests/test-utils';
import { StoreChain, MatchedSlotIngredient } from '@/types/domain';
const ingredient = (id: string) => CANONICAL_INGREDIENTS.find((i) => i.id === id)!;
const owned = (id: string, no = false) => availablePantryIngredientIds([{ id:'yes',ingredientId:id,displayName:id,available:true,revision:1,updatedAtIso:'',quantity:0,useByDate:'2000-01-01' }, ...(no ? [{ id:'no',ingredientId:id,displayName:id,available:false,revision:1,updatedAtIso:'' }] : [])]);
function quote(id: string, tuples: [string,number,StoreChain][], selected: StoreChain[] = ['KING_SOOPERS']) { const offers = tuples.map(([rawTitle,price,store]) => createMockOffer({canonicalIngredientId:id,rawTitle,normalizedPricePerUnit:price,regularPricePerUnit:price+1,store,source:'FLIPP_LIVE'})); return createMockCommodity({ingredient:ingredient(id),bestOffer:offers[0],storeOffers:{[offers[0].store]:offers[0]},recipeOffers:offers,recipeStorePool:selected}); }
function slot(id: string, label = 'Exact ingredient', optional = false): MatchedSlotIngredient { return {ingredientId:id,ingredientName:ingredient(id).name,slotLabel:label,quantityUsed:2,unit:'lb',store:'KING_SOOPERS',rawDealText:'Old cached price',dealType:'SHELF_OR_MEMBER',unitCost:99,slotCost:198,regularSlotCost:198,isUserPinned:false,optional}; }
function dish(id: string, recipeId = 'custom-exact-recipe', label?: string, optional = false) { const b = MEAL_PREP_BLUEPRINTS.find((b) => b.id === recipeId); return createMockDish({id:recipeId,title:b?.title??'Custom exact food',steps:b?.steps??['Use the named exact food'],matchedIngredients:[slot(id,label,optional)],pantryRequirements:[],pantryStaples:[],estimatedPantryCost:0}); }

describe('approved final qualification and release scope integration', () => {
  it.each(cases.offerCases)('qualifies original "$title" across counterpart and market scoring', (r) => {
    expect(exactOfferAllowed(r.marketIngredientId,r.title)).toBe(r.admit);
    expect(marketCounterpartIds(r.marketIngredientId,r.title)).toEqual(r.expectedCounterpartIds);
    const offers=[createMockOffer({canonicalIngredientId:r.marketIngredientId,rawTitle:r.title})], before=JSON.stringify(offers);
    expect(scoreAllCommodities(offers,'ALL',{},['KING_SOOPERS'],{}).some((c) => c.ingredient.id===r.marketIngredientId)).toBe(r.admit);
    expect(JSON.stringify(offers)).toBe(before);
  });
  it.each(cases.availabilityCases)('preserves exact Yes/No for $ingredientId', (r) => { expect(owned(r.ingredientId,r.negativeIds.length>0).includes(r.ingredientId)).toBe(r.expectedAvailable); expect(isProtectedMarketIngredient(r.ingredientId)).toBe(false); });
  it.each(proposal.recipeCandidateDecisions)('retains or rejects the exact candidate $id', (r) => {
    const b=MEAL_PREP_BLUEPRINTS.find((b) => b.id===r.recipeId)!,s=b.slots.find((s) => s.slotKey===r.slotKey)!;
    expect([...s.candidateIngredientIds,...s.lowCarbCandidateIds??[]].includes(r.marketIngredientId)).toBe(r.action==='retain-exact');
    const title=cases.offerCases.find((c) => c.marketIngredientId===r.marketIngredientId&&c.admit)!.title, q=quote(r.marketIngredientId,[[title,2,'KING_SOOPERS']]);
    const input=dish(r.marketIngredientId,r.recipeId,s.label,r.optional),before=JSON.stringify(input),out=applyPantryToRecipe(input,owned(r.marketIngredientId),[q]);
    if(r.action==='retain-exact') { expect(out.pantryCoverage![r.optional?'availableOptionalCount':'availableRequiredCount']).toBe(1); expect(out.totalBatchCost).toBe(0); }
    else { expect(out.pantryCoverage!.availableRequiredCount).toBe(0); expect(out.additionalCostEstimateComplete).toBe(false); expect(out.matchedIngredients).toHaveLength(0); }
    expect(JSON.stringify(input)).toBe(before);
  });
  it.each(EXACT_OFFER_IDS.flatMap((id) => (['KING_SOOPERS','SAFEWAY','ALDI','WALMART','TARGET','SPROUTS'] as StoreChain[]).map((store) => ({id,store}))))('recovers qualified $id at $store before cheapest-per-store selection', ({id,store}) => {
    const yes=cases.offerCases.find((r) => r.marketIngredientId===id&&r.admit)!.title,no=cases.offerCases.find((r) => r.marketIngredientId===id&&!r.admit)!.title;
    const q=quote(id,[[no,1,store],[yes,3,store]],[store]), scored=scoreAllCommodities(q.recipeOffers!,store,{},[store],{});
    expect(scored).toHaveLength(1);expect(scored[0].bestOffer.rawTitle).toBe(yes);expect(scored[0].recipeOffers).toHaveLength(1);
    const input=dish(id),out=applyPantryToRecipe(input,[],[q]); expect(out.totalBatchCost).toBe(6);expect(out.matchedIngredients[0].rawDealText).toContain(yes);
    const shopping=buildShoppingListAndStoreComparison([out],[q],[],'80542',[store]);expect(shopping.items[0].storePricing?.[store]?.ingredientName).toBe(yes);expect(shopping.items[0].optimalTotalCost).toBe(6);
  });
  it.each(proposal.exactRecipeExclusions)('blocks stale matched and literal requirements for $recipeId / $pantryIngredientId', (r) => {
    const title=cases.offerCases.find((c) => c.marketIngredientId===r.pantryIngredientId&&c.admit)!.title,q=quote(r.pantryIngredientId,[[title,2,'KING_SOOPERS']]);
    const input=dish(r.pantryIngredientId,r.recipeId,r.slotLabel), literal={...input,matchedIngredients:[],pantryRequirements:[{ingredientId:r.pantryIngredientId,displayName:ingredient(r.pantryIngredientId).name,quantity:2,unit:'lb'}]};
    for(const stale of [input,literal,{...input,aiGenerated:true},{...literal,steps:['Edited custom instructions']}]) { const out=applyPantryToRecipe(stale,owned(r.pantryIngredientId),[q]);expect(out.pantryCoverage!.availableRequiredCount).toBe(0);expect(out.additionalCostEstimateComplete).toBe(false);expect(out.matchedIngredients).toHaveLength(0);const shopping=buildShoppingListAndStoreComparison([out],[q],owned(r.pantryIngredientId),'80542',['KING_SOOPERS']);expect(shopping.pantryNeeds.some((n) => n.estimatedCost===null)).toBe(true); }
    expect(applyPantryToRecipe({...input,id:'separate-private-recipe'},owned(r.pantryIngredientId),[q]).pantryCoverage!.availableRequiredCount).toBe(1);
  });
  it.each(proposal.recipeCandidateDecisions.filter((r) => r.action === 'retain-exact'))('preserves quote-independent exact ownership for $recipeId / $slotKey', (r) => {
    const blueprint = MEAL_PREP_BLUEPRINTS.find((b) => b.id === r.recipeId)!, slot = blueprint.slots.find((s) => s.slotKey === r.slotKey)!;
    const macroGoal = !slot.candidateIngredientIds.includes(r.marketIngredientId) ? 'LOW_CARB_KETO' as const : 'ANY' as const;
    const yes = rankMealPrepDishes([], [r.marketIngredientId], owned(r.marketIngredientId), 6, {  macroGoal }).allRankedDishes.find((d) => d.id === r.recipeId)!;
    expect(yes.pantryRequirements!.some((need) => need.ingredientId === r.marketIngredientId)).toBe(true);
    expect(yes.pantryCoverage![r.optional ? 'availableOptionalCount' : 'availableRequiredCount']).toBeGreaterThan(0);
    expect(yes.pantryRequirements!.some((need) => need.ingredientId === `unmapped:${r.recipeId}:${r.slotKey}`)).toBe(false);
    const no = rankMealPrepDishes([], [r.marketIngredientId], owned(r.marketIngredientId, true), 6, {  macroGoal }).allRankedDishes.find((d) => d.id === r.recipeId)!;
    expect(no.pantryCoverage![r.optional ? 'availableOptionalCount' : 'availableRequiredCount']).toBe(0);
    expect(buildShoppingListAndStoreComparison([yes], [], owned(r.marketIngredientId), '80542', ['KING_SOOPERS']).pantryNeeds.some((need) => need.ingredientId === r.marketIngredientId)).toBe(false);
  });
  it('keeps selected stores and cached direct prices from manufacturing a quote', () => {
    for(const id of EXACT_OFFER_IDS) {
      const yes=cases.offerCases.find((r) => r.marketIngredientId===id&&r.admit)!.title,no=cases.offerCases.find((r) => r.marketIngredientId===id&&!r.admit)!.title;
      const q=quote(id,[[no,1,'KING_SOOPERS'],[yes,2,'SAFEWAY']]);expect(qualifiedExactCommodity(q)).toBeUndefined();expect(applyPantryToRecipe(dish(id),[],[q]).additionalCostEstimateComplete).toBe(false);
      expect(qualifiedExactCommodity({...q,recipeStorePool:['SAFEWAY']})!.bestOffer.store).toBe('SAFEWAY');
      const legacy={...q,recipeOffers:undefined,recipeStorePool:undefined};expect(qualifiedExactCommodity(legacy)).toBeUndefined();
      const literal={...dish(id),matchedIngredients:[],pantryRequirements:[{ingredientId:id,displayName:id,quantity:2,unit:'lb'}]};expect(applyPantryToRecipe(literal,[],[{...q,recipeStorePool:['SAFEWAY']}]).totalBatchCost).toBe(4);
    }
  });
  it('keeps unqualified legacy shopping prices and excluded owned slots unavailable', () => {
    const id='chicken-breast-boneless', q=quote(id,[['Fresh Chicken Breast',1,'KING_SOOPERS']]);
    const legacy={...dish(id),pantryRequirements:undefined};
    const shopping=buildShoppingListAndStoreComparison([legacy],[q],[],'80542',['KING_SOOPERS']);
    expect(shopping.items).toHaveLength(0);expect(shopping.pantryNeeds[0].estimatedCost).toBeNull();expect(shopping.tripComparison.additionalCostEstimateComplete).toBe(false);
    const row=proposal.exactRecipeExclusions[0], bad={...dish(row.pantryIngredientId,row.recipeId,row.slotLabel),pantryRequirements:undefined};bad.matchedIngredients[0].isOnHand=true;
    const blocked=buildShoppingListAndStoreComparison([bad],[],[row.pantryIngredientId],'80542',['KING_SOOPERS']);expect(blocked.items).toHaveLength(0);expect(blocked.pantryNeeds[0].ingredientId).toContain('unmapped:');
  });
  it('does not promote historical group benchmarks, source overrides or club prices into exact-food savings', () => {
    for(const id of EXACT_OFFER_IDS) {
      const title=cases.offerCases.find((r) => r.marketIngredientId===id&&r.admit)!.title;
      const q=quote(id,[[title,2,'KING_SOOPERS']]);const scored=scoreAllCommodities(q.recipeOffers!,'ALL',{[id]:{mountainBaseline:999}},['KING_SOOPERS'],{});
      expect(scored[0].discountVsBaselinePct).toBe(0);expect(scored[0].discountVsRegularPct).toBe(0);expect(scored[0].bestOffer.regularPricePerUnit).toBe(2);expect(scored[0].clubBenchmark).toBeUndefined();expect(scored[0].comparisonEvidence).toBe('UNQUALIFIED_GROUP_HISTORY');expect(scored[0].cycleSignal!.pctVsSixWeekLow).toBe(0);
      expect(calculateValueScore({...ingredient(id),mountainBaselinePerUnit:999},2,3).discountVsBaselinePct).toBe(0);
      const observed={...q,recipeOffers:q.recipeOffers!.map((o) => ({...o,regularPriceEvidence:'OBSERVED_SAME_PRODUCT' as const}))};expect(qualifiedExactCommodity(observed)!.discountVsRegularPct).toBe(33);
    }
    expect(exactOfferAllowed('onions-fresh','Anything')).toBeUndefined();
  });
  it('binds real approval, unchanged identities and all declared recipe projections without a registry migration', () => {
    expect(artifact.ingredients).toEqual(previous.ingredients);expect(artifact.compatibility).toEqual(previous.compatibility);expect(artifact.sourceLinks).toEqual(previous.sourceLinks);expect(artifact.decisions).toEqual(previous.decisions);
    const batch=approval.approvals[3];expect(batch.review.by).toContain('Approve qualification and scope packet');expect(batch.review.payloadSha256).toBe(sha256(envelope));expect(batch.scopeDeferrals!.decisions).toHaveLength(5);
    expect(sha256(beforeFinalQualificationBlueprints())).toBe(proposal.blueprintHash);expect(sha256(MEAL_PREP_BLUEPRINTS)).toBe(proposal.proposedImplementedBlueprintHash);
    expect(compileMarketCounterparts(approval,parseArtifact(artifact).ingredients,CANONICAL_INGREDIENTS)).toEqual(runtime.marketCounterparts);expect(runtime.marketCounterparts).toHaveLength(85);
    const compiled=compileExactQualifications(approval,parseArtifact(artifact).ingredients,CANONICAL_INGREDIENTS,MEAL_PREP_BLUEPRINTS);expect(compiled.qualifications).toEqual(runtime.exactOfferQualifications);expect(compiled.exclusions).toEqual(runtime.exactRecipeExclusions);expect(compiled.exclusions).toHaveLength(3);
    expect(compileScopedRecipeUses(original,parseArtifact(artifact).ingredients,CANONICAL_INGREDIENTS,MEAL_PREP_BLUEPRINTS,approval).uses).toEqual(runtime.scopedRecipeUses);expect(runtime.scopedRecipeUsesHash).toBe(envelope.projectedScopedUsesHash);
    expect(runtime.protectedRecipeMarketIds).toHaveLength(20);expect(runtime.retainedCatalogs).toHaveLength(11);expect(cookingCatalogView(previous.catalogVersion).ingredients).toEqual(previous.ingredients);
    const bad=structuredClone(approval);bad.approvals[3].qualifications!.decisions[0].require='Changed';expect(() => compileExactQualifications(bad,parseArtifact(artifact).ingredients,CANONICAL_INGREDIENTS,MEAL_PREP_BLUEPRINTS)).toThrow('stale');
  });
});
