import { gunzipSync } from "node:zlib";

export const USER_AGENT =
  "Mozilla/5.0 (compatible; crafter-research-peru-gov/0.1; +https://github.com/crafter-research)";
export const SITEMAP_INDEX = "https://www.gob.pe/sitemaps/sitemap.xml.gz";

export type SitemapEntry = {
  url: string;
  id: number;
  slug: string;
  lastmod: string | null;
};

/** Top-level gob.pe pages `/<id>-<slug>` are trámites, orientaciones and servicios. */
const TOP_LEVEL = /^https?:\/\/www\.gob\.pe\/(\d+)-([^/?#]+)$/;

export function parseLocs(xml: string): string[] {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

export function parseEntries(xml: string): SitemapEntry[] {
  const out: SitemapEntry[] = [];
  for (const m of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = m[1].match(/<loc>([^<]+)<\/loc>/)?.[1].trim();
    const top = loc?.match(TOP_LEVEL);
    if (!loc || !top) continue;
    out.push({
      url: loc.replace(/^http:/, "https:"),
      id: Number(top[1]),
      slug: `${top[1]}-${top[2]}`,
      lastmod: m[1].match(/<lastmod>([^<]+)<\/lastmod>/)?.[1].trim() ?? null,
    });
  }
  return out;
}

export async function fetchGz(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return gunzipSync(Buffer.from(await res.arrayBuffer())).toString("utf8");
}
