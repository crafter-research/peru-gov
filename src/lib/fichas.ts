import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fetchFicha } from "@/corpus/extract";
import { type Ficha, fichaSchema } from "@/lib/ficha";

const DIR = path.join(process.cwd(), "data", "fichas");
let cache: Map<number, Ficha> | null = null;

export async function allFichas(): Promise<Map<number, Ficha>> {
  if (cache) return cache;
  const files = (await readdir(DIR)).filter((f) => f.endsWith(".json"));
  const fichas = await Promise.all(
    files.map(async (f) =>
      fichaSchema.parse(JSON.parse(await readFile(path.join(DIR, f), "utf8"))),
    ),
  );
  cache = new Map(fichas.map((f) => [f.id, f]));
  return cache;
}

export async function loadFicha(id: number): Promise<Ficha | undefined> {
  return (await allFichas()).get(id);
}

/** Fichas not yet crawled are fetched once when a user lands on them, then cached like crawled ones. */
export async function loadOrFetchFicha(
  id: number,
  slug?: string,
): Promise<Ficha | undefined> {
  const cached = await loadFicha(id);
  if (cached) return cached;
  const ficha = await fetchFicha(slug ?? String(id)).then(
    (r) => r.ficha,
    () => undefined,
  );
  if (!ficha) return undefined;
  await writeFile(
    path.join(DIR, `${ficha.id}.json`),
    `${JSON.stringify(ficha, null, 2)}\n`,
  );
  (await allFichas()).set(ficha.id, ficha).set(id, ficha);
  return ficha;
}
