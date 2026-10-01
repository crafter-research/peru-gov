// bun scripts/extract-raw.ts — data/raw/*.html → data/fichas/<id>.json
import { readdir } from "node:fs/promises";
import { extractFicha } from "@/corpus/extract";

const raw = "data/raw";
const files = (await readdir(raw)).filter((f) => f.endsWith(".html"));
for (const file of files) {
  const slug = file.replace(/\.html$/, "");
  const ficha = await extractFicha(
    await Bun.file(`${raw}/${file}`).text(),
    `https://www.gob.pe/${slug}`,
  );
  await Bun.write(
    `data/fichas/${ficha.id}.json`,
    `${JSON.stringify(ficha, null, 2)}\n`,
  );
  console.log(
    `${ficha.id}\t${ficha.kind}\t${ficha.title}\t${ficha.costs.join(" ")}`,
  );
}
