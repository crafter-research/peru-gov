import { expect, test } from "bun:test";
import { createLimiter } from "@/lib/rate-limit";

test("blocks after the limit and resets with the window", () => {
  let t = 0;
  const limit = createLimiter(2, 60_000, () => t);
  expect(limit("ip").ok).toBe(true);
  expect(limit("ip").ok).toBe(true);
  expect(limit("ip")).toEqual({ ok: false, retryAfterSeconds: 60 });
  expect(limit("other").ok).toBe(true);
  t = 60_000;
  expect(limit("ip").ok).toBe(true);
});
