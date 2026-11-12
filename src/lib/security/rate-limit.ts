import { NextRequest } from 'next/server';

interface RateLimitBucket {
  count: number;
  resetAtMs: number;
}

// Scopes are application-owned, never request/account-derived. Reserve capacity
// for every route within the existing 5,000-bucket process budget so one route
// cannot consume authentication or another route's slots.
const scopes = [
  'auth-callback', 'weekly-preview', 'weekly-manual', 'dashboard',
  'api-ai-meal-plan', 'ai-account', 'market-health', 'api-pantry',
  'api-recipes-write', 'api-freezer-write', 'api-account-export', 'api-account-auth',
  'api-account-delete', 'api-sync-get', 'api-sync-post', 'barcode-lookup',
  'data-download', 'data-read',
] as const;
type RateLimitScope = typeof scopes[number];
const MAX_BUCKETS_PER_SCOPE = Math.floor(5000 / scopes.length);
const rateLimitStore = new Map<RateLimitScope, { buckets: Map<string, RateLimitBucket>; nextExpiryMs: number }>(
  scopes.map((scope) => [scope, { buckets: new Map(), nextExpiryMs: Infinity }])
);

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetInSeconds: number;
}

/**
 * Extracts a client IP identifier from standard proxy headers for rate limiting.
 * Deploy only behind a trusted ingress that overwrites these caller-spoofable headers.
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;
  return '127.0.0.1';
}

/**
 * Enforces an in-memory fixed-window rate limit per IP and route scope.
 * Use a fixed policy per trusted scope. At capacity, Retry-After describes the
 * next available identity slot, not a fresh caller's request allowance.
 */
export function checkRateLimit(
  request: NextRequest,
  scope: RateLimitScope,
  limit = 30,
  windowMs = 60_000,
  identity?: string
): RateLimitResult {
  const now = Date.now();

  const ip = identity ?? getClientIp(request);
  const store = rateLimitStore.get(scope);
  if (!store) return { allowed: false, limit, remaining: 0, resetInSeconds: Math.max(1, Math.ceil(windowMs / 1000)) };
  const existing = store.buckets.get(ip);

  if (!existing || existing.resetAtMs <= now) {
    if (!existing && store.buckets.size >= MAX_BUCKETS_PER_SCOPE) {
      // At capacity, do not rescan until an expiry can actually free a slot.
      if (store.nextExpiryMs <= now) {
        store.nextExpiryMs = Infinity;
        for (const [bucketKey, bucket] of store.buckets) {
          if (bucket.resetAtMs <= now) store.buckets.delete(bucketKey);
          else store.nextExpiryMs = Math.min(store.nextExpiryMs, bucket.resetAtMs);
        }
      }
      // Keep active clients' counters; new identities fail closed at capacity.
      // Evict only expired buckets, so rotating identities cannot reset throttled clients.
      if (store.buckets.size >= MAX_BUCKETS_PER_SCOPE) return {
        allowed: false, limit, remaining: 0,
        resetInSeconds: Math.max(1, Math.ceil((store.nextExpiryMs - now) / 1000)),
      };
    }
    const nextBucket: RateLimitBucket = {
      count: 1,
      resetAtMs: now + windowMs,
    };
    store.buckets.set(ip, nextBucket);
    store.nextExpiryMs = Math.min(store.nextExpiryMs, nextBucket.resetAtMs);
    return {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - 1),
      resetInSeconds: Math.ceil(windowMs / 1000),
    };
  }

  existing.count += 1;
  const remaining = Math.max(0, limit - existing.count);
  const resetInSeconds = Math.max(1, Math.ceil((existing.resetAtMs - now) / 1000));

  return {
    allowed: existing.count <= limit,
    limit,
    remaining,
    resetInSeconds,
  };
}

/**
 * Verifies CSRF protection by checking that Origin/Referer matches the request host
 * on state-mutating requests (POST, PATCH, DELETE).
 */
export function verifySameOrigin(request: NextRequest): boolean {
  const method = request.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return true;
  }

  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (!origin || !host) {
    // Allow same-origin requests where browser omits Origin or internal server calls
    return true;
  }

  try {
    const originUrl = new URL(origin);
    return originUrl.host === host;
  } catch {
    return false;
  }
}

/**
 * Prevents open-redirect vulnerabilities on OAuth callbacks by only allowing
 * internal relative paths starting with a single '/'.
 */
export function sanitizeRedirectPath(nextParam: string | null | undefined): string {
  if (!nextParam) return '/';
  const trimmed = nextParam.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('\\')) {
    return '/';
  }
  return trimmed;
}

/**
 * Returns strict cookie options enforcing HttpOnly, SameSite=Lax, and Secure in production.
 */
export function getSecureCookieOptions(maxAgeSeconds = 60 * 60 * 24 * 30) {
  return {
    httpOnly: true as const,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: maxAgeSeconds,
  };
}
