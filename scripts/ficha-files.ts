import { readdir } from "node:fs/promises";

/** Paths of every extracted ficha: tracked seeds first, then the local cache. */
export async function fichaFiles(): Promise<string[]> {
  const out: string[] = [];
  for (const dir of ["data/fichas", "data/cache/fichas"]) {
    const files = await readdir(dir).catch(() => [] as string[]);
    out.push(
      ...files.filter((f) => f.endsWith(".json")).map((f) => `${dir}/${f}`),
    );
  }
  return out;
}
