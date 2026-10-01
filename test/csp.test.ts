import { expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { themeScript } from "@/lib/theme";
import { contentSecurityPolicy } from "@/middleware";

test("the CSP allows the inline theme bootstrap by its current sha256", () => {
  const csp = contentSecurityPolicy("nonce-for-test");
  const hash = createHash("sha256").update(themeScript).digest("base64");
  expect(csp).toContain(`'sha256-${hash}'`);
});

test("the CSP carries the per-request nonce and closes the frame", () => {
  const csp = contentSecurityPolicy("abc123");
  expect(csp).toContain("'nonce-abc123'");
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).toContain("object-src 'none'");
});
