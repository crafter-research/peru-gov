// bun scripts/stress.ts [baseUrl] — 200-message stress run against /api/chat (150 single + 25 two-turn).
import { followups, single } from "../eval/stress";

const BASE = Bun.argv[2] ?? "http://localhost:3000";
const CONCURRENCY = 8;

type Part = { type: string; data?: any; delta?: string };
type Turn = {
  question: string;
  ms: number;
  firstMs: number;
  status: number;
  kinds: string[];
  ficha?: { id: number; title: string; entity: string };
  error?: string;
  text: string;
  parts: Part[];
};

let n = 0;
async function ask(messages: unknown[], session: string): Promise<Turn> {
  const question = (messages.at(-1) as any).parts[0].text;
  const t0 = performance.now();
  let firstMs = 0;
  const res = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": `10.0.${n % 250}.${(n++ * 7) % 250}`,
    },
    body: JSON.stringify({
      id: session,
      sessionId: session,
      messages,
      trigger: "submit-message",
    }),
  });
  const parts: Part[] = [];
  let text = "";
  let error: string | undefined;
  const body = await res.text();
  for (const line of body.split("\n")) {
    if (!line.startsWith("data: ") || line === "data: [DONE]") continue;
    const p = JSON.parse(line.slice(6)) as Part & { errorText?: string };
    if (!firstMs && p.type.startsWith("data-"))
      firstMs = performance.now() - t0;
    if (p.type === "error") error = p.errorText;
    if (p.type === "text-delta") text += p.delta ?? "";
    if (p.type.startsWith("data-")) parts.push(p);
  }
  const ficha = parts.find((p) => p.type === "data-ficha")?.data;
  return {
    question,
    ms: performance.now() - t0,
    firstMs,
    status: res.status,
    kinds: parts.map((p) => p.type),
    ficha: ficha && { id: ficha.id, title: ficha.title, entity: ficha.entity },
    error,
    text,
    parts,
  };
}

const userMsg = (id: string, text: string) => ({
  id,
  role: "user",
  parts: [{ type: "text", text }],
});
const outcome = (t: Turn) =>
  t.error || t.status !== 200
    ? "error"
    : t.ficha
      ? "leaf"
      : t.kinds.includes("data-clarify")
        ? "ask"
        : t.kinds.includes("data-none")
          ? "none"
          : t.kinds.includes("data-limited")
            ? "limited"
            : "empty";

async function pool<T, R>(
  items: T[],
  fn: (x: T, i: number) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (i < items.length) {
        const k = i++;
        out[k] = await fn(items[k], k);
      }
    }),
  );
  return out;
}

const t0 = performance.now();
const singles = await pool(single, async ([q, want], i) => ({
  want,
  turn: await ask([userMsg("u1", q)], `stress-s${i}`),
}));
const convs = await pool(followups, async ([q1, q2], i) => {
  const session = `stress-f${i}`;
  const first = await ask([userMsg("u1", q1)], session);
  const assistant = {
    id: "a1",
    role: "assistant",
    parts: [...first.parts, { type: "text", text: first.text }],
  };
  const second = await ask(
    [userMsg("u1", q1), assistant, userMsg("u2", q2)],
    session,
  );
  return { first, second };
});
const wall = performance.now() - t0;

const all = [
  ...singles.map((s) => s.turn),
  ...convs.flatMap((c) => [c.first, c.second]),
];
const counts: Record<string, number> = {};
for (const t of all) counts[outcome(t)] = (counts[outcome(t)] ?? 0) + 1;
let entityOk = 0,
  entityN = 0,
  askOk = 0,
  askN = 0,
  noneOk = 0,
  noneN = 0;
const misses: string[] = [];
for (const { want, turn } of singles) {
  const o = outcome(turn);
  if (want === "ASK") {
    askN++;
    askOk += +(o === "ask");
    if (o !== "ask")
      misses.push(`ASK → ${o} ${turn.ficha?.title ?? ""} | ${turn.question}`);
  } else if (want === "NONE") {
    noneN++;
    noneOk += +(o === "none");
    if (o !== "none")
      misses.push(`NONE → ${o} ${turn.ficha?.title ?? ""} | ${turn.question}`);
  } else {
    entityN++;
    const ok = o === "leaf" && want.test(turn.ficha!.entity);
    entityOk += +ok;
    if (!ok)
      misses.push(
        `${want.source.slice(0, 30)} → ${o} ${turn.ficha?.entity ?? ""} / ${turn.ficha?.title ?? ""} | ${turn.question}`,
      );
  }
}
let sticky = 0;
const drift: string[] = [];
for (const { first, second } of convs) {
  const same =
    first.ficha && second.ficha && first.ficha.entity === second.ficha.entity;
  if (same) sticky++;
  else
    drift.push(
      `${first.ficha?.title ?? outcome(first)} → ${second.ficha?.title ?? outcome(second)} | ${first.question} / ${second.question}`,
    );
}
const pct = (xs: number[], p: number) =>
  Math.round([...xs].sort((a, b) => a - b)[Math.floor(p * (xs.length - 1))]);
const leafTurns = all.filter((t) => t.ficha);
console.log(
  JSON.stringify(
    {
      messages: all.length,
      wallSeconds: Math.round(wall / 1000),
      outcomes: counts,
      entityAccuracy: `${entityOk}/${entityN}`,
      ask: `${askOk}/${askN}`,
      none: `${noneOk}/${noneN}`,
      followupsSameEntity: `${sticky}/${convs.length}`,
      firstPartMs: {
        p50: pct(
          leafTurns.map((t) => t.firstMs),
          0.5,
        ),
        p95: pct(
          leafTurns.map((t) => t.firstMs),
          0.95,
        ),
        max: pct(
          leafTurns.map((t) => t.firstMs),
          1,
        ),
      },
      totalMs: {
        p50: pct(
          all.map((t) => t.ms),
          0.5,
        ),
        p95: pct(
          all.map((t) => t.ms),
          0.95,
        ),
        max: pct(
          all.map((t) => t.ms),
          1,
        ),
      },
      emptySummaries: leafTurns.filter((t) => !t.text.trim()).length,
    },
    null,
    2,
  ),
);
console.log("\nMISSES\n" + misses.join("\n"));
console.log("\nFOLLOW-UP DRIFT\n" + drift.join("\n"));
const errors = all.filter((t) => outcome(t) === "error");
if (errors.length)
  console.log(
    "\nERRORS\n" +
      errors.map((t) => `${t.status} ${t.error} | ${t.question}`).join("\n"),
  );
await Bun.write(
  "eval/stress-results.json",
  JSON.stringify({ singles, convs }, null, 2),
);
