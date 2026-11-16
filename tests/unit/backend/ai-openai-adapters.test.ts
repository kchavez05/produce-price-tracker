import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMockCommodity, createMockDish, createMockIngredient } from 'tests/test-utils';
import { generateMealPlan } from '@/lib/ai/meal-plan';
import { RECIPE_OUTPUT_SCHEMA } from '@/lib/ai/recipe-schema';
import { createRecipeProvider, isRecipeProviderConfigured } from '@/lib/ai/providers';
import { createTerraRecipeProvider, TERRA_MODEL, LUNA_MODEL, TERRA_BOUND, SPEECH_BOUND, readOpenAiJson } from '@/lib/ai/providers/openai';
import { createSpeechPipeline, isSpeechPipelineConfigured } from '@/lib/ai/speech/providers';
import { createOpenAiSpeechPipeline } from '@/lib/ai/speech/openai';
import { generateSpeechDraft } from '@/lib/ai/speech/service';
import type { RecipeGenerationContext } from '@/lib/ai/types';

const json = (value: unknown) => new Response(JSON.stringify(value));
const completed = (text: string, model = TERRA_MODEL) => json({ model, status: 'completed', service_tier: 'default',
  usage: { input_tokens: 400, output_tokens: 1500 }, output: [
    { type: 'reasoning', summary: [] },
    { type: 'message', role: 'assistant', status: 'completed', content: [{ type: 'output_text', text }] },
  ] });
const request = () => ({ system: 'Dietary rules are mandatory', prompt: 'synthetic context', schema: RECIPE_OUTPUT_SCHEMA,
  maxOutputTokens: 6000, signal: new AbortController().signal });
