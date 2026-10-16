export type CommodityCategory = 'PROTEIN' | 'PRODUCE' | 'DAIRY_EGGS';

export type StoreChain = 'KING_SOOPERS' | 'SAFEWAY';

export type DealType =
  | 'SHELF_OR_MEMBER'
  | 'DIGITAL_COUPON'
  | 'MULTI_BUY'
  | 'EVERYDAY_LOW';

export type WholesaleTrend =
  | 'CYCLE_FLOOR'      // Peak harvest / oversupply -> prices at floor
  | 'DROPPING_FAST'    // Wholesale dropping -> wait or expect bigger sales soon
  | 'STABLE'           // Normal seasonal range
  | 'SPIKING_BUY_NOW'; // Wholesale spiking -> buy local deal now before retail jumps

export type DishStyle =
  | 'STEW_BRAISE'
  | 'CHILI_SOUP'
  | 'CASSEROLE_BAKE'
  | 'CURRY_SKILLET';

export interface CanonicalIngredient {
  id: string;
  name: string;
  category: CommodityCategory;
  subcategory: string;
  standardUnit: 'lb' | 'doz';
  /** Average weight in lbs of 1 count/each/bunch/head when sold by count */
  avgEachWeightLb: number;
  /** Keywords used to match store circular & Kroger API titles */
  matchKeywords: string[];
  /** Keywords that disqualify a match (e.g., baby food, dog food, chips, candy) */
  excludeKeywords?: string[];
  /** Mountain Region 90-day baseline retail price per standardUnit ($/lb or $/doz) */
  mountainBaselinePerUnit: number;
  /** Typical non-sale shelf price at King Soopers / Safeway per standardUnit */
  typicalRegularPerUnit: number;
  /** Threshold above which this item is considered a "Splurge" item unless heavily discounted */
  splurgeThresholdPerUnit: number;
  /** Default USDA wholesale momentum signal & commentary for October/Autumn in Colorado */
  usdaSignal: {
    trend: WholesaleTrend;
    wholesaleChangePct: number;
    mountainAdFeaturePct: number; // % of Mountain region stores featuring item on ad
    note: string;
    usdaReportSlug: string;
  };
}

export interface StoreOffer {
  id: string;
  canonicalIngredientId: string;
  store: StoreChain;
  storeLocationLabel: string; // e.g., "King Soopers (Firestone / Longmont)"
  rawTitle: string;
  rawPriceText: string;
  salePrice: number;
  saleUnit: string;
  /** Normalized price in $/lb (or $/doz for eggs) for direct comparison */
  normalizedPricePerUnit: number;
  regularPricePerUnit: number;
  dealType: DealType;
  dealConditions?: string;
  validFrom: string;
  validTo: string;
  imageUrl?: string;
  source: 'FLIPP_LIVE' | 'KROGER_API' | 'CURATED_FALLBACK';
}

export interface ScoredCommodity {
  ingredient: CanonicalIngredient;
  bestOffer: StoreOffer;
  runnerUpOffer?: StoreOffer;
  kingSoopersOffer?: StoreOffer;
  safewayOffer?: StoreOffer;
  /** Overall Workhorse Value Score (0 - 100) weighted for absolute affordability + discount */
  valueScore: number;
  affordabilityScore: number;
  discountDepthScore: number;
  wholesaleBonusScore: number;
  /** % cheaper than Mountain Region baseline */
  discountVsBaselinePct: number;
  /** % cheaper than regular shelf price */
  discountVsRegularPct: number;
  /** True if item is a higher-cost cut/produce at >= 30% below baseline */
  isSplurgeAlert: boolean;
  /** Recommendation tag for weekend shopping */
  actionTag: 'STOCK_UP_ANCHOR' | 'GREAT_STAPLE' | 'SPLURGE_DEAL' | 'WAIT_NEXT_WEEK' | 'BUY_BEFORE_SPIKE';
}

export interface BlueprintSlot {
  slotKey: string;
  label: string;
  /** List of candidate CanonicalIngredient IDs that can fill this slot */
  candidateIngredientIds: string[];
  /** Quantity required in standard units (lbs or doz) for a 6-serving batch */
  quantityRequired: number;
  optional?: boolean;
}

export interface MealPrepBlueprint {
  id: string;
  title: string;
  subtitle: string;
  style: DishStyle;
  appliance: 'Slow Cooker' | 'Dutch Oven' | 'Instant Pot' | '9x13 Casserole Dish' | 'Deep Skillet';
  servings: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  reheatRating: 5 | 4;
  freezerFriendly: boolean;
  flavorProfile: string;
  slots: BlueprintSlot[];
  pantryStaples: string[];
  estimatedPantryCost: number;
  steps: string[];
  reheatTip: string;
}

export interface MatchedSlotIngredient {
  slotLabel: string;
  ingredientId: string;
  ingredientName: string;
  quantityUsed: number;
  unit: 'lb' | 'doz';
  store: StoreChain;
  rawDealText: string;
  dealType: DealType;
  dealConditions?: string;
  unitCost: number;
  slotCost: number;
  regularSlotCost: number;
  isUserPinned: boolean;
}

export interface RecommendedDish {
  id: string;
  title: string;
  subtitle: string;
  style: DishStyle;
  appliance: string;
  servings: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  freezerFriendly: boolean;
  flavorProfile: string;
  matchedIngredients: MatchedSlotIngredient[];
  pantryStaples: string[];
  estimatedPantryCost: number;
  totalBatchCost: number;
  regularBatchCost: number;
  totalBatchSavings: number;
  costPerServing: number;
  dishMatchScore: number;
  steps: string[];
  reheatTip: string;
  aiGenerated?: boolean;
}

export interface DashboardPayload {
  zipCode: string;
  cityLabel: string;
  adCycleLabel: string;
  lastUpdatedIso: string;
  dataSourcesActive: {
    flippLive: boolean;
    usdaLive: boolean;
    krogerLive: boolean;
    geminiConfigured: boolean;
  };
  commodities: ScoredCommodity[];
  splurgeAlerts: ScoredCommodity[];
  recommendedTrio: RecommendedDish[];
  allRankedDishes: RecommendedDish[];
  marketRadar: {
    buyBeforeSpike: ScoredCommodity[];
    holdOffDropping: {
      ingredient: CanonicalIngredient;
      currentLocalPrice: number;
      expectedSaleTarget: number;
      reason: string;
    }[];
  };
}
