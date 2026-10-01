// bun scripts/scan.ts — N15: sitemap → data/index.json (merged, never shrinks)
import {
  type CorpusIndex,
  completeness,
  mergeScan,
} from "@/corpus/index-store";
import {
  fetchGz,
  parseEntries,
  parseLocs,
  SITEMAP_INDEX,
  type SitemapEntry,
} from "@/corpus/sitemap";

const DELAY_MS = 5000;
const INDEX = "data/index.json";

const file = Bun.file(INDEX);
const prev: CorpusIndex | null = (await file.exists())
  ? await file.json()
  : null;
const parts = parseLocs(await fetchGz(SITEMAP_INDEX)).map((u) =>
  u.replace(/^http:/, "https:"),
);
const scan: SitemapEntry[] = [];
for (const [i, part] of parts.entries()) {
  await Bun.sleep(DELAY_MS);
  try {
    scan.push(...parseEntries(await fetchGz(part)));
  } catch (err) {
    console.error(`skip ${part}: ${(err as Error).message}`);
  }
  if ((i + 1) % 10 === 0)
    console.error(`${i + 1}/${parts.length} parts, ${scan.length} pages`);
}
const next = mergeScan(prev, scan, new Date().toISOString());
await Bun.write(INDEX, `${JSON.stringify(next)}\n`);
const c = completeness(prev, next);
console.log(
  `pages present ${c.present} (before ${c.before}, ratio ${c.ratio.toFixed(3)})`,
);
