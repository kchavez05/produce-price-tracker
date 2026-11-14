import type { RecipeProvider } from '../types';
import { createGeminiRecipeProvider } from './gemini';

/** Transitional key override is retired by #751; keep it out of the shared service. */
export function createRecipeProvider(legacyKey = ''): RecipeProvider | null {
  const key = legacyKey.trim() || process.env.GEMINI_API_KEY?.trim();
  return key ? createGeminiRecipeProvider(key) : null;
}
