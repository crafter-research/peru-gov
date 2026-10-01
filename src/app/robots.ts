import type { MetadataRoute } from "next";

// Shared answers are user-authored snapshots: linkable, never indexed.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/c/", "/api/"] },
  };
}
