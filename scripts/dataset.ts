// bun scripts/dataset.ts — N22: local open-dataset snapshot (dist/dataset). Publishing is a separate, manual step.
import { mkdir } from "node:fs/promises";
import type { CorpusIndex } from "@/corpus/index-store";
import { type Ficha, fichaSchema } from "@/lib/ficha";
import { fichaFiles } from "./ficha-files";

const out = "dist/dataset";
await mkdir(out, { recursive: true });
const fichas: Ficha[] = [];
for (const f of await fichaFiles()) {
  fichas.push(fichaSchema.parse(await Bun.file(f).json()));
}
fichas.sort((a, b) => a.id - b.id);
const index: CorpusIndex = await Bun.file("data/index.json").json();
const live = Object.values(index.entries).filter((e) => !e.missingSince).length;

await Bun.write(
  `${out}/fichas.jsonl`,
  `${fichas.map((f) => JSON.stringify(f)).join("\n")}\n`,
);
await Bun.write(
  `${out}/manifest.json`,
  `${JSON.stringify({ generatedAt: new Date().toISOString(), scannedAt: index.scannedAt, catalogPages: live, fichasExtracted: fichas.length, source: "https://www.gob.pe/sitemaps/sitemap.xml.gz" }, null, 2)}\n`,
);
console.log(
  `dataset: ${fichas.length} fichas of ${live} catalog pages → ${out}`,
);
