import { request as httpsRequest } from 'node:https';
import { GoogleGenAI } from '@google/genai';
import { integer, micros, object, providerSchema, sha, type ObjectValue } from './core.mjs';

export type Provider = 'google' | 'openai' | 'anthropic' | 'deepgram';
export interface Timing { uploadMs: number; totalMs: number; uploadCompletedAt?: number; requestSha256?: string }
export interface TextSpec {
  provider: Exclude<Provider, 'deepgram'>; model: string; system: string; input: ObjectValue;
  schema: ObjectValue; maxInput: number; maxOutput: number; inputRate: number; outputRate: number;
  audio?: { bytes: Buffer; seconds: number };
}
export interface Result { text: string; inputTokens?: number; outputTokens?: number; cost: number; timing: Timing; model: string; usage: ObjectValue }
export const KEY_NAMES = { google: 'GEMINI_API_KEY', openai: 'OPENAI_API_KEY', anthropic: 'ANTHROPIC_API_KEY', deepgram: 'DEEPGRAM_API_KEY' } as const;
export function credentialPresence(env: NodeJS.ProcessEnv = process.env): Record<Provider, boolean> {
  return { google: Boolean(env.GEMINI_API_KEY?.trim() || env.GOOGLE_API_KEY?.trim()), openai: Boolean(env.OPENAI_API_KEY?.trim()), anthropic: Boolean(env.ANTHROPIC_API_KEY?.trim()), deepgram: Boolean(env.DEEPGRAM_API_KEY?.trim()) };
}
function key(provider: Provider): string {
  const value = provider === 'google' ? process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim() : process.env[KEY_NAMES[provider]];
  if (!value?.trim()) throw new Error(`Missing ${KEY_NAMES[provider]}`);
  return value.trim();
}
const HOSTS = new Set(['generativelanguage.googleapis.com','api.openai.com','api.anthropic.com','api.deepgram.com']);
export type Transport = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

