import { PantryCatalogIngredient } from './pantry';

export interface CookingIngredient extends PantryCatalogIngredient {
  lifecycle?: 'active' | 'retired';
  familyId?: string;
  form?: string;
  variety?: string;
  /** Variants remain reachable by specific queries or optional choices. */
  searchVisibility?: 'primary' | 'variant' | 'specific';
  parentIngredientId?: string;
}
export interface CatalogSourceRecord {
  key: string;
  fingerprint: string;
  disposition: 'candidate' | 'excluded' | 'quarantined';
  dataType: string;
  fdcId: string;
  ndbNumber: string | null;
  description: string;
  publicationDate: string;
  categoryId: string;
  categoryName: string | null;
  footnote: string | null;
}
export type CatalogSourceLink = { ingredientId: string; key: string; fingerprint: string } & (
  | { purpose: 'identity' }
  | { purpose: 'general-reference'; familyId: string }
);
export interface CatalogCompatibility { from: string; to: string }
export interface CatalogDecision {
  id: string;
  revision: number;
  rulesVersion: number;
  status: 'proposed' | 'approved';
  action: 'upsert' | 'exclude' | 'defer' | 'compatibility' | 'remove-compatibility';
  sourceKind: 'USDA' | 'CURATED';
  sourceRefs: { key: string; fingerprint: string }[];
  /** An explicitly reviewed shared record that does not establish the cooking form. */
  sourcePurpose?: 'general-reference';
  rationale: string;
  ingredient?: CookingIngredient;
  compatibility?: CatalogCompatibility;
  exception?: { sourceReleaseDate: string; owner: string; reviewBy: string };
  review?: { by: string; date: string; payloadSha256: string };
}
export interface CatalogLedger { formatVersion: 1; decisions: CatalogDecision[] }
export interface CatalogArtifact {
  formatVersion: 1;
  catalogVersion: string;
  contentHash: string;
  ingredients: CookingIngredient[];
  compatibility: CatalogCompatibility[];
  sourceLinks: CatalogSourceLink[];
  /** Revision identities and approved payloads are retained across runs. */
  decisions: { id: string; revision: number; payloadSha256: string }[];
}

/** A reviewed alternative for one candidate in one recipe slot, never an inventory ID. */
export interface ScopedRecipeUse {
  id: string;
  recipeId: string;
  slotKey: string;
  slotLabel: string;
  marketIngredientId: string;
  marketIngredientName: string;
  displayName: string;
  pantryIngredientIds: string[];
  offerFoods: string[];
}

/** A possible food in a market group; never an ownership or recipe-compatibility edge. */
export interface MarketCounterpart { marketIngredientId: string; pantryIngredientId: string }
