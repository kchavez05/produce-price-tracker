import { CANONICAL_INGREDIENTS } from '@/data/canonical-ingredients';
import crops from '../../../config/usda/3324.json';
import beef from '../../../config/usda/3228.json';
import pork from '../../../config/usda/2868.json';
import poultry from '../../../config/usda/2756.json';
import dairy from '../../../config/usda/2995.json';
const definitions = [crops, beef, pork, poultry, dairy];
/** Editorial grouping policy: recipe-role alternatives, not equivalent market series. */
const rationale: Record<string, string> = {
  'yellow-white-onions':
    'Yellow and white onions share an aromatic role in our cooked meal-prep recipes. Sweet, red, and green onions are excluded. Packages need not be 3 lb; prices are compared per pound.',
  'chicken-thighs-bone-in':
    'Thighs and drumsticks provide bone-in dark-meat options for braises. Bone and yield differ; this group is not equivalent to boneless meat.',
  'pork-loin-roast-chops':
    'Loin roasts and center-cut chops provide lean pork options. Thickness and preparation time differ.',
  'beef-chuck-roast':
    'Chuck, pot-roast and stew-meat offers fill a slow-cooked beef role. Cut and trimming can change yield.',
  'ground-beef-80-20':
    '80/20 and 85/15 ground beef fill the ground-beef role; fat percentages and prices can differ.',
  'italian-pork-sausage':
    'These ground or seasoned pork options fill a savory ground-protein role. Seasoning and heat differ; they are not identical products.',
  'ground-turkey':
    '85/15 and 93/7 turkey fill the ground-turkey role. Fat content and cooking moisture differ.',
  'smoked-sausage-kielbasa':
    'Smoked sausages fill a cooked sausage role. Flavor, ingredients, and package sizes differ.',
  'sirloin-strip-steak':
    'Sirloin and strip fill the steak role; these are distinct cuts with different tenderness and market prices.',
  'salmon-fillets':
    'Salmon varieties fill the fish-fillet role. Farmed and wild products have different source markets and prices.',
  'potatoes-russet-gold':
    'Russet and gold potatoes fill the potato starch role. Texture differs; package sizes are normalized per pound.',
  'sweet-potatoes':
    'Store titles sometimes use yams for sweet potatoes. These labels are matched for recipes; the grouping is not a botanical classification.',
  'carrots-whole-baby':
    'Whole and baby carrots fill the carrot role. Processing, convenience, and package prices differ.',
  'poblano-anaheim-peppers':
    'These peppers fill a chile role. Heat varies substantially; recipe quantities may require adjustment.',
  'bell-peppers':
    'Bell pepper colors fill the sweet-pepper role. Each color remains distinct in source records.',
  'butternut-acorn-squash':
    'Winter squash varieties fill a roasting or braising role. Edible yield and preparation differ.',
  'broccoli-cauliflower':
    'These vegetables fill a cruciferous vegetable role. They remain distinct commodities in USDA records.',
  'mushrooms-cremini-white':
    'Cremini and white mushrooms fill the mushroom role. Size and flavor differ.',
  'zucchini-yellow-squash':
    'These summer squashes fill a quick-cooking vegetable role; their source varieties remain separate.',
  'spinach-kale-greens':
    'Cooking greens fill the leafy-green role. Cooking time, texture, and yield differ.',
  'tomatoes-roma-vine':
    'Tomatoes and tomatillos fill specific sauce or salsa recipe slots. Acidity and flavor differ; they are not universally interchangeable.',
  'apples-honeycrisp-gala':
    'Apple varieties fill the apple role. Sweetness, texture, and typical prices differ.',
  'shredded-block-cheese':
    'These cheeses fill melting or topping roles. Flavor, preparation, and package weights differ.',
  'cottage-cheese-sour-cream':
    'These dairy products fill recipe-specific creamy dairy slots. Their nutrition and use differ; they are not equivalent market products.',
  'greek-yogurt-tub':
    'Plain and vanilla Greek yogurt share a tub-yogurt group. Vanilla is unsuitable for some savory substitutions.',
  'butter-salted-unsalted':
    'Salted and unsalted butter fill the butter role. Adjust recipe salt accordingly.',
};
export function explorerCatalog() {
  return CANONICAL_INGREDIENTS.map((ingredient) => ({
    id: ingredient.id,
    name: ingredient.name,
    category: ingredient.category,
    subcategory: ingredient.subcategory,
    unit: ingredient.standardUnit,
    keywords: ingredient.matchKeywords,
    exclusions: ingredient.excludeKeywords || [],
    rationale:
      rationale[ingredient.id] ||
      'Single named ingredient group. Matching rules below define accepted offer titles; recipe suitability depends on preparation.',
    rationaleVersion: 'recipe-role-1.5.1',
    limitation:
      'A PantryBot recipe group is not a USDA classification or a claim of identical price, nutrition, or yield. The benchmark covers only the exact source dimensions below; unmatched varieties may have no direct benchmark.',
    fallback: ingredient.mountainBaselinePerUnit,
    fallbackOrigin:
      'Static estimate; original empirical source not documented.',
    mappings: definitions.flatMap((definition) =>
      definition.config.mappings
        .filter((m) => m.ingredientId === ingredient.id)
        .map((mapping) => ({
          slug: definition.slug,
          title: definition.title,
          version: definition.config.adapterVersion,
          dimensions: mapping.equals,
          fields: definition.config.fields,
          units: definition.config.units,
        }))
    ),
  }));
}
