import type { RecipeProvider } from '../types';
import { createTerraRecipeProvider } from './openai';

export function isRecipeProviderConfigured(): boolean { return Boolean(process.env.OPENAI_API_KEY?.trim()); }

/** Server-only configuration. Request bodies can never supply provider credentials. */
export function createRecipeProvider(): RecipeProvider | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  return key ? createTerraRecipeProvider(key) : null;
}
