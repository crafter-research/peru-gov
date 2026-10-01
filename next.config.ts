import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

export default nextConfig;
