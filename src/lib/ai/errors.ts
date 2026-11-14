export class AiGenerationError extends Error {
  constructor(readonly code: 'PROVIDER_UNAVAILABLE' | 'INVALID_RESPONSE' | 'TIMEOUT') {
    super({ PROVIDER_UNAVAILABLE: 'AI assistance is temporarily unavailable. Please try again or use standard suggestions and manual pantry entry.',
      INVALID_RESPONSE: 'AI returned an unusable response. Please try again or use standard suggestions and manual pantry entry.',
      TIMEOUT: 'AI assistance took too long. Please try again or use standard suggestions and manual pantry entry.' }[code]);
    this.name = 'AiGenerationError';
  }
}