function wav() {
  const bytes = new Uint8Array(32044), view = new DataView(bytes.buffer);
  for (const [offset, tag] of [[0, 'RIFF'], [8, 'WAVE'], [12, 'fmt '], [36, 'data']] as const) {
    bytes.set(new TextEncoder().encode(tag), offset);
  }
  view.setUint32(4, bytes.length - 8, true); view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, 16000, true);
  view.setUint32(28, 32000, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  view.setUint32(40, bytes.length - 44, true); return bytes;
}
afterEach(() => vi.unstubAllEnvs());
describe('selected production OpenAI adapters without live API calls', () => {
  it('selects only accepted providers; legacy Google keys never enable paid dispatch', () => {
    vi.stubEnv('OPENAI_API_KEY', ''); vi.stubEnv('GEMINI_API_KEY', 'legacy-test');
    expect(createRecipeProvider()).toBeNull(); expect(createSpeechPipeline()).toBeNull();
    expect(isRecipeProviderConfigured()).toBe(false); expect(isSpeechPipelineConfigured()).toBe(false);
    vi.stubEnv('OPENAI_API_KEY', 'server-test');
    expect(createRecipeProvider()?.usageBound).toEqual(TERRA_BOUND);
    expect(createSpeechPipeline()?.usageBound).toEqual(SPEECH_BOUND);
  });
  it('runs Terra output through actual app validation, owner-independent metadata and repricing', async () => {
    const plan = [0, 1, 2].map(i => createMockDish({ title: `Dish ${i}`, pantryStaples: [],
      estimatedPantryCost: 900, pantryRequirements: [{ ingredientId: 'olive-oil', quantity: 3, unit: 'tbsp' }] }));
    const transport = vi.fn<typeof fetch>().mockResolvedValueOnce(json({ input_tokens: 400 }))
      .mockResolvedValueOnce(completed(JSON.stringify({ dishes: plan })));
    const commodity = createMockCommodity({ ingredient: createMockIngredient({ id: 'ground-turkey', name: 'Ground turkey', category: 'PROTEIN' }) });
    const context: RecipeGenerationContext = { dashboard: { commodities: [commodity] }, pinnedIngredientIds: [],
      onHandIngredientIds: ['olive-oil'], targetServings: 6, customPreference: '', zipCode: '80542', cityLabel: 'Synthetic city',
      macroGoal: 'ANY', dietaryConstraints: [], applianceFilter: 'ANY' };
    const result = await generateMealPlan(createTerraRecipeProvider('test-only', transport), context);
    expect(result).toHaveLength(3); expect(result[0].estimatedPantryCost).toBe(0);
    expect(result[0].id).toMatch(/^ai-dish-/);
    const count = JSON.parse(String(transport.mock.calls[0][1]?.body));
    const generation = JSON.parse(String(transport.mock.calls[1][1]?.body));
    expect(count.text).toEqual(generation.text); expect(count.input).toEqual(generation.input);
    expect(generation).toMatchObject({ model: TERRA_MODEL, store: false, background: false, service_tier: 'default',
      max_output_tokens: 6000, tools: [], reasoning: { effort: 'low' },
      text: { format: { strict: true, schema: { type: 'object', additionalProperties: false, required: ['dishes'] } } } });
    const schema = generation.text.format.schema.properties.dishes.items;
    expect(schema.additionalProperties).toBe(false);
    expect(schema.properties.pantryRequirements.items.required).toContain('optional');
    expect(transport.mock.calls[1][1]).toMatchObject({ redirect: 'error', cache: 'no-store' });
  });
  it.each([32001, -1, null, '100', 1.5])('rejects invalid/excessive input count %s before generation', async count => {
    const transport = vi.fn<typeof fetch>().mockResolvedValue(json({ input_tokens: count }));
    await expect(createTerraRecipeProvider('test', transport).generate(request())).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
    expect(transport).toHaveBeenCalledOnce();
  });
  it.each([429, 500, 503])('does not retry a generation HTTP %s or disclose its body', async status => {
    const transport = vi.fn<typeof fetch>().mockResolvedValueOnce(json({ input_tokens: 400 }))
      .mockResolvedValueOnce(new Response('SECRET vendor details', { status }));
    await expect(createTerraRecipeProvider('test', transport).generate(request())).rejects.toMatchObject({ code: 'PROVIDER_UNAVAILABLE' });
    expect(transport).toHaveBeenCalledTimes(2);
  });
  it.each(['incomplete', 'refusal', 'wrong-model', 'over-bound', 'tool-call', 'missing-usage'])('fails closed on %s', async kind => {
    const response = await completed('{"dishes":[]}').json();
    if (kind === 'incomplete') response.status = 'incomplete';
    if (kind === 'refusal') response.output[1].content = [{ type: 'refusal', refusal: 'no' }];
    if (kind === 'wrong-model') response.model = LUNA_MODEL;
    if (kind === 'over-bound') response.usage.output_tokens = 6001;
    if (kind === 'tool-call') response.output.push({ type: 'function_call' });
    if (kind === 'missing-usage') delete response.usage;
    const transport = vi.fn<typeof fetch>().mockResolvedValueOnce(json({ input_tokens: 400 })).mockResolvedValueOnce(json(response));
    await expect(createTerraRecipeProvider('test', transport).generate(request())).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  });
  it('does not dispatch after cancellation or with an output limit exceeding the reservation', async () => {
    const transport = vi.fn<typeof fetch>(); const controller = new AbortController(); controller.abort();
    await expect(createTerraRecipeProvider('test', transport).generate({ ...request(), signal: controller.signal })).rejects.toMatchObject({ code: 'TIMEOUT' });
    await expect(createTerraRecipeProvider('test', transport).generate({ ...request(), maxOutputTokens: 6001 })).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
    expect(transport).not.toHaveBeenCalled();
  });
  it('rejects an oversized provider response while streaming', async () => {
    const cancel = vi.fn();
    const stream = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(1025)); }, cancel });
    await expect(readOpenAiJson(new Response(stream), 1024)).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
    expect(cancel).toHaveBeenCalledOnce();
  });
  it('transcribes canonical audio and extracts a review draft through the real speech service', async () => {
    const transport = vi.fn<typeof fetch>().mockResolvedValueOnce(json({ text: 'Add two pounds of carrots.' }))
      .mockResolvedValueOnce(json({ input_tokens: 400 }))
      .mockResolvedValueOnce(completed(JSON.stringify({ status: 'PROPOSALS', proposals: [{ spokenText: 'two pounds of carrots',
        ingredientId: 'carrots-fresh', displayName: 'Carrots', quantity: 2, unit: 'lb' }] }), LUNA_MODEL));
    const draft = await generateSpeechDraft(createOpenAiSpeechPipeline('test', transport), wav(), new AbortController().signal);
    expect(draft.proposals[0]).toMatchObject({ ingredientId: 'carrots-fresh', quantity: 2, unit: 'lb' });
    const form = transport.mock.calls[0][1]?.body as FormData;
    expect(form.get('model')).toBe('gpt-transcribe'); expect((form.get('file') as Blob).size).toBe(32044);
    const body = JSON.parse(String(transport.mock.calls[2][1]?.body));
    expect(body).toMatchObject({ model: LUNA_MODEL, max_output_tokens: 2048, store: false });
    expect(body.input).toContain('carrots-fresh');
  });
  it('does not extract after empty transcription, failed transcription or invalid audio', async () => {
    const transport = vi.fn<typeof fetch>().mockResolvedValueOnce(json({ text: '' }));
    const pipeline = createOpenAiSpeechPipeline('test', transport);
    expect(await generateSpeechDraft(pipeline, wav(), new AbortController().signal)).toMatchObject({ status: 'UNCLEAR', proposals: [] });
    expect(transport).toHaveBeenCalledOnce();
    transport.mockResolvedValueOnce(new Response('vendor secret', { status: 503 }));
    await expect(generateSpeechDraft(pipeline, wav(), new AbortController().signal)).rejects.toMatchObject({ code: 'PROVIDER_UNAVAILABLE' });
    expect(transport).toHaveBeenCalledTimes(2);
    await expect(generateSpeechDraft(pipeline, new Uint8Array(10), new AbortController().signal)).rejects.toThrow();
    expect(transport).toHaveBeenCalledTimes(2);
  });
});
