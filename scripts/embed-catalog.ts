// bun scripts/embed-catalog.ts — N18: data/index.json (+ extracted fichas) → data/catalog.{json,f32}
import { readdir } from "node:fs/promises";
import { embedMany } from "ai";
import type { CorpusIndex } from "@/corpus/index-store";
import type { Ficha } from "@/lib/ficha";
import { EMBED_MODEL, normalize } from "@/lib/retrieve";

const BATCH = 1000;
const index: CorpusIndex = await Bun.file("data/index.json").json();
const official = new Map<number, string>();
for (const f of (await readdir("data/fichas")).filter((f) =>
  f.endsWith(".json"),
)) {
  const ficha: Ficha = await Bun.file(`data/fichas/${f}`).json();
  official.set(ficha.id, ficha.title);
}

const live = Object.values(index.entries).filter((e) => !e.missingSince);
const ids = live.map((e) => e.id);
const titles = live.map(
  (e) => official.get(e.id) ?? e.slug.replace(/^\d+-/, "").replaceAll("-", " "),
);

let dim = 0;
let vectors = new Float32Array(0);
for (let i = 0; i < titles.length; i += BATCH) {
  const { embeddings } = await embedMany({
    model: EMBED_MODEL,
    values: titles.slice(i, i + BATCH).map(normalize),
  });
  if (!dim) {
    dim = embeddings[0].length;
    vectors = new Float32Array(titles.length * dim);
  }
  embeddings.forEach((e, j) => {
    vectors.set(e, (i + j) * dim);
  });
  console.error(
    `embedded ${Math.min(i + BATCH, titles.length)}/${titles.length}`,
  );
}
await Bun.write(
  "data/catalog.json",
  `${JSON.stringify({ ids, titles, dim })}\n`,
);
await Bun.write("data/catalog.f32", vectors);
console.log(`catalog: ${ids.length} titles, dim ${dim}`);
