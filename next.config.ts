import { withBotId } from "botid/next/config";
import type { NextConfig } from "next";

// No X-Frame-Options here: a `/:path*` source also covers BotID's challenge path, and
// DENY would override the SAMEORIGIN BotID sets, breaking the challenge (every POST 403s).
// Framing protection lives in the middleware CSP (frame-ancestors 'none'), whose matcher
// excludes the BotID path.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The voice button uses the mic; nothing else needs sensors, camera or geo.
  { key: "Permissions-Policy", value: "microphone=(self)" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  headers: async () => [{ source: "/:path*", headers: securityHeaders }],
  // Runtime corpus is read with fs, which file tracing cannot see.
  outputFileTracingIncludes: {
    "/api/chat": [
      "./data/catalog.json",
      "./data/catalog.i8",
      "./data/tree.json",
      "./data/fichas/*.json",
    ],
    "/tramite/*": ["./data/fichas/*.json"],
  },
};

export default withBotId(nextConfig);
