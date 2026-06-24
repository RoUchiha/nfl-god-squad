import type { NextRequest } from 'next/server';

interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

interface LimitRecord {
  count: number;
  resetAt: number;
}

export const MAX_JSON_BODY_BYTES = 64 * 1024;
const MAX_TRACKED_LIMIT_KEYS = 10_000;
const rateLimits = new Map<string, LimitRecord>();

function pruneExpired(store: Map<string, LimitRecord>, now: number): void {
  for (const [key, value] of Array.from(store.entries())) {
    if (value.resetAt <= now) store.delete(key);
  }

  while (store.size >= MAX_TRACKED_LIMIT_KEYS) {
    const oldestKey = store.keys().next().value as string | undefined;
    if (!oldestKey) break;
    store.delete(oldestKey);
  }
}

function normalizeIp(value: string | null | undefined): string | null {
  const candidate = value?.trim();
  if (!candidate || candidate.length > 64 || !/^[0-9a-fA-F:.]+$/.test(candidate)) return null;
  return candidate;
}

export function getClientIp(req: NextRequest): string {
  const forwarded = normalizeIp(req.headers.get('x-forwarded-for')?.split(',')[0]);
  return forwarded || normalizeIp(req.headers.get('x-real-ip')) || 'unknown';
}

export function isTrustedMutationRequest(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  if (origin) {
    try {
      const originUrl = new URL(origin);
      const requestUrl = new URL(req.url);
      const requestHost = req.headers.get('x-forwarded-host')?.split(',')[0]?.trim()
        || req.headers.get('host')?.trim()
        || requestUrl.host;
      const requestProtocol = req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim()
        || requestUrl.protocol.replace(':', '');
      return originUrl.host === requestHost && originUrl.protocol === `${requestProtocol}:`;
    } catch {
      return false;
    }
  }

  const fetchSite = req.headers.get('sec-fetch-site');
  return !fetchSite || fetchSite === 'same-origin' || fetchSite === 'same-site' || fetchSite === 'none';
}

export async function readJsonBody(
  req: NextRequest,
  maxBytes = MAX_JSON_BODY_BYTES
): Promise<{ ok: true; value: unknown } | { ok: false; reason: 'invalid' | 'too-large' }> {
  const declaredLength = req.headers.get('content-length');
  if (declaredLength) {
    const length = Number(declaredLength);
    if (!Number.isSafeInteger(length) || length < 0) return { ok: false, reason: 'invalid' };
    if (length > maxBytes) return { ok: false, reason: 'too-large' };
  }

  try {
    const text = await req.text();
    if (new TextEncoder().encode(text).byteLength > maxBytes) return { ok: false, reason: 'too-large' };
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return { ok: false, reason: 'invalid' };
  }
}

export function checkRateLimit(key: string, options: RateLimitOptions): { allowed: true } | { allowed: false; retryAfter: number } {
  const now = Date.now();
  pruneExpired(rateLimits, now);

  const current = rateLimits.get(key);
  if (!current || current.resetAt <= now) {
    rateLimits.set(key, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true };
  }

  if (current.count >= options.limit) {
    return { allowed: false, retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  }

  current.count += 1;
  return { allowed: true };
}
