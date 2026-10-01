import { withBotId } from "botid/next/config";
import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
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
