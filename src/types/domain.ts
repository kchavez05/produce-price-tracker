export type CommodityCategory = 'PROTEIN' | 'PRODUCE' | 'DAIRY_EGGS';

export type StoreChain =
  | 'KING_SOOPERS'
  | 'SAFEWAY'
  | 'ALDI'
  | 'WALMART'
  | 'TARGET'
  | 'SPROUTS';

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

// =========================================================
// Milestone v1.2 Domain Types (Tickets #21 - #25)
// =========================================================

export type MacroGoal =
  | 'ANY'
  | 'HIGH_PROTEIN'      // 40g+ protein per serving
  | 'LOW_CARB_KETO'     // <= 24g net carbs per serving (swaps potatoes/beans for low-carb veg)
  | 'CALORIE_CONSCIOUS' // <= 460 kcal per serving
  | 'BALANCED_FAMILY';  // Balanced protein, carbs, and comfort appeal

export type DietaryConstraint =
  | 'GLUTEN_FREE'
  | 'DAIRY_FREE'
  | 'NUT_FREE'
  | 'VEGETARIAN_PESCATARIAN';

export type CookingVesselArchetype =
  | 'ANY'
  | 'SLOW_COOKER_INSTANT_POT'
  | 'DUTCH_OVEN_BRAISE'
  | 'CASSEROLE_SHEET_PAN'
  | 'BIG_BATCH_SKILLET';

export type CycleSignalStatus =
  | 'STOCK_UP_6WK_LOW'
  | 'FAIR_SALE_PRICE'
  | 'CYCLE_PEAK_WAIT';

export interface CycleSignalMetadata {
  status: CycleSignalStatus;
  badgeLabel: string;
  sixWeekLow: number;
  sixWeekHigh: number;
  sixWeekMedian: number;
  pctVsSixWeekLow: number;
  substitutionSuggestion?: {
    substituteIngredientId: string;
    substituteName: string;
    substitutePrice: number;
    substituteStore: StoreChain;
    savingsPerUnit: number;
    reason: string;
  };
}

export interface WholesaleClubBenchmark {
  canonicalIngredientId: string;
  costcoPricePerUnit: number;
  costcoPackDescription: string;
  samsClubPricePerUnit: number;
  samsClubPackDescription: string;
}

export interface WholesaleClubComparison {
  costcoPricePerUnit: number;
  costcoPackDescription: string;
  samsClubPricePerUnit: number;
  samsClubPackDescription: string;
  bestClubName: 'Costco' | "Sam's Club";
  bestClubPricePerUnit: number;
  beatsClubBulk: boolean;
  savingsVsClubPct: number;
  savingsVsClubPerUnit: number;
  verdictLabel: string;
}

export interface ArbitragePrompt {
  eligible: boolean;
  label: string; // e.g., "Buy 2: Prep 1, Freeze 1"
  recommendedFreezeQty: number;
  unit: 'lb' | 'doz';
  freezeCostBasis: number;
  futureWeekSavings: number;
}

export interface FreezerItem {
  id: string;
  canonicalIngredientId: string;
  ingredientName: string;
  category: CommodityCategory;
  quantityLbOrDoz: number;
  unit: 'lb' | 'doz';
  purchasePricePerUnit: number;
  regularPricePerUnit: number;
  totalCostBasis: number;
  estimatedSavings: number;
  store: StoreChain;
  storeBanner: string;
  purchasedAtIso: string;
  notes?: string;
}

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
  observedAtIso?: string;
  validFrom: string;
  validTo: string;
  imageUrl?: string;
  source: 'FLIPP_LIVE' | 'KROGER_API' | 'CURATED_FALLBACK';
}

export interface PriceHistoryPoint {
  weekStart: string; // e.g. "2026-09-09"
  label: string;     // e.g. "Sep 9"
  kingSoopersPrice: number;
  safewayPrice: number;
  usdaMountainAvg: number;
  bestLocalPrice: number;
}

export interface KingSoopersLocation {
  locationId: string;
  name: string;
  address: string;
  city: string;
  distanceMiles: number;
}

