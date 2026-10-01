/** Fixed-window limiter. In-memory for local dev; swap for Upstash when deployed across instances. */
export function createLimiter(
  limit: number,
  windowMs: number,
  now: () => number = Date.now,
) {
  const hits = new Map<string, { start: number; count: number }>();
  return (
    key: string,
  ): { ok: true } | { ok: false; retryAfterSeconds: number } => {
    const t = now();
    const w = hits.get(key);
    if (!w || t - w.start >= windowMs) {
      hits.set(key, { start: t, count: 1 });
      return { ok: true };
    }
    if (w.count < limit) {
      w.count++;
      return { ok: true };
    }
    return {
      ok: false,
      retryAfterSeconds: Math.ceil((w.start + windowMs - t) / 1000),
    };
  };
}
