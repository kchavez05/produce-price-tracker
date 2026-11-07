/** Remove only known leading brands; a brand never supplies food/state evidence. */
export function stripKnownOfferBrand(title: string): string {
  return title.replace(/[®™]/g, '').trim().replace(/^(?:kroger|signature(?:\s+farms)?|simple\s+truth|aldi(?:\s+fresh)?|great\s+value|sprouts(?:\s+farm\s+fresh)?|good\s*&\s*gather|johnsonville|hillshire\s+farm|eckrich)\b\s*/i, '');
}
export function hasOfferAlternatives(title: string): boolean {
  return /\bor\b|\band\b|&|\+|\//i.test(stripKnownOfferBrand(title).replace(/\b\d+\s*\/\s*\d+\b/g, ''));
}