export interface ScoredCommodity {
  ingredient: CanonicalIngredient;
  bestOffer: StoreOffer;
  runnerUpOffer?: StoreOffer;
  kingSoopersOffer?: StoreOffer;
  safewayOffer?: StoreOffer;
  /** Multi-vendor offer map across all active stores (v1.1) */
  storeOffers?: Partial<Record<StoreChain, StoreOffer>>;
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
  /** 6-week historical price series from SQLite */
  priceHistory: PriceHistoryPoint[];
  /** Rolling 6-week local average best price from SQLite */
  sixWeekLocalAvg: number;
  /** Lowest price observed in SQLite over the last 6 weeks */
  sixWeekLow: number;
  /** Highest price observed in SQLite over the last 6 weeks (v1.2 Ticket #24) */
  sixWeekHigh?: number;
  /** Median price observed in SQLite over the last 6 weeks (v1.2 Ticket #24) */
  sixWeekMedian?: number;
  /** Predictive 6-week cycle signal & smart substitution metadata (v1.2 Ticket #24) */
  cycleSignal?: CycleSignalMetadata;
  /** Wholesale Club (Costco & Sam's Club) bulk unit comparison (v1.2 Ticket #25) */
  clubBenchmark?: WholesaleClubComparison;
  /** Multi-week Virtual Freezer Arbitrage prompt ("Buy 2: Prep 1, Freeze 1") (v1.2 Ticket #21) */
  arbitragePrompt?: ArbitragePrompt;
}

export interface NutritionMacros {
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
}

export interface BlueprintSlot {
  slotKey: string;
  label: string;
  /** List of candidate CanonicalIngredient IDs that can fill this slot */
  candidateIngredientIds: string[];
  /** Quantity required in standard units (lbs or doz) for a 6-serving batch */
  quantityRequired: number;
  optional?: boolean;
  /** Low-carb / Keto substitute ingredient IDs if LOW_CARB_KETO macro mode is selected */
  lowCarbCandidateIds?: string[];
  /** True if this slot contains dairy and should be omitted/swapped when DAIRY_FREE is active */
  isDairySlot?: boolean;
}

export interface MealPrepBlueprint {
  id: string;
  title: string;
  subtitle: string;
  style: DishStyle;
  appliance: 'Slow Cooker' | 'Dutch Oven' | 'Instant Pot' | '9x13 Casserole Dish' | 'Deep Skillet' | 'Sheet Pan';
  vesselArchetype?: Exclude<CookingVesselArchetype, 'ANY'>;
  servings: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  reheatRating: 5 | 4;
  freezerFriendly: boolean;
  flavorProfile: string;
  macrosPerServing: NutritionMacros;
  dietaryTags?: DietaryConstraint[];
  glutenFreeAdaptable?: boolean;
  dairyFreeAdaptable?: boolean;
  lowCarbAdaptable?: boolean;
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
  /** Out-of-pocket cost ($0.00 if marked On-Hand in Freezer/Pantry) */
  slotCost: number;
  regularSlotCost: number;
  isUserPinned: boolean;
  isOnHand?: boolean;
  fromVirtualFreezer?: boolean;
}

export interface RecommendedDish {
  id: string;
  title: string;
  subtitle: string;
  style: DishStyle;
  appliance: string;
  vesselArchetype?: Exclude<CookingVesselArchetype, 'ANY'>;
  servings: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  freezerFriendly: boolean;
  flavorProfile: string;
  macrosPerServing: NutritionMacros;
  dietaryTags?: DietaryConstraint[];
  macroBadges?: string[];
  adaptationNote?: string;
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
  savedInLibrary?: boolean;
  poweredByFreezerCount?: number;
}

