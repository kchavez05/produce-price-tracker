import { GoogleGenAI, Type, type Schema } from '@google/genai';
import type { RecipeJsonSchema, RecipeProvider } from '../types';

const types = { array: Type.ARRAY, object: Type.OBJECT, string: Type.STRING, number: Type.NUMBER, boolean: Type.BOOLEAN };
function nativeSchema(schema: RecipeJsonSchema): Schema {
  return { type: types[schema.type], ...(schema.enum ? { enum: schema.enum } : {}),
    ...(schema.required ? { required: schema.required } : {}),
    ...(schema.items ? { items: nativeSchema(schema.items) } : {}),
    ...(schema.properties ? { properties: Object.fromEntries(Object.entries(schema.properties).map(([name, child]) => [name, nativeSchema(child)])) } : {}) };
}
/** Compatibility adapter only. The #731 decision will choose the production adapter/model. */
export function createGeminiRecipeProvider(apiKey: string): RecipeProvider {
  const ai = new GoogleGenAI({ apiKey, apiVersion: 'v1beta', httpOptions: { retryOptions: { attempts: 1 } } });
  return { async generate(request) {
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: request.prompt,
      config: { systemInstruction: request.system, responseMimeType: 'application/json', responseSchema: nativeSchema(request.schema),
        maxOutputTokens: request.maxOutputTokens, abortSignal: request.signal } });
    return { text: response.text ?? '' };
  } };
}
