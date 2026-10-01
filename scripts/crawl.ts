// bun scripts/crawl.ts [--limit N] [--ids 224,174] — N16 + N17: fetch changed pages, extract fichas
import { mkdir } from "node:fs/promises";
import { extractFicha } from "@/corpus/extract";
import { type CorpusIndex, needsFetch } from "@/corpus/index-store";
import { USER_AGENT } from "@/corpus/sitemap";

const DELAY_MS = 5000;
const INDEX = "data/index.json";
const arg = (name: string) => {
  const i = Bun.argv.indexOf(name);
  return i > 0 ? Bun.argv[i + 1] : undefined;
};
const limit = Number(arg("--limit") ?? Number.POSITIVE_INFINITY);
const only = arg("--ids")?.split(",").map(Number);

const index: CorpusIndex = await Bun.file(INDEX).json();
const queue = Object.values(index.entries)
  .filter((e) => (only ? only.includes(e.id) : needsFetch(e)))
  .slice(0, limit);
await mkdir("data/raw", { recursive: true });
console.error(
  `${queue.length} pages to fetch (~${Math.ceil((queue.length * DELAY_MS) / 60000)} min)`,
);

let ok = 0;
for (const entry of queue) {
  try {
    const res = await fetch(entry.url, {
      headers: { "User-Agent": USER_AGENT },
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const ficha = await extractFicha(html, res.url);
    await Bun.write(`data/raw/${ficha.slug}.html`, html);
    await Bun.write(
      `data/fichas/${ficha.id}.json`,
      `${JSON.stringify(ficha, null, 2)}\n`,
    );
    if (ficha.id !== entry.id)
      console.error(`${entry.id} → ${ficha.id} (redirect)`);
    entry.fetchedAt = new Date().toISOString();
    ok++;
  } catch (err) {
    console.error(`fail ${entry.slug}: ${(err as Error).message}`);
  }
  if (ok % 25 === 0) await Bun.write(INDEX, `${JSON.stringify(index)}\n`);
  await Bun.sleep(DELAY_MS);
}
await Bun.write(INDEX, `${JSON.stringify(index)}\n`);
console.log(`extracted ${ok}/${queue.length}`);
