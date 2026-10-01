import { type NextRequest, NextResponse } from "next/server";

// sha256 of the inline theme bootstrap (src/lib/theme.ts); test/csp.test.ts fails if they drift apart.
const THEME_SCRIPT_HASH = "sha256-s7Ny96H+f04bqF5fOEcH8TilGEZl6an4ArzZyG2LwO8=";

export function contentSecurityPolicy(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline' https: '${THEME_SCRIPT_HASH}'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    "connect-src 'self' https://va.vercel-scripts.com",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

/**
 * Per-request nonce CSP. Next reads the nonce from the request headers and stamps it
 * on its own scripts; 'strict-dynamic' lets those trusted scripts load what they need
 * (analytics, bot detection) without widening the allowlist.
 */
export function middleware(req: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = contentSecurityPolicy(nonce);
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);
  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set("Content-Security-Policy", csp);
  return res;
}

export const config = {
  matcher: ["/", "/c/:path*", "/tramite/:path*"],
};
