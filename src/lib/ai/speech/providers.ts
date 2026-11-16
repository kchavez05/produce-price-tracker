import type { SpeechPipeline } from './types';
import { createOpenAiSpeechPipeline } from './openai';
/** Keys alone cannot authorize dispatch: the durable ledger must accept the adapter. */
export function createSpeechPipeline(): SpeechPipeline | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  return key ? createOpenAiSpeechPipeline(key) : null;
}

export function isSpeechPipelineConfigured(): boolean { return Boolean(process.env.OPENAI_API_KEY?.trim()); }
