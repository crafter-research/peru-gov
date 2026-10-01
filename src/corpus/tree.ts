import { titleFromSlug } from "@/corpus/sitemap";

export type Tree = {
  parent: Record<number, number>;
  children: Record<number, number[]>;
  titles: Record<number, string>;
};

/**
 * N19: gob.pe guides publish their variants as child pages whose slug extends the parent's slug
 * (e.g. 135-obtener-licencia… → 137-obtener-licencia…-adultos-mayores). The longest existing prefix is the parent.
 */
export function buildTree(slugs: string[]): Tree {
  const byBase = new Map<string, number>();
  for (const s of slugs)
    byBase.set(s.replace(/^\d+-/, ""), Number(s.split("-")[0]));
  const tree: Tree = { parent: {}, children: {}, titles: {} };
  for (const s of slugs) {
    const id = Number(s.split("-")[0]);
    tree.titles[id] = titleFromSlug(s);
    let base = s.replace(/^\d+-/, "");
    while (base.includes("-")) {
      base = base.slice(0, base.lastIndexOf("-"));
      const p = byBase.get(base);
      if (p !== undefined && p !== id) {
        tree.parent[id] = p;
        tree.children[p] = [...(tree.children[p] ?? []), id];
        break;
      }
    }
  }
  return tree;
}

/** Variants a user can switch to: the ficha's children, or its siblings when it is itself a variant. */
export function variantsOf(tree: Tree, id: number): number[] {
  const own = tree.children[id] ?? [];
  if (own.length) return own;
  const p = tree.parent[id];
  return p === undefined
    ? []
    : [p, ...(tree.children[p] ?? []).filter((c) => c !== id)];
}

/** A variant's own label: its title minus the parent's title prefix ("…por primera vez condiciones" → "condiciones"). */
export function variantLabel(tree: Tree, id: number): string {
  const title = tree.titles[id] ?? "";
  const parent = tree.parent[id];
  const prefix = parent === undefined ? "" : tree.titles[parent];
  return prefix && title.startsWith(`${prefix} `)
    ? title.slice(prefix.length + 1)
    : title;
}
