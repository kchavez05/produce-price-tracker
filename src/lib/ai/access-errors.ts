export type AiAccessCode = 'AUTH_REQUIRED' | 'AUTH_UNAVAILABLE' | 'ACCOUNT_CHANGED' | 'AI_DISABLED' | 'AI_NOT_CONFIGURED' |
  'DAILY_QUOTA' | 'MONTHLY_BUDGET' | 'CONCURRENT_REQUEST' | 'DUPLICATE_REQUEST' | 'USAGE_UNAVAILABLE' | 'CLIENT_UPDATE_REQUIRED' | 'INVALID_REQUEST';
const descriptions: Record<AiAccessCode, [number,string]> = {
  AUTH_REQUIRED: [401,'Sign in with a verified account to access AI features. Standard suggestions and manual pantry entry remain available.'],
  AUTH_UNAVAILABLE: [503,'Unable to verify your sign-in right now. Please try again when connected.'],
  ACCOUNT_CHANGED: [409,'Your account changed. Reload before trying AI again.'],
  AI_DISABLED: [503,'AI assistance is temporarily unavailable. Standard suggestions and manual pantry entry remain available.'],
  AI_NOT_CONFIGURED: [503,'AI assistance is not ready yet. Standard suggestions and manual pantry entry remain available.'],
  DAILY_QUOTA: [429,'Your daily AI allowance has been reached. Standard suggestions and manual pantry entry remain available.'],
  MONTHLY_BUDGET: [429,'The shared AI allowance has been reached. Standard suggestions and manual pantry entry remain available.'],
  CONCURRENT_REQUEST: [429,'An AI request is already in progress for your account. Wait before trying again.'],
  DUPLICATE_REQUEST: [409,'This AI request has already been submitted. It will not be run again.'],
  USAGE_UNAVAILABLE: [503,'AI usage controls are unavailable. Please try again later or use standard suggestions.'],
  CLIENT_UPDATE_REQUIRED: [400,'Personal API keys are no longer accepted. Reload the app and sign in to use AI.'],
  INVALID_REQUEST: [400,'The AI request is invalid or too large. Reload the app and try again.'],
};
export class AiAccessError extends Error {
  readonly status: number;
  constructor(readonly code: AiAccessCode, readonly retryAfterSeconds?: number) {
    super(descriptions[code][1]); this.name='AiAccessError'; this.status=descriptions[code][0];
  }
}
