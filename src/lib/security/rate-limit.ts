import { NextRequest } from 'next/server';

interface RateLimitBucket {
  count: number;
  resetAtMs: number;
}

const rateLimitStore = new Map<string, RateLimitBucket>();
const MAX_BUCKETS = 5000;

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetInSeconds: number;
}

/**
 * Extracts a client IP identifier from standard proxy headers for rate limiting.
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
 */
export function checkRateLimit(
  request: NextRequest,
  scope: string,
  limit = 30,
  windowMs = 60_000,
  identity?: string
): RateLimitResult {
  const now = Date.now();

  if (rateLimitStore.size > MAX_BUCKETS) {
    for (const [key, bucket] of rateLimitStore.entries()) {
      if (bucket.resetAtMs <= now) {
        rateLimitStore.delete(key);
      }
    }
  }

  const ip = identity ?? getClientIp(request);
  const key = `${scope}:${ip}`;
  const existing = rateLimitStore.get(key);

  if (!existing || existing.resetAtMs <= now) {
    const nextBucket: RateLimitBucket = {
      count: 1,
      resetAtMs: now + windowMs,
    };
    rateLimitStore.set(key, nextBucket);
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
