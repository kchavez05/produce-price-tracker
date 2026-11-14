import type { RecipeProvider } from '../types';
import { createGeminiRecipeProvider } from './gemini';

export function isRecipeProviderConfigured(): boolean { return Boolean(process.env.GEMINI_API_KEY?.trim()); }

/** Server-only configuration. Request bodies can never supply provider credentials. */
export function createRecipeProvider(): RecipeProvider | null {
  const key = process.env.GEMINI_API_KEY?.trim();
  return key ? createGeminiRecipeProvider(key) : null;
}
