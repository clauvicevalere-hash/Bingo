type Bucket = { count: number; reset: number };

const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();

/** Limiteur simple en mémoire (par instance). */
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();

  if (now - lastSweep > 60_000) {
    for (const [k, b] of buckets) if (b.reset < now) buckets.delete(k);
    lastSweep = now;
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  if (bucket.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((bucket.reset - now) / 1000) };
  }
  bucket.count += 1;
  return { ok: true, retryAfter: 0 };
}

export function clientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || req.headers.get("cf-connecting-ip") || "local";
}
