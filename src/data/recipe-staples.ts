import { DietaryConstraint } from '@/types/domain';
import { PantryRequirement } from '@/types/pantry';

// Reviewed amounts for a six-serving batch. Alternatives reflect the existing
// recipe text, rather than fuzzy name matching or newly invented substitutions.
type Choice = readonly PantryRequirement[];
/** Labeled unopened can contents, never drained food mass. Old saved recipes remain unspecified. */
export const CANNED_NET_CONTENTS_VERSION = 'canned-net-contents-v1';
const netContentsIngredients = new Set(['black-beans-canned', 'kidney-beans-canned', 'cannellini-beans-canned', 'great-northern-beans-canned', 'crushed-tomatoes-canned']);
const item = (ingredientId: string, quantity: number, unit: string, optional = false): PantryRequirement => ({ ingredientId, quantity, unit, ...(unit === 'oz' && netContentsIngredients.has(ingredientId) ? { quantityBasisVersion: CANNED_NET_CONTENTS_VERSION } : {}), ...(optional ? { optional } : {}) });
const one = (ingredientId: string, quantity: number, unit: string): Choice => [item(ingredientId, quantity, unit)];
const garlic = (cloves = 4) => one('garlic-fresh', cloves, 'clove');
const spice = (id: string, teaspoons = 1) => one(id, teaspoons, 'tsp');
const worcestershire: Choice = [item('worcestershire-sauce-gluten-free', 2, 'tbsp'), item('worcestershire-sauce', 2, 'tbsp')];

export const RECIPE_STAPLES: Readonly<Record<string, readonly Choice[]>> = {
  'colorado-pork-green-chile-stew': [one('chicken-broth', 4, 'cup'), spice('ground-cumin'), spice('mexican-oregano-dried'), garlic(), one('cornstarch', 2, 'tbsp')],
  'dutch-oven-beef-chuck-pot-roast-stew': [one('beef-broth', 4, 'cup'), one('tomato-paste', 2, 'tbsp'), worcestershire,
    [item('cornstarch', 3, 'tbsp'), item('all-purpose-flour', 3, 'tbsp')], spice('thyme-dried'), one('bay-leaf', 2, 'each')],
  'cheesy-chicken-broccoli-potato-casserole': [spice('garlic-powder'), spice('onion-powder'), spice('smoked-paprika'), one('chicken-broth', 0.5, 'cup'), one('olive-oil', 2, 'tbsp')],
  'southwest-sweet-potato-ground-beef-chili-bake': [[item('black-beans-canned', 30, 'oz'), item('kidney-beans-canned', 30, 'oz')],
    one('crushed-tomatoes-canned', 28, 'oz'), spice('chili-powder'), spice('ground-cumin'), spice('smoked-paprika')],
  'kielbasa-cabbage-apple-potato-braise': [one('apple-cider-vinegar', 2, 'tbsp'), [item('whole-grain-mustard', 2, 'tbsp'), item('dijon-mustard', 2, 'tbsp')],
    one('chicken-broth', 1.5, 'cup'), [item('caraway-seeds', 1, 'tsp'), item('thyme-dried', 1, 'tsp')]],
  'tuscan-sausage-white-bean-spinach-potato-stew': [[item('cannellini-beans-canned', 15, 'oz'), item('great-northern-beans-canned', 15, 'oz')],
    one('chicken-broth', 5, 'cup'), spice('italian-seasoning'), spice('red-pepper-flakes', 0.5), garlic()],
  'golden-chicken-butternut-squash-curry-braise': [spice('curry-powder', 3), spice('garam-masala', 3),
    [item('coconut-milk-canned', 1.75, 'cup'), item('chicken-broth', 1.75, 'cup')], garlic(), one('ginger-fresh', 1, 'tbsp'), [item('basmati-rice-dry', 1, 'cup', true)]],
  'high-protein-sausage-egg-sweet-potato-breakfast-casserole': [spice('salt'), spice('black-pepper'), spice('smoked-paprika'), spice('garlic-powder'), one('olive-oil', 1, 'tbsp')],
  'sheet-pan-fajita-chicken-thighs-peppers-sweet-potato': [[item('olive-oil', 3, 'tbsp'), item('avocado-oil', 3, 'tbsp')],
    spice('chili-powder'), spice('ground-cumin'), spice('garlic-powder'), spice('oregano-dried'), one('lime-juice', 2, 'tbsp')],
  'keto-caveman-beef-chuck-mushroom-cauliflower-braise': [one('beef-broth', 3, 'cup'), [...worcestershire, item('coconut-aminos', 2, 'tbsp')],
    garlic(5), spice('rosemary-dried'), spice('thyme-dried')],
  'sheet-pan-salmon-asparagus-brussels-potato-roast': [one('olive-oil', 3, 'tbsp'), one('lemon-fresh', 1, 'each'), one('dijon-mustard', 1, 'tbsp'), spice('garlic-powder'), spice('dill-dried')],
  'instant-pot-pork-carnitas-cabbage-peppers-skillet': [[item('chicken-broth', 1, 'cup'), item('orange-juice', 1, 'cup')],
    spice('ground-cumin'), spice('oregano-dried'), spice('smoked-paprika'), garlic(), spice('salt'), spice('black-pepper')],
};

export function selectRecipeStaples(id: string, availableIds: readonly string[], servings: number, dietary: DietaryConstraint[] = [], pinnedIds: readonly string[] = []): PantryRequirement[] {
  const available = new Set(availableIds);
  const pinned = new Set(pinnedIds);
  const glutenFree = dietary.includes('GLUTEN_FREE');
  return (RECIPE_STAPLES[id] ?? []).flatMap((choice) => {
    const eligible = choice.filter((requirement) => !glutenFree || !['all-purpose-flour', 'whole-wheat-flour', 'worcestershire-sauce'].includes(requirement.ingredientId));
    const selected = eligible.find((requirement) => pinned.has(requirement.ingredientId))
      ?? eligible.find((requirement) => available.has(requirement.ingredientId)) ?? eligible[0];
    return selected ? [{ ...selected, quantity: Number((selected.quantity * servings / 6).toFixed(4)) }] : [];
  });
}
