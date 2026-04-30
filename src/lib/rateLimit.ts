type Bucket = { tokens: number; updatedAtMs: number };

type RateLimitConfig = {
  capacity: number;
  refillPerSecond: number;
};

const defaultConfig: RateLimitConfig = { capacity: 30, refillPerSecond: 0.5 }; // ~30 burst, ~30/min steady

function getBuckets() {
  const g = globalThis as unknown as { __networkingAppRateBuckets?: Map<string, Bucket> };
  if (!g.__networkingAppRateBuckets) g.__networkingAppRateBuckets = new Map();
  return g.__networkingAppRateBuckets;
}

export function checkRateLimit(key: string, config: RateLimitConfig = defaultConfig) {
  const buckets = getBuckets();
  const now = Date.now();

  const bucket = buckets.get(key) ?? { tokens: config.capacity, updatedAtMs: now };
  const elapsed = Math.max(0, now - bucket.updatedAtMs) / 1000;
  const refilled = Math.min(config.capacity, bucket.tokens + elapsed * config.refillPerSecond);
  const next: Bucket = { tokens: refilled, updatedAtMs: now };

  const allowed = next.tokens >= 1;
  if (allowed) next.tokens -= 1;

  buckets.set(key, next);
  return { allowed, remaining: next.tokens };
}

