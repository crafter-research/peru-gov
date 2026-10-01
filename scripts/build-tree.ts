// bun scripts/build-tree.ts — N19: data/index.json → data/tree.json
import type { CorpusIndex } from "@/corpus/index-store";
import { buildTree } from "@/corpus/tree";

const index: CorpusIndex = await Bun.file("data/index.json").json();
const tree = buildTree(
  Object.values(index.entries)
    .filter((e) => !e.missingSince)
    .map((e) => e.slug),
);
await Bun.write("data/tree.json", `${JSON.stringify(tree)}\n`);
console.log(
  `tree: ${Object.keys(tree.children).length} parents, ${Object.keys(tree.parent).length} children`,
);