export interface AggregatedShoppingItem {
  ingredientId: string;
  ingredientName: string;
  category: CommodityCategory;
  subcategory: string;
  totalQuantityNeeded: number;
  unit: 'lb' | 'doz';
  usedInDishes: { dishTitle: string; quantity: number }[];
  isOnHand: boolean;
  /** Optimal store offer (lowest price across both stores) */
  optimalStore: StoreChain;
  optimalUnitCost: number;
  optimalTotalCost: number;
  optimalRawDealText: string;
  optimalDealType: DealType;
  optimalDealConditions?: string;
  /** King Soopers specific pricing for 1-stop comparison */
  kingSoopersUnitCost: number;
  kingSoopersTotalCost: number;
  kingSoopersRawDealText: string;
  kingSoopersDealType: DealType;
  kingSoopersDealConditions?: string;
  /** Safeway specific pricing for 1-stop comparison */
  safewayUnitCost: number;
  safewayTotalCost: number;
  safewayRawDealText: string;
  safewayDealType: DealType;
  safewayDealConditions?: string;
  /** Regular shelf cost without promos */
  regularTotalCost: number;
  /** Dynamic per-store pricing map (v1.1) */
  storePricing?: Partial<
    Record<
      StoreChain,
      {
        unitCost: number;
        totalCost: number;
        rawDealText: string;
        dealType: DealType;
        dealConditions?: string;
      }
    >
  >;
}

export interface StoreTripComparison {
  optimalSplitTotal: number;
  kingSoopersOnlyTotal: number;
  safewayOnlyTotal: number;
  regularShelfTotal: number;
  estimatedPantryTotal: number;
  bestSingleStore: StoreChain;
  bestSingleStoreTotal: number;
  extraSavingsFromSplitting: number;
  recommendationHeadline: string;
  recommendationDetail: string;
  /** Store totals across all active vendors (v1.1) */
  storeTotals?: Partial<Record<StoreChain, number>>;
  /** Ranked leaderboard of all 1-stop options (v1.1) */
  singleStoreRankings?: {
    store: StoreChain;
    storeName: string;
    total: number;
    diffFromBest: number;
    isBest: boolean;
  }[];
  /** Optimal 2-store split pairing (v1.1) */
  bestTwoStoreSplit?: {
    stores: [StoreChain, StoreChain];
    storeNames: [string, string];
    total: number;
    savingsVsBestSingle: number;
    splitSummary: string;
  };
}

export interface AvailableStoreInfo {
  id: StoreChain;
  name: string;
  bannerName: string;
  brandColor: string;
  accentBg: string;
  badgeTextColor: string;
  hasDigitalCoupons: boolean;
  couponAppLabel?: string;
  isEverydayLowPrice: boolean;
  hasActiveOffers: boolean;
}

export interface DashboardPayload {
  zipCode: string;
  cityLabel: string;
  adCycleLabel: string;
  /** Response generation time, not the age of source prices. */
  lastUpdatedIso: string;
  freshness?: {
    attemptedAtIso: string;
    liveRetrievedAtIso: string | null;
    usableLiveOffers: number;
    estimatedBestPrices: number;
    sourceOfferCounts: { flipp: number; kroger: number };
  };
  dataSourcesActive: {
    flippLive: boolean;
    usdaLive: boolean;
    krogerLive: boolean;
    geminiConfigured: boolean;
    sqlitePersisted: boolean;
    supabaseConfigured?: boolean;
  };
  sqliteStats: {
    dbPath: string;
    totalHistoricalOfferRows: number;
    totalUsdaSnapshotRows: number;
    trackedWeeksCount: number;
  };
  nearbyKingSoopersLocations: KingSoopersLocation[];
  selectedKingSoopersLocationId: string;
  availableStores?: AvailableStoreInfo[];
  activeStores?: StoreChain[];
  freezerInventory?: FreezerItem[];
  commodities: ScoredCommodity[];
  splurgeAlerts: ScoredCommodity[];
  recommendedTrio: RecommendedDish[];
  allRankedDishes: RecommendedDish[];
  marketRadar: {
    buyBeforeSpike: ScoredCommodity[];
    stockUpCycleLows?: ScoredCommodity[];
    cyclePeakWaitList?: ScoredCommodity[];
    holdOffDropping: {
      ingredient: CanonicalIngredient;
      currentLocalPrice: number;
      expectedSaleTarget: number;
      reason: string;
    }[];
  };
}

