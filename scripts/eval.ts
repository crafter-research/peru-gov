// bun --env-file=.env.local scripts/eval.ts — held-out routing eval over the real pipeline.
// Fails when strict leaf accuracy drops below the baseline measured on 2026-09-30 (39/46).

import { retrieve } from "@/lib/retrieve";
import { rewrite } from "@/lib/rewrite";
import { jevPick, route } from "@/lib/router";
import { heldout } from "../eval/heldout";

const BASELINE_LEAF = 39 / 46;
const index: { entries: Record<string, { slug: string }> } =
  await Bun.file("data/index.json").json();
const slugOf = (id: number) => index.entries[id]?.slug ?? String(id);

let leafOk = 0;
let leafN = 0;
let otherOk = 0;
let otherN = 0;
const misses: string[] = [];
for (const [q, want] of heldout) {
  const r = await route(q, { rewrite, candidates: retrieve, pick: jevPick });
  const got = r.kind === "leaf" ? slugOf(r.id) : r.kind.toUpperCase();
  const ok =
    want instanceof RegExp ? r.kind === "leaf" && want.test(got) : got === want;
  if (want instanceof RegExp) {
    leafN++;
    leafOk += +ok;
  } else {
    otherN++;
    otherOk += +ok;
  }
  if (!ok) misses.push(`${String(want)} → ${got} | ${q}`);
}
console.log(misses.join("\n"));
const acc = leafOk / leafN;
console.log(
  `leaf ${leafOk}/${leafN} (${acc.toFixed(2)}, baseline ${BASELINE_LEAF.toFixed(2)})  ask/none ${otherOk}/${otherN}`,
);
if (acc < BASELINE_LEAF) process.exit(1);
