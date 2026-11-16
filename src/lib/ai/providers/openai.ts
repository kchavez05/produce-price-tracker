import { AiGenerationError } from '../errors';
import type { RecipeJsonSchema, RecipeProvider } from '../types';
import type { AiUsageBound } from '../usage';

export const TERRA_MODEL = 'gpt-6.1-terra';
export const LUNA_MODEL = 'gpt-6-luna';
// Versioned registrations are accepted separately in the durable ledger. Including
// cache-write ceilings is conservative; no discount or refund is assumed.
export const TERRA_BOUND: AiUsageBound = Object.freeze({ adapterKey: 'openai-terra-32k-6k-v1', maximumCostMicroUsd: 70_000 });
export const SPEECH_BOUND: AiUsageBound = Object.freeze({ adapterKey: 'openai-transcribe-luna-16k-2048-v1', maximumCostMicroUsd: 7_524 });
export type OpenAiTransport = typeof fetch;
type JsonObject = Record<string, unknown>;
const invalid = (): never => { throw new AiGenerationError('INVALID_RESPONSE'); };
export function asObject(value: unknown): JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as JsonObject : invalid();
}
/** A bounded reader prevents a provider/proxy response from consuming unbounded memory. */
export async function readOpenAiJson(response: Response, maximumBytes = 1_500_000): Promise<JsonObject> {
  if (!response.ok) {
    await response.body?.cancel();
    throw new AiGenerationError('PROVIDER_UNAVAILABLE');
  }
  const reader = response.body?.getReader();
  if (!reader) return invalid();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maximumBytes) { await reader.cancel(); return invalid(); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try { return asObject(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes))); }
  catch { return invalid(); }
}
/** All properties required, no extra keys: OpenAI's strict schema subset. */
export function strictRecipeSchema(schema: RecipeJsonSchema): JsonObject {
  return { type: schema.type, ...(schema.enum ? { enum: schema.enum } : {}),
    ...(schema.items ? { items: strictRecipeSchema(schema.items) } : {}),
    ...(schema.properties ? { properties: Object.fromEntries(Object.entries(schema.properties).map(([key, child]) => [key, strictRecipeSchema(child)])),
      required: Object.keys(schema.properties), additionalProperties: false } : {}) };
}
interface TextInput {
  model: typeof TERRA_MODEL | typeof LUNA_MODEL;
  system: string;
  input: string;
  schema: JsonObject;
  maxInputTokens: number;
  maxOutputTokens: number;
  signal: AbortSignal;
}
/** One token-count preflight and one generation; never redirects, retries or failover. */
export async function openAiStructuredText(apiKey: string, request: TextInput, transport: OpenAiTransport = fetch): Promise<string> {
  try {
    request.signal.throwIfAborted();
    const body = { model: request.model, instructions: request.system, input: request.input,
      tools: [], reasoning: { effort: 'low' },
      text: { format: { type: 'json_schema', name: 'pantrybot', strict: true, schema: request.schema } } };
    if (new TextEncoder().encode(JSON.stringify(body)).length > 200_000) return invalid();
    const post = (path: string, payload: JsonObject) => transport(`https://api.openai.com/v1/${path}`, {
      method: 'POST', headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify(payload), signal: request.signal, redirect: 'error', cache: 'no-store',
    });
    const count = await readOpenAiJson(await post('responses/input_tokens', body), 16_384);
    if (typeof count.input_tokens !== 'number' || !Number.isSafeInteger(count.input_tokens) || count.input_tokens <= 0 || count.input_tokens > request.maxInputTokens) return invalid();
    request.signal.throwIfAborted();
    const result = await readOpenAiJson(await post('responses', { ...body, store: false,
      // Pin the cache-write rate assumed by both durable cost bounds. This is a
      // generation billing control; the complete token-bearing body is counted above.
      prompt_cache_options: { ttl: '30m' },
      background: false, max_output_tokens: request.maxOutputTokens, service_tier: 'default' }));
    const expectedModel = typeof result.model === 'string' && (result.model === request.model ||
      (result.model.startsWith(`${request.model}-`) && /^\d{4}-\d{2}-\d{2}$/.test(result.model.slice(request.model.length + 1))));
    if (result.status !== 'completed' || (result.service_tier !== undefined && result.service_tier !== 'default') || !expectedModel) return invalid();
    const usage = asObject(result.usage);
    if (!Number.isSafeInteger(usage.input_tokens) || Number(usage.input_tokens) < 0 || Number(usage.input_tokens) > request.maxInputTokens ||
      !Number.isSafeInteger(usage.output_tokens) || Number(usage.output_tokens) < 0 || Number(usage.output_tokens) > request.maxOutputTokens) return invalid();
    if (!Array.isArray(result.output)) return invalid();
    const texts: string[] = [];
    for (const value of result.output) {
      const item = asObject(value);
      if (item.type === 'reasoning') continue;
      if (item.type !== 'message' || item.role !== 'assistant' || item.status !== 'completed' || !Array.isArray(item.content)) return invalid();
      for (const part of item.content) {
        const content = asObject(part);
        if (content.type !== 'output_text' || typeof content.text !== 'string') return invalid();
        texts.push(content.text);
      }
    }
    const text = texts.join('');
    if (!text.trim() || text.length > 256_000) return invalid();
    request.signal.throwIfAborted();
    return text;
  } catch (error: unknown) {
    if (error instanceof AiGenerationError) throw error;
    throw new AiGenerationError(request.signal.aborted ? 'TIMEOUT' : 'PROVIDER_UNAVAILABLE');
  }
}
export function createTerraRecipeProvider(apiKey: string, transport: OpenAiTransport = fetch): RecipeProvider {
  return { usageBound: TERRA_BOUND, async generate(request) {
    if (!Number.isSafeInteger(request.maxOutputTokens) || request.maxOutputTokens < 1 || request.maxOutputTokens > 6_000) return invalid();
    const text = await openAiStructuredText(apiKey, {
      model: TERRA_MODEL, system: `${request.system} Return an object with a dishes array matching the supplied schema.`,
      input: request.prompt, schema: { type: 'object', properties: { dishes: strictRecipeSchema(request.schema) },
        required: ['dishes'], additionalProperties: false }, maxInputTokens: 32_000,
      maxOutputTokens: request.maxOutputTokens, signal: request.signal,
    }, transport);
    let result: JsonObject;
    try { result = asObject(JSON.parse(text)); } catch { return invalid(); }
    if (Object.keys(result).length !== 1 || !Array.isArray(result.dishes)) return invalid();
    return { text: JSON.stringify(result.dishes) };
  } };
}