export interface SmartPushNotificationPayload {
  id: string;
  triggerType: 'WEDNESDAY_AD_DROP' | 'SPLURGE_ALERT' | 'FRIDAY_PREP_DIGEST';
  scheduledWindowLabel: string;
  title: string;
  subtitle: string;
  body: string;
  deepLinkPath: string;
  badgeText: string;
  priority: 'high' | 'normal';
}

export interface FridayWeekendDigest {
  generatedAtIso: string;
  adCycleLabel: string;
  zipCode: string;
  topValueCommodities: {
    name: string;
    bestPrice: number;
    unit: string;
    store: StoreChain;
    discountVsBaselinePct: number;
    dealType: DealType;
    dealConditions?: string;
  }[];
  splurgeAlerts: {
    name: string;
    bestPrice: number;
    unit: string;
    store: StoreChain;
    discountVsBaselinePct: number;
    rawDealText: string;
  }[];
  recommendedWeekendTrio: {
    title: string;
    prepStyle: string;
    cookware: string;
    servings: number;
    totalBatchCost: number;
    costPerServing: number;
    totalBatchSavings: number;
    macrosPerServing: NutritionMacros;
  }[];
  tripOptimization: StoreTripComparison;
  digitalCouponChecklistCount: number;
  markdownDigest: string;
}

export interface SyncRunLogEntry {
  id: string;
  cycle: string;
  syncedOffersCount: number;
  flippLive: boolean;
  krogerLive: boolean;
  usdaLive: boolean;
  topDishTitle: string;
  optimalBasketTotal: number;
  createdAt: string;
}

export interface WeeklySyncCronResult {
  refreshStatus?: 'live' | 'estimates_only';
  auditStorage?: 'cloud' | 'local' | 'unavailable' | 'preview';
  ok: boolean;
  cycle: string;
  executedAtIso: string;
  syncedOffersCount: number;
  dataSources: {
    flippLive: boolean;
    krogerLive: boolean;
    usdaLive: boolean;
  };
  smartPushNotifications: SmartPushNotificationPayload[];
  fridayWeekendDigest: FridayWeekendDigest;
  recentSyncRuns: SyncRunLogEntry[];
}

// =========================================================
// Milestone v1.3 Domain Types (Tickets #26 - #31)
// =========================================================

export type AuthProviderType = 'google' | 'apple';

export type CloudStorageMode = 'SUPABASE_RLS' | 'SQLITE_LOCAL_FALLBACK';

export type SyncStatus =
  | 'IDLE'
  | 'SYNCING'
  | 'SYNCED'
  | 'OFFLINE_QUEUED'
  | 'ERROR';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  provider: AuthProviderType;
  createdAtIso: string;
  updatedAtIso: string;
  isCloudBacked: boolean;
}

export interface UserPreferences {
  userId: string;
  defaultZip: string;
  favoriteStoreIds: StoreChain[];
  macroGoal: MacroGoal;
  dietaryConstraints: DietaryConstraint[];
  vesselArchetype: CookingVesselArchetype;
  targetServings: 4 | 6 | 8;
  pinnedIngredientIds: string[];
  onHandIngredientIds: string[];
  updatedAtIso: string;
}

export interface UserSyncPayload {
  authenticated: boolean;
  storageMode: CloudStorageMode;
  supabaseConfigured: boolean;
  profile: UserProfile | null;
  preferences: UserPreferences | null;
  freezerItems: FreezerItem[];
  savedRecipes: RecommendedDish[];
  syncedAtIso: string;
}

export interface UserDataExportArchive {
  schemaVersion: '1.3.0';
  exportedAtIso: string;
  application: 'PantryBot (pantrybot.dev)';
  piiPolicy: 'Strict Minimization (id, email, display_name, and user-configured grocery preferences only)';
  profile: UserProfile;
  preferences: UserPreferences;
  virtualFreezerInventory: FreezerItem[];
  savedMealPrepRecipes: RecommendedDish[];
}

