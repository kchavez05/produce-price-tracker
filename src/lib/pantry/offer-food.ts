/** Complete food terms shared by price admission and pickup-query normalization. */
export const OFFER_FOOD_TERMS: Readonly<Record<string, RegExp>> = {
  carrots: /\bcarrots?\b/i, broccoli: /\bbroccoli\b/i, cauliflower: /\bcauliflower\b/i,
  spinach: /\bspinach\b/i, kale: /\bkale\b/i, 'white-mushrooms': /\bwhite(?:\s+button)?\s+mushrooms?\b/i,
  'cremini-mushrooms': /\b(?:cremini|crimini|baby\s+bella)(?:\s+mushrooms?)?\b/i,
  tomatoes: /\btomato(?:es)?\b/i, tomatillos: /\btomatillos?\b/i,
};
const searchTerms: Readonly<Record<string, string>> = {
  carrots: 'carrots', broccoli: 'broccoli', cauliflower: 'cauliflower', spinach: 'spinach', kale: 'kale',
  'white-mushrooms': 'white mushrooms', 'cremini-mushrooms': 'cremini mushrooms', tomatoes: 'tomatoes', tomatillos: 'tomatillos',
};

/** Pick a food actually named in the title when trimming shared nouns would lose it. */
export function offerFoodSearchTerm(title: string): string | undefined {
  const matches = Object.entries(OFFER_FOOD_TERMS).flatMap(([id, pattern]) => {
    const match = pattern.exec(title);
    return match ? [{ id, index: match.index, text: match[0] }] : [];
  }).sort((a, b) => a.index - b.index);
  const first = matches[0];
  if (!first) return;
  return first.id === 'cremini-mushrooms' && /baby\s+bella/i.test(first.text) ? 'baby bella mushrooms' : searchTerms[first.id];
}
