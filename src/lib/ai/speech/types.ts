import type { AiUsageBound } from '../usage';
export interface SpeechProposal {
  spokenText: string;
  ingredientId: string | null;
  displayName: string;
  quantity: number | null;
  unit: string | null;
}
export interface SpeechDraft {
  transcript: string;
  status: 'PROPOSALS' | 'NO_ADD' | 'UNCLEAR';
  proposals: SpeechProposal[];
}
export interface SpeechTranscriber {
  transcribe(input: { audio: Uint8Array; mimeType: 'audio/wav'; signal: AbortSignal }): Promise<{ text: string }>;
}
export interface SpeechExtractor {
  extract(input: { system: string; transcript: string; catalog: readonly {id:string;name:string}[]; signal: AbortSignal }): Promise<{ text: string }>;
}
/** A single admission covers the maximum exposure of both stages, including failures. */
export interface SpeechPipeline {
  usageBound: AiUsageBound;
  transcriber: SpeechTranscriber;
  extractor: SpeechExtractor;
}
