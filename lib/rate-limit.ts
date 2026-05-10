type Bucket = { count: number; resetAt: number };

declare global {
  // eslint-disable-next-line no-var
  var __credexRateBuckets: Map<string, Bucket> | undefined;
}

const buckets = (): Map<string, Bucket> => {
  if (!globalThis.__credexRateBuckets) {
    globalThis.__credexRateBuckets = new Map();
  }
  return globalThis.__credexRateBuckets;
};

/** Simple fixed-window limiter (per server instance). */
export function rateLimit(key: string, limit: number, windowMs: number): { ok: true } | { ok: false; retryAfterMs: number } {
  const now = Date.now();
  const map = buckets();
  let bucket = map.get(key);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    map.set(key, bucket);
  }
  if (bucket.count >= limit) {
    return { ok: false, retryAfterMs: Math.max(0, bucket.resetAt - now) };
  }
  bucket.count += 1;
  return { ok: true };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip") || "unknown";
}
