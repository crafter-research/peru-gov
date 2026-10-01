import { readFile } from "node:fs/promises";
import path from "node:path";
import { embedMany } from "ai";
import type { Candidate } from "@/lib/router";

export const EMBED_MODEL = "openai/text-embedding-3-small";
const DATA = path.join(process.cwd(), "data");

type Catalog = {
  ids: number[];
  titles: string[];
  dim: number;
  vectors: Float32Array;
};
let catalog: Catalog | null = null;

export const normalize = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

async function loadCatalog(): Promise<Catalog> {
  if (catalog) return catalog;
  const meta: { ids: number[]; titles: string[]; dim: number } = JSON.parse(
    await readFile(path.join(DATA, "catalog.json"), "utf8"),
  );
  const buf = await readFile(path.join(DATA, "catalog.f32"));
  catalog = {
    ...meta,
    vectors: new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4),
  };
  return catalog;
}

export function topK(
  vectors: Float32Array,
  dim: number,
  q: ArrayLike<number>,
  k: number,
): number[] {
  const n = vectors.length / dim;
  const scores = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let s = 0;
    const o = i * dim;
    for (let d = 0; d < dim; d++) s += vectors[o + d] * q[d];
    scores[i] = s;
  }
  return [...scores.keys()].sort((a, b) => scores[b] - scores[a]).slice(0, k);
}

/** Reciprocal rank fusion over ranked lists of row indexes. */
export function rrf(lists: number[][], k: number, c = 60): number[] {
  const score = new Map<number, number>();
  for (const list of lists)
    list.forEach((row, rank) =>
      score.set(row, (score.get(row) ?? 0) + 1 / (c + rank)),
    );
  return [...score]
    .sort((a, b) => b[1] - a[1])
    .slice(0, k)
    .map(([row]) => row);
}

/** C3.1: embed the question plus its rewrites, fuse their rankings, keep the top 25. */
export async function retrieve(
  question: string,
  rewrites: string[],
  k = 25,
): Promise<Candidate[]> {
  const cat = await loadCatalog();
  const { embeddings } = await embedMany({
    model: EMBED_MODEL,
    values: [question, ...rewrites].map(normalize),
  });
  const rows = rrf(
    embeddings.map((e) => topK(cat.vectors, cat.dim, e, 50)),
    k,
  );
  return rows.map((r) => ({ id: cat.ids[r], title: cat.titles[r] }));
}