// The request finish event measures the client completing upload, rather than treating
// an entire multipart request as server processing. No redirects or transport retries.
export function transport(onTiming: (timing: Timing) => void): Transport {
  return async (input, init) => {
    const request = new Request(input, init);
    const url = new URL(request.url);
    if (url.protocol !== 'https:' || !HOSTS.has(url.hostname) || url.port || url.username || url.password) throw new Error('Unapproved provider origin');
    const body = request.method === 'GET' ? undefined : Buffer.from(await request.arrayBuffer());
    const headers = Object.fromEntries(request.headers.entries());
    if (body) headers['content-length'] = String(body.length);
    const started = performance.now(); let uploaded = started;
    return new Promise<Response>((resolve, reject) => {
      const outgoing = httpsRequest(url, { method: request.method, headers }, incoming => {
        const chunks: Buffer[] = []; let size = 0;
        incoming.on('data', (chunk: Buffer) => {
          size += chunk.length;
          if (size > 2_000_000) outgoing.destroy(new Error('Provider response exceeded bound'));
          else chunks.push(chunk);
        });
        incoming.on('error', () => reject(new Error('Provider response transport failed')));
        incoming.on('end', () => {
          request.signal.removeEventListener('abort', abort);
          onTiming({ uploadMs: Math.max(0, uploaded - started), totalMs: performance.now() - started, uploadCompletedAt:uploaded, requestSha256:sha(body ?? Buffer.alloc(0)) });
          const responseHeaders = new Headers();
          for (const name of ['content-type','retry-after']) {
            const value = incoming.headers[name]; if (typeof value === 'string') responseHeaders.set(name, value);
          }
          resolve(new Response(Buffer.concat(chunks), { status: incoming.statusCode ?? 502, headers: responseHeaders }));
        });
      });
      const abort = () => outgoing.destroy(new Error('Provider deadline exceeded'));
      outgoing.on('finish', () => { uploaded = performance.now(); });
      outgoing.on('error', () => { request.signal.removeEventListener('abort', abort); reject(new Error('Provider transport failed')); });
      if (request.signal.aborted) { abort(); return; }
      request.signal.addEventListener('abort', abort, { once: true });
      outgoing.end(body);
    });
  };
}
async function jsonResponse(fetcher: Transport, url: string, body: ObjectValue, headers: Record<string, string>, signal: AbortSignal): Promise<ObjectValue> {
  const response = await fetcher(url, { method: 'POST', body: JSON.stringify(body), headers: { 'content-type':'application/json', ...headers }, signal });
  if (!response.ok) throw new Error(`Provider HTTP ${response.status}`); // Never persist vendor error bodies/headers.
  return object(await response.json());
}
function textBlocks(value: unknown, type: string): string {
  if (!Array.isArray(value)) return '';
  return value.filter(block => object(block).type === type).map(block => {
    const text = object(block).text; return typeof text === 'string' ? text : '';
  }).join('');
}
function billable(input: number, output: number, spec: TextSpec): number {
  integer(input); integer(output);
  return micros((input * spec.inputRate + output * spec.outputRate) / 1_000_000);
}
export class Providers {
  private latest: Timing = { uploadMs:0, totalMs:0 };
  readonly fetcher: Transport;
  constructor(fetcher?: Transport) { this.fetcher = fetcher ?? transport(timing => { this.latest = timing; }); }
  private google(): GoogleGenAI {
    return new GoogleGenAI({ apiKey:key('google'), apiVersion:'v1beta', httpOptions:{ retryOptions:{ attempts:1 }, fetch:this.fetcher } });
  }
  private googleContents(spec: TextSpec): { role: string; parts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] }[] {
    const parts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] = [{ text:JSON.stringify(spec.input) }];
    if (spec.audio) parts.push({ inlineData:{ mimeType:'audio/wav', data:spec.audio.bytes.toString('base64') } });
    return [{ role:'user', parts }];
  }
  private openaiBody(spec: TextSpec): ObjectValue {
    return { model:spec.model, instructions:spec.system, input:JSON.stringify(spec.input), tools:[], reasoning:{ effort:'low' },
      text:{ format:{ type:'json_schema', name:'pantrybot_spike', strict:true, schema:providerSchema(spec.schema) } } };
  }
  private anthropicBody(spec: TextSpec): ObjectValue {
    return { model:spec.model, system:spec.system, messages:[{ role:'user', content:JSON.stringify(spec.input) }],
      output_config:{ effort:'low', format:{ type:'json_schema', schema:providerSchema(spec.schema) } } };
  }
  async count(spec: TextSpec, signal: AbortSignal): Promise<number> {
    let count: number;
    if (spec.provider === 'google') {
      // SDK 3's Developer count config rejects systemInstruction. The public
      // per-request extraBody passes the documented full GenerateContentRequest
      // instead, counting the same system/schema/contents as generation.
      const countRequest = async (contents: ReturnType<Providers['googleContents']>) => {
        const result = await this.google().models.countTokens({ model:spec.model, contents, config:{ abortSignal:signal, httpOptions:{ extraBody:{ contents:undefined, generateContentRequest:{
          model:`models/${spec.model}`,contents,systemInstruction:{ parts:[{ text:spec.system }] },
          generationConfig:{ responseMimeType:'application/json',responseJsonSchema:providerSchema(spec.schema),maxOutputTokens:spec.maxOutput,thinkingConfig:{ thinkingBudget:0 },candidateCount:1 },
        } } } } });
        return integer(result.totalTokens);
      };
      if (spec.audio) {
        const textOnly=this.googleContents({ ...spec,audio:undefined });
        if (await countRequest(textOnly)>4000) throw new Error('Text portion exceeds approved speech input bound');
      }
      count=await countRequest(this.googleContents(spec));
    } else if (spec.provider === 'openai') {
      const result = await jsonResponse(this.fetcher, 'https://api.openai.com/v1/responses/input_tokens', this.openaiBody(spec), { authorization:`Bearer ${key('openai')}` }, signal);
      count = integer(result.input_tokens);
    } else {
      const result = await jsonResponse(this.fetcher, 'https://api.anthropic.com/v1/messages/count_tokens', this.anthropicBody(spec), { authorization:`Bearer ${key('anthropic')}`, 'anthropic-version':'2026-10-21' }, signal);
      count = integer(result.input_tokens);
    }
    if (count > spec.maxInput) throw new Error('Input exceeds approved token bound; no generation dispatched');
    return count;
  }
  async generate(spec: TextSpec, signal: AbortSignal): Promise<Result> {
    this.latest = { uploadMs:0, totalMs:0 };
    if (spec.provider === 'google') {
      const result = await this.google().models.generateContent({ model:spec.model, contents:this.googleContents(spec), config:{ systemInstruction:spec.system, responseMimeType:'application/json', responseJsonSchema:providerSchema(spec.schema), maxOutputTokens:spec.maxOutput, thinkingConfig:{ thinkingBudget:0 }, candidateCount:1, abortSignal:signal } });
      const usage = result.usageMetadata;
      if (!usage) throw new Error('Missing usage');
      const input = integer(usage.promptTokenCount);
      const output = integer(usage.candidatesTokenCount) + integer(usage.thoughtsTokenCount ?? 0);
      return { text:result.text ?? '', inputTokens:input, outputTokens:output, model:result.modelVersion ?? spec.model, cost:billable(input,output,spec), timing:this.latest, usage:{ inputTokens:input, outputTokens:output } };
    }
    if (spec.provider === 'openai') {
      const result = await jsonResponse(this.fetcher, 'https://api.openai.com/v1/responses', { ...this.openaiBody(spec), store:false, max_output_tokens:spec.maxOutput, service_tier:'default' }, { authorization:`Bearer ${key('openai')}` }, signal);
      if (result.service_tier !== undefined && result.service_tier !== 'default') throw new Error('Unexpected billable service tier');
      const usage = object(result.usage); const input = integer(usage.input_tokens); const output = integer(usage.output_tokens);
      const text = Array.isArray(result.output) ? result.output.map(block => textBlocks(object(block).content, 'output_text')).join('') : '';
      return { text, inputTokens:input, outputTokens:output, model:typeof result.model === 'string' ? result.model : spec.model, cost:billable(input,output,spec), timing:this.latest, usage:{ inputTokens:input, outputTokens:output, status:result.status } };
    }
    const result = await jsonResponse(this.fetcher, 'https://api.anthropic.com/v1/messages', { ...this.anthropicBody(spec), max_tokens:spec.maxOutput }, { authorization:`Bearer ${key('anthropic')}`, 'anthropic-version':'2026-10-21' }, signal);
    const usage = object(result.usage); const input = integer(usage.input_tokens) + integer(usage.cache_read_input_tokens ?? 0); const output = integer(usage.output_tokens);
    if (usage.service_tier !== undefined && usage.service_tier !== 'standard') throw new Error('Unexpected billable service tier');
    // No cache writes are requested. Unexpected cache accounting requires an audit.
    if (Number(usage.cache_creation_input_tokens ?? 0) > 0) throw new Error('Unexpected billable cache write');
    return { text:textBlocks(result.content,'text'), inputTokens:input, outputTokens:output, model:typeof result.model === 'string' ? result.model : spec.model, cost:billable(input,output,spec), timing:this.latest, usage:{ inputTokens:input, outputTokens:output, stopReason:result.stop_reason } };
  }
  async transcribe(provider: 'google' | 'openai' | 'deepgram', audio: Buffer, seconds: number, instruction: string, signal: AbortSignal): Promise<Result> {
    this.latest = { uploadMs:0, totalMs:0 };
    if (provider === 'google') {
      const result = await this.google().models.generateContent({ model:'gemini-3.5-transcribe', contents:[{ role:'user', parts:[{ text:instruction },{ inlineData:{ mimeType:'audio/wav', data:audio.toString('base64') } }] }], config:{ maxOutputTokens:512, thinkingConfig:{ thinkingBudget:0 }, candidateCount:1, abortSignal:signal } });
      if (!result.usageMetadata) throw new Error('Missing usage');
      const input = integer(result.usageMetadata.promptTokenCount);
      const output = integer(result.usageMetadata.candidatesTokenCount) + integer(result.usageMetadata.thoughtsTokenCount ?? 0);
      return { text:result.text ?? '', inputTokens:input, outputTokens:output, model:result.modelVersion ?? 'gemini-3.5-transcribe', timing:this.latest, cost:micros((input*2+output*12)/1_000_000), usage:{ inputTokens:input, outputTokens:output } };
    }
    if (provider === 'openai') {
      const form = new FormData(); form.set('model','gpt-transcribe'); form.set('file',new Blob([new Uint8Array(audio)], { type:'audio/wav' }),'synthetic.wav'); form.set('response_format','json'); form.set('prompt',instruction);
      const response = await this.fetcher('https://api.openai.com/v1/audio/transcriptions', { method:'POST', headers:{ authorization:`Bearer ${key('openai')}` }, body:form, signal });
      if (!response.ok) throw new Error(`Provider HTTP ${response.status}`);
      const result = object(await response.json());
      if (typeof result.text !== 'string') throw new Error('Missing transcript');
      // Duration accounting is qualified separately; charge the approved whole-minute
      // allowance rather than pretending a missing usage object proves zero cost.
      return { text:result.text, model:'gpt-transcribe', timing:this.latest, cost:micros(Math.ceil(seconds/60)*0.0045), usage:{ audioSeconds:seconds, conservativeBilledMinutes:Math.ceil(seconds/60), accounting:'qualified-duration-upper-bound' } };
    }
    const response = await this.fetcher('https://api.deepgram.com/v1/listen?model=nova-3&language=en&smart_format=false&mip_opt_out=true', { method:'POST', headers:{ authorization:`Token ${key('deepgram')}`, 'content-type':'audio/wav' }, body:new Uint8Array(audio), signal });
    if (!response.ok) throw new Error(`Provider HTTP ${response.status}`);
    const result = object(await response.json()); const results = object(result.results);
    const channels = results.channels as unknown[]; const alternatives = object(channels[0]).alternatives as unknown[];
    const text = object(alternatives[0]).transcript;
    if (typeof text !== 'string') throw new Error('Missing transcript');
    return { text, model:'nova-3', timing:this.latest, cost:micros(Math.ceil(seconds/60)*0.01), usage:{ audioSeconds:seconds, conservativeBilledMinutes:Math.ceil(seconds/60), accounting:'qualified-opt-out-duration-upper-bound' } };
  }
  async countGoogleTranscription(audio: Buffer, instruction: string, signal: AbortSignal): Promise<number> {
    const result = await this.google().models.countTokens({ model:'gemini-3.5-transcribe',contents:[{ role:'user',parts:[{ text:instruction },{ inlineData:{ mimeType:'audio/wav',data:audio.toString('base64') } }] }],config:{ abortSignal:signal,httpOptions:{ extraBody:{ contents:undefined,generateContentRequest:{
      model:'models/gemini-3.5-transcribe',contents:[{ role:'user',parts:[{ text:instruction },{ inlineData:{ mimeType:'audio/wav',data:audio.toString('base64') } }] }],
      generationConfig:{ maxOutputTokens:512,thinkingConfig:{ thinkingBudget:0 },candidateCount:1 },
    } } } } });
    const count = integer(result.totalTokens);
    if (count > 1216) throw new Error('Transcription input exceeds qualified bound');
    return count;
  }
}
