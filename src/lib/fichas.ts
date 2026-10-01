import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fetchFicha } from "@/corpus/extract";
import { type Ficha, fichaSchema, MAX_FICHA_ID } from "@/lib/ficha";

/** Tracked seed fichas, plus a gitignored cache that the crawler and on-demand fetches fill. */
export const SEED_DIR = path.join(process.cwd(), "data", "fichas");
export const CACHE_DIR = path.join(process.cwd(), "data", "cache", "fichas");
let cache: Map<number, Ficha> | null = null;

async function readDir(dir: string): Promise<Ficha[]> {
  const files = await readdir(dir).catch(() => [] as string[]);
  return Promise.all(
    files
      .filter((f) => f.endsWith(".json"))
      .map(async (f) =>
        fichaSchema.parse(
          JSON.parse(await readFile(path.join(dir, f), "utf8")),
        ),
      ),
  );
}

export async function allFichas(): Promise<Map<number, Ficha>> {
  if (cache) return cache;
  const [seeds, cached] = await Promise.all([
    readDir(SEED_DIR),
    readDir(CACHE_DIR),
  ]);
  cache = new Map([...cached, ...seeds].map((f) => [f.id, f]));
  return cache;
}

export async function writeCachedFicha(ficha: Ficha): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(
    path.join(CACHE_DIR, `${ficha.id}.json`),
    `${JSON.stringify(ficha, null, 2)}\n`,
  );
}

export async function loadFicha(id: number): Promise<Ficha | undefined> {
  return (await allFichas()).get(id);
}

/** Ids that already missed once; gob.pe is not queried again for them this instance. */
const missed = new Set<number>();

/** Fichas not yet crawled are fetched once when a user lands on them, then cached like crawled ones. */
export async function loadOrFetchFicha(
  id: number,
  slug?: string,
): Promise<Ficha | undefined> {
  if (!Number.isInteger(id) || id <= 0 || id > MAX_FICHA_ID) return undefined;
  const cached = await loadFicha(id);
  if (cached) return cached;
  if (missed.has(id)) return undefined;
  const ficha = await fetchFicha(slug ?? String(id)).then(
    (r) => r.ficha,
    () => undefined,
  );
  if (!ficha) {
    missed.add(id);
    return undefined;
  }
  // Local dev persists the cache; serverless filesystems are read-only, so memory is the cache there.
  await writeCachedFicha(ficha).catch(() => undefined);
  (await allFichas()).set(ficha.id, ficha).set(id, ficha);
  return ficha;
}
