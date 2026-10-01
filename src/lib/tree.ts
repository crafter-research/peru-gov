import { readFile } from "node:fs/promises";
import path from "node:path";
import { type Tree, variantsOf } from "@/corpus/tree";
import type { Ficha } from "@/lib/ficha";
import type { RouteStep } from "@/lib/messages";
import type { Candidate } from "@/lib/router";

let tree: Tree | null = null;

async function loadTree(): Promise<Tree> {
  if (tree) return tree;
  try {
    tree = JSON.parse(
      await readFile(path.join(process.cwd(), "data", "tree.json"), "utf8"),
    ) as Tree;
  } catch {
    tree = { parent: {}, children: {}, titles: {} };
  }
  return tree;
}

/** N13: entity → guide (when the ficha is a variant) → ficha. */
export async function pathFor(ficha: Ficha): Promise<RouteStep[]> {
  const t = await loadTree();
  const parent = t.parent[ficha.id];
  return [
    { label: "Entidad", value: ficha.entity },
    ...(parent !== undefined
      ? [{ label: "Guía", value: t.titles[parent] }]
      : []),
    { label: ficha.kind, value: ficha.title },
  ];
}

/** N14: variants from the gob.pe hierarchy; related steps from the ficha's own links. */
export async function variantsAndRelated(
  ficha: Ficha,
): Promise<{ variants: Candidate[]; related: Candidate[] }> {
  const t = await loadTree();
  const variants = variantsOf(t, ficha.id).map((id) => ({
    id,
    title: t.titles[id],
  }));
  const seen = new Set([ficha.id, ...variants.map((v) => v.id)]);
  const related = ficha.links
    .filter((l) => !seen.has(l.id) && l.title.split(" ").length > 2)
    .slice(0, 4);
  return { variants: variants.slice(0, 6), related };
}
