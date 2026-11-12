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
  /** Reviewed recipe quantity basis; missing saved metadata must not imply net contents. */
  quantityBasisVersion?: string;
}

export interface PantryPriceDetail extends PantryRequirement {
  requirementKey: string;
  /** Authoritative integer allocation; never reconstruct cents from displayed dollars. */
  allocatedCents: number | null;
  priceBasis: 'OBSERVED' | 'STATIC_ESTIMATE' | 'UNPRICED' | 'ON_HAND' | 'OPTIONAL';
  estimatedCost: number | null;
  observation?: {
    source: 'KROGER_PRODUCTION'; quoteId: string; productId: string; itemId: string; locationId: string;
    observedAtIso: string; effectiveAtIso?: string; expiresAtIso?: string;
    packagePrice: number; packageAmount: string; packageUnit: string; sourceSizeLabel: string;
    ruleVersion: string; stockUnconfirmed: boolean;
  };
}

export interface PantryPricing {
  rows: PantryPriceDetail[];
  total: number;
  includesStaticEstimates: boolean;
  incompleteEstimate: boolean;
  evaluatedAtIso: string;
  marketId: string;
  selectedLocationIds: string[];
}

export interface PantryShoppingNeed extends PantryRequirement {
  ingredientName: string;
  estimatedCost: number | null;
  priceBasis: 'OBSERVED' | 'STATIC_ESTIMATE' | 'UNPRICED' | 'MIXED';
  /** Authoritative recipe allocations, retained when quantities are grouped for display. */
  priceDetails?: PantryPriceDetail[];
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

/** An explicitly reviewed operation may retain its identity/revision across confirmation retries. */
export interface PantrySaveIntent { mutationId: string; expectedRevision: number }
