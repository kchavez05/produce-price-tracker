/** Ownership comes from the verified session or private local guest context. */
export type PantryOwner = `account:${string}` | `guest:${string}`;
export type PantryLocation = 'PANTRY' | 'FRIDGE' | 'FREEZER';

export interface PantryEntryInput {
  ingredientId?: string;
  displayName: string;
  available: boolean;
  location?: PantryLocation;
  quantity?: number;
  unit?: string;
  /** Calendar date, YYYY-MM-DD; never converted to a timestamp. */
  useByDate?: string;
}

export interface PantryEntry extends PantryEntryInput {
  id: string;
  /** Zero is a local draft; the persistence layer assigns positive revisions. */
  revision: number;
  updatedAtIso: string;
  /** Retain tombstones for conflict detection and to prevent resurrection. */
  deletedAtIso?: string;
}

export interface PantryCatalogIngredient {
  id: string;
  name: string;
  aliases: readonly string[];
  /** Only reviewed, exact identity links; circular matching keywords are unsafe here. */
  recipeIngredientId?: string;
  staticPrice?: { unit: string; usdPerUnit: number };
}

export interface PantryRequirement {
  ingredientId: string;
  /** Used only for retained, unmapped recipe text; never implies an identity match. */
  displayName?: string;
  quantity: number;
  unit: string;
  optional?: boolean;
}

export interface PantryShoppingNeed extends PantryRequirement {
  ingredientName: string;
  estimatedCost: number | null;
  priceBasis: 'STATIC_ESTIMATE' | 'UNPRICED';
}

export interface PantryCoverage {
  requiredCount: number;
  availableRequiredCount: number;
  optionalCount: number;
  availableOptionalCount: number;
}

/** A future endpoint must take ownership from its session, never this body. */
export type PantryMutation = {
  mutationId: string;
  entryId: string;
  expectedRevision: number;
} & ({ operation: 'put'; entry: PantryEntryInput } | { operation: 'delete' });

export type PantryMutationResult =
  | { status: 'applied'; mutationId: string; entry: PantryEntry }
  | { status: 'conflict'; mutationId: string; reason: 'revision' | 'identity'; current: PantryEntry | null };
