import { WholesaleClubBenchmark, WholesaleClubComparison } from '@/types/domain';

/**
 * Curated Wholesale Club (Costco Kirkland Signature & Sam's Club Member's Mark)
 * everyday bulk unit price baselines ($/lb or $/doz).
 *
 * Used by the Wholesale Club Price Normalizer (v1.2 Ticket #25) to objectively
 * verify when a supermarket weekly circular promotion beats buying in bulk at
 * Costco or Sam's Club.
 */
export const WHOLESALE_CLUB_BENCHMARKS: Record<string, WholesaleClubBenchmark> = {
  // ==========================================
  // 1. MEAT, POULTRY & SEAFOOD
  // ==========================================
  'chicken-thighs-boneless': {
    canonicalIngredientId: 'chicken-thighs-boneless',
    costcoPricePerUnit: 2.99,
    costcoPackDescription: 'Kirkland Vacuum Saddle Pack (~6.5 lb)',
    samsClubPricePerUnit: 2.88,
    samsClubPackDescription: "Member's Mark Family Tray (~5.5 lb)",
  },
  'chicken-thighs-bone-in': {
    canonicalIngredientId: 'chicken-thighs-bone-in',
    costcoPricePerUnit: 1.49,
    costcoPackDescription: 'Kirkland Saddle Pack (~6 lb)',
    samsClubPricePerUnit: 1.38,
    samsClubPackDescription: "Member's Mark Value Pack (~5.5 lb)",
  },
  'chicken-breast-boneless': {
    canonicalIngredientId: 'chicken-breast-boneless',
    costcoPricePerUnit: 3.29,
    costcoPackDescription: 'Kirkland Vacuum Pouches (~6.5 lb)',
    samsClubPricePerUnit: 2.98,
    samsClubPackDescription: "Member's Mark Fresh Tray (~5.5 lb)",
  },
  'pork-shoulder-butt': {
    canonicalIngredientId: 'pork-shoulder-butt',
    costcoPricePerUnit: 2.49,
    costcoPackDescription: 'Kirkland Swift Twin-Pack (~15 lb)',
    samsClubPricePerUnit: 2.28,
    samsClubPackDescription: 'Twin-Pack Boston Butt (~14 lb)',
  },
  'pork-loin-roast-chops': {
    canonicalIngredientId: 'pork-loin-roast-chops',
    costcoPricePerUnit: 2.39,
    costcoPackDescription: 'Whole Vacuum-Sealed Pork Loin (~9 lb)',
    samsClubPricePerUnit: 2.28,
    samsClubPackDescription: 'Whole Boneless Pork Loin (~8.5 lb)',
  },
  'beef-chuck-roast': {
    canonicalIngredientId: 'beef-chuck-roast',
    costcoPricePerUnit: 6.49,
    costcoPackDescription: 'USDA Choice 2-Pack Chuck Roasts (~6 lb)',
    samsClubPricePerUnit: 6.28,
    samsClubPackDescription: "Member's Mark USDA Choice Twin-Pack (~5.5 lb)",
  },
  'ground-beef-80-20': {
    canonicalIngredientId: 'ground-beef-80-20',
    costcoPricePerUnit: 4.49,
    costcoPackDescription: 'Kirkland 88/12 Bulk Pack (~6 lb)',
    samsClubPricePerUnit: 4.18,
    samsClubPackDescription: "Member's Mark 80/20 Chub (~5 lb)",
  },
  'italian-pork-sausage': {
    canonicalIngredientId: 'italian-pork-sausage',
    costcoPricePerUnit: 3.49,
    costcoPackDescription: 'Kirkland Mild Italian Links (3.5 lb)',
    samsClubPricePerUnit: 3.38,
    samsClubPackDescription: "Member's Mark Italian Sausage (3 lb)",
  },
  'ground-turkey': {
    canonicalIngredientId: 'ground-turkey',
    costcoPricePerUnit: 3.39,
    costcoPackDescription: 'Kirkland Organic/Lean 4-Pack (5 lb total)',
    samsClubPricePerUnit: 3.24,
    samsClubPackDescription: 'Jennie-O Bulk Twin-Pack (3 lb)',
  },
  'smoked-sausage-kielbasa': {
    canonicalIngredientId: 'smoked-sausage-kielbasa',
    costcoPricePerUnit: 3.79,
    costcoPackDescription: 'Twin-Pack Polish Kielbasa (3 lb)',
    samsClubPricePerUnit: 3.58,
    samsClubPackDescription: 'Hillshire Farm Bulk Rope (2.5 lb)',
  },
  'sirloin-strip-steak': {
    canonicalIngredientId: 'sirloin-strip-steak',
    costcoPricePerUnit: 10.99,
    costcoPackDescription: 'USDA Choice NY Strip 4-Pack (~4 lb)',
    samsClubPricePerUnit: 10.48,
    samsClubPackDescription: 'USDA Choice Strip Steak 4-Pack (~3.8 lb)',
  },
  'salmon-fillets': {
    canonicalIngredientId: 'salmon-fillets',
    costcoPricePerUnit: 10.99,
    costcoPackDescription: 'Kirkland Farmed Atlantic Fillet (~3 lb)',
    samsClubPricePerUnit: 10.48,
    samsClubPackDescription: "Member's Mark Atlantic Side (~2.75 lb)",
  },

  // ==========================================
  // 2. FRESH PRODUCE
  // ==========================================
  'potatoes-russet-gold': {
    canonicalIngredientId: 'potatoes-russet-gold',
    costcoPricePerUnit: 0.75,
    costcoPackDescription: '15 lb Bulk Russet / 10 lb Yukon Bag',
    samsClubPricePerUnit: 0.72,
    samsClubPackDescription: '10 lb Bulk Russet Potato Sack',
  },
  'sweet-potatoes': {
    canonicalIngredientId: 'sweet-potatoes',
    costcoPricePerUnit: 1.19,
    costcoPackDescription: '6 lb Mesh Bag Sweet Potatoes',
    samsClubPricePerUnit: 1.14,
    samsClubPackDescription: '5 lb Mesh Bag Sweet Potatoes',
  },
  'yellow-white-onions': {
    canonicalIngredientId: 'yellow-white-onions',
    costcoPricePerUnit: 0.89,
    costcoPackDescription: '10 lb Mesh Sack Yellow Onions',
    samsClubPricePerUnit: 0.85,
    samsClubPackDescription: '8 lb Bag Sweet/Yellow Onions',
  },
  'carrots-whole-baby': {
    canonicalIngredientId: 'carrots-whole-baby',
    costcoPricePerUnit: 0.99,
    costcoPackDescription: '5 lb Bag Baby/Whole Carrots',
    samsClubPricePerUnit: 0.94,
    samsClubPackDescription: '4 lb Bag Baby Carrots',
  },
  'poblano-anaheim-peppers': {
    canonicalIngredientId: 'poblano-anaheim-peppers',
    costcoPricePerUnit: 1.89,
    costcoPackDescription: '2 lb Roasting Chile Clamshell',
    samsClubPricePerUnit: 1.79,
    samsClubPackDescription: '2 lb Poblano / Jalapeño Bag',
  },
  'bell-peppers': {
    canonicalIngredientId: 'bell-peppers',
    costcoPricePerUnit: 2.79,
    costcoPackDescription: '6-Count Multi-Color Pack (~2.5 lb)',
    samsClubPricePerUnit: 2.68,
    samsClubPackDescription: '6-Count Rainbow Bell Peppers',
  },
  'butternut-acorn-squash': {
    canonicalIngredientId: 'butternut-acorn-squash',
    costcoPricePerUnit: 1.19,
    costcoPackDescription: 'Twin-Pack Whole Butternut (~5 lb)',
    samsClubPricePerUnit: 1.15,
    samsClubPackDescription: '2-Count Winter Squash Pack',
  },
  'green-cabbage': {
    canonicalIngredientId: 'green-cabbage',
    costcoPricePerUnit: 0.79,
    costcoPackDescription: 'Twin-Pack Green Cabbage (~4.5 lb)',
    samsClubPricePerUnit: 0.75,
    samsClubPackDescription: '2-Head Bulk Green Cabbage',
  },
  'broccoli-cauliflower': {
    canonicalIngredientId: 'broccoli-cauliflower',
    costcoPricePerUnit: 1.99,
    costcoPackDescription: '3 lb Washed Broccoli Florets Bag',
    samsClubPricePerUnit: 1.88,
    samsClubPackDescription: '2 lb Broccoli / Cauliflower Florets',
  },
  'mushrooms-cremini-white': {
    canonicalIngredientId: 'mushrooms-cremini-white',
    costcoPricePerUnit: 3.32,
    costcoPackDescription: '24 oz Baby Bella Clamshell ($4.99)',
    samsClubPricePerUnit: 3.19,
    samsClubPackDescription: '24 oz Cremini Pack ($4.78)',
  },
  'zucchini-yellow-squash': {
    canonicalIngredientId: 'zucchini-yellow-squash',
    costcoPricePerUnit: 1.49,
    costcoPackDescription: '3.5 lb Zucchini & Yellow Squash Tray',
    samsClubPricePerUnit: 1.44,
    samsClubPackDescription: '3 lb Italian Zucchini Bag',
  },
  'spinach-kale-greens': {
    canonicalIngredientId: 'spinach-kale-greens',
    costcoPricePerUnit: 3.19,
    costcoPackDescription: '16 oz Organic Baby Spinach Clamshell',
    samsClubPricePerUnit: 2.98,
    samsClubPackDescription: '16 oz Tender Baby Spinach Tub',
  },
  'tomatoes-roma-vine': {
    canonicalIngredientId: 'tomatoes-roma-vine',
    costcoPricePerUnit: 1.69,
    costcoPackDescription: '3.5 lb Tomatoes on the Vine / Roma Pack',
    samsClubPricePerUnit: 1.59,
    samsClubPackDescription: '3 lb Roma Tomato Clamshell',
  },
  'celery-stalks': {
    canonicalIngredientId: 'celery-stalks',
    costcoPricePerUnit: 1.39,
    costcoPackDescription: '4-Count Celery Hearts Bag (2.5 lb)',
    samsClubPricePerUnit: 1.32,
    samsClubPackDescription: 'Twin-Pack Celery Bunches',
  },
  'avocados-hass': {
    canonicalIngredientId: 'avocados-hass',
    costcoPricePerUnit: 3.49,
    costcoPackDescription: '6-Count Large Hass Bag (~2.2 lb)',
    samsClubPricePerUnit: 3.28,
    samsClubPackDescription: '6-Count Hass Avocado Bag',
  },
  'apples-honeycrisp-gala': {
    canonicalIngredientId: 'apples-honeycrisp-gala',
    costcoPricePerUnit: 1.99,
    costcoPackDescription: '5.5 lb Clamshell Gala/Honeycrisp',
    samsClubPricePerUnit: 1.89,
    samsClubPackDescription: '5 lb Bag Apples',
  },
  'asparagus-fresh': {
    canonicalIngredientId: 'asparagus-fresh',
    costcoPricePerUnit: 3.19,
    costcoPackDescription: '2.25 lb Fresh Asparagus Bundle',
    samsClubPricePerUnit: 2.99,
    samsClubPackDescription: '2 lb Asparagus Spears Bag',
  },
  'brussels-sprouts': {
    canonicalIngredientId: 'brussels-sprouts',
    costcoPricePerUnit: 2.49,
    costcoPackDescription: '2 lb Bag Fresh Brussels Sprouts',
    samsClubPricePerUnit: 2.39,
    samsClubPackDescription: '2 lb Mesh Bag Brussels Sprouts',
  },

  // ==========================================
  // 3. DAIRY & EGGS
  // ==========================================
  'shredded-block-cheese': {
    canonicalIngredientId: 'shredded-block-cheese',
    costcoPricePerUnit: 3.79,
    costcoPackDescription: 'Kirkland 5 lb Twin-Pack Shredded/Block',
    samsClubPricePerUnit: 3.68,
    samsClubPackDescription: "Member's Mark 5 lb Shredded Cheddar",
  },
  'large-eggs-dozen': {
    canonicalIngredientId: 'large-eggs-dozen',
    costcoPricePerUnit: 2.69,
    costcoPackDescription: 'Kirkland 24-Count (2 Dozen) Clamshell',
    samsClubPricePerUnit: 2.58,
    samsClubPackDescription: "Member's Mark 24-Count (2 Dozen)",
  },
  'cottage-cheese-sour-cream': {
    canonicalIngredientId: 'cottage-cheese-sour-cream',
    costcoPricePerUnit: 2.19,
    costcoPackDescription: '3 lb (48 oz) Daisy / Knudsen Tub',
    samsClubPricePerUnit: 2.09,
    samsClubPackDescription: '3 lb (48 oz) Cultured Dairy Tub',
  },
  'greek-yogurt-tub': {
    canonicalIngredientId: 'greek-yogurt-tub',
    costcoPricePerUnit: 2.29,
    costcoPackDescription: 'Kirkland 48 oz (3 lb) Organic Greek Yogurt',
    samsClubPricePerUnit: 2.18,
    samsClubPackDescription: "Member's Mark 40 oz Plain Greek Yogurt",
  },
  'butter-salted-unsalted': {
    canonicalIngredientId: 'butter-salted-unsalted',
    costcoPricePerUnit: 3.99,
    costcoPackDescription: 'Kirkland 4 lb (4x1 lb) Quarters Pack',
    samsClubPricePerUnit: 3.88,
    samsClubPackDescription: "Member's Mark 4 lb Quarters Pack",
  },
};

