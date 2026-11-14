export class AiGenerationError extends Error {
  constructor(readonly code: 'PROVIDER_UNAVAILABLE' | 'INVALID_RESPONSE' | 'TIMEOUT') {
    super({ PROVIDER_UNAVAILABLE: 'AI generation is temporarily unavailable. Please try again or use standard suggestions.',
      INVALID_RESPONSE: 'AI returned an unusable meal plan. Please try again or use standard suggestions.',
      TIMEOUT: 'AI generation took too long. Please try again or use standard suggestions.' }[code]);
    this.name = 'AiGenerationError';
  }
}
