import { sql } from "@/lib/db";

export type LimitResult =
  | { ok: true }
  | { ok: false; retryAfterSeconds: number };

/** Fixed-window limiter held in memory; the fallback when no database is configured. */
export function createLimiter(
  limit: number,
  windowMs: number,
  now: () => number = Date.now,
) {
  const hits = new Map<string, { start: number; count: number }>();
  return (key: string): LimitResult => {
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

/** Fixed-window limiter backed by Neon, so the count holds across instances and cold starts. */
export function createDurableLimiter(
  name: string,
  limit: number,
  windowMs: number,
  now: () => number = Date.now,
) {
  const local = createLimiter(limit, windowMs, now);
  return async (key: string): Promise<LimitResult> => {
    if (!sql) return local(key);
    const t = now();
    const bucket = Math.floor(t / windowMs);
    try {
      const rows = (await sql`
        insert into rate_limits (key, bucket) values (${`${name}:${key}`}, ${bucket})
        on conflict (key, bucket) do update set count = rate_limits.count + 1
        returning count`) as { count: number }[];
      if (rows[0].count <= limit) return { ok: true };
      return {
        ok: false,
        retryAfterSeconds: Math.ceil(((bucket + 1) * windowMs - t) / 1000),
      };
    } catch (err) {
      console.error("rate limit query failed", err);
      return local(key);
    }
  };
}

/** Drops counters from windows that ended more than a day ago. */
export async function pruneRateLimits(windowMs: number, now = Date.now()) {
  if (!sql) return;
  await sql`delete from rate_limits where bucket < ${Math.floor((now - 86_400_000) / windowMs)}`;
}