export function compareAgainstWholesaleClubs(
  canonicalIngredientId: string,
  supermarketPricePerUnit: number,
  standardUnit: 'lb' | 'doz'
): WholesaleClubComparison | undefined {
  const bench = WHOLESALE_CLUB_BENCHMARKS[canonicalIngredientId];
  if (!bench) return undefined;

  const isCostcoCheaperOrEqual =
    bench.costcoPricePerUnit <= bench.samsClubPricePerUnit;
  const bestClubName: 'Costco' | "Sam's Club" = isCostcoCheaperOrEqual
    ? 'Costco'
    : "Sam's Club";
  const bestClubPricePerUnit = isCostcoCheaperOrEqual
    ? bench.costcoPricePerUnit
    : bench.samsClubPricePerUnit;

  const savingsVsClubPerUnit = Number(
    (bestClubPricePerUnit - supermarketPricePerUnit).toFixed(2)
  );
  const savingsVsClubPct = Math.round(
    ((bestClubPricePerUnit - supermarketPricePerUnit) / bestClubPricePerUnit) *
      100
  );
  const beatsClubBulk = supermarketPricePerUnit < bestClubPricePerUnit - 0.02;

  const verdictLabel = beatsClubBulk
    ? `Beats ${bestClubName} Bulk by ${savingsVsClubPct}% ($${savingsVsClubPerUnit.toFixed(2)}/${standardUnit} cheaper)`
    : `${bestClubName} Bulk is $${Math.abs(savingsVsClubPerUnit).toFixed(2)}/${standardUnit} cheaper ($${bestClubPricePerUnit.toFixed(2)}/${standardUnit})`;

  return {
    costcoPricePerUnit: bench.costcoPricePerUnit,
    costcoPackDescription: bench.costcoPackDescription,
    samsClubPricePerUnit: bench.samsClubPricePerUnit,
    samsClubPackDescription: bench.samsClubPackDescription,
    bestClubName,
    bestClubPricePerUnit,
    beatsClubBulk,
    savingsVsClubPct,
    savingsVsClubPerUnit,
    verdictLabel,
  };
}
