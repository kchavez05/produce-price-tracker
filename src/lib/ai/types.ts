import type { CookingVesselArchetype, DietaryConstraint, MacroGoal, RecommendedDish, ScoredCommodity } from '@/types/domain';
import type { PantryRequirement } from '@/types/pantry';

/** The deliberately small JSON Schema subset used by the recipe contract. */
export interface RecipeJsonSchema {
  type: 'array' | 'object' | 'string' | 'number' | 'boolean';
  properties?: Record<string, RecipeJsonSchema>;
  items?: RecipeJsonSchema;
  required?: string[];
  enum?: string[];
}
export interface RecipeProviderRequest {
  system: string;
  prompt: string;
  schema: RecipeJsonSchema;
  maxOutputTokens: number;
  signal: AbortSignal;
}
/** SDK objects, credentials and model identifiers never cross this boundary. */
export interface RecipeProvider { generate(request: RecipeProviderRequest): Promise<{ text: string }> }
export interface RecipeGenerationContext {
  pinnedIngredientIds: string[];
  onHandIngredientIds: string[];
  targetServings: number;
  customPreference: string;
  zipCode: string;
  cityLabel: string;
  macroGoal: MacroGoal;
  dietaryConstraints: DietaryConstraint[];
  applianceFilter: CookingVesselArchetype;
  dashboard: { commodities: ScoredCommodity[] };
}
export type GeneratedDish = Pick<RecommendedDish,
  'id' | 'title' | 'subtitle' | 'style' | 'appliance' | 'servings' | 'prepTimeMinutes' | 'cookTimeMinutes' |
  'freezerFriendly' | 'flavorProfile' | 'macrosPerServing' | 'estimatedPantryCost' | 'pantryStaples' |
  'steps' | 'reheatTip' | 'matchedIngredients'> & { pantryRequirements: PantryRequirement[] };
