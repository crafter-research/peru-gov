import { createHash } from "node:crypto";
import { sql } from "@/lib/db";
import { redactPii } from "@/lib/redact";
import type { Candidate } from "@/lib/router";

export type RouteEvent = {
  sessionId: string;
  turn: number;
  question: string;
  topicId?: number;
  hintId?: number;
  kind: "leaf" | "ask" | "none" | "limited" | "error";
  ficha?: { id: number; title: string; entity: string };
  rewrites?: string[];
  candidates?: Candidate[];
  district?: string;
  latencyMs?: number;
  ip?: string;
  error?: string;
};

/** Salted, daily-rotating hash: groups abuse within a day without keeping the IP. */
export function hashIp(
  ip: string,
  day = new Date().toISOString().slice(0, 10),
): string {
  return createHash("sha256")
    .update(`${process.env.DATABASE_URL ?? ""}|${day}|${ip}`)
    .digest("hex")
    .slice(0, 16);
}

export async function logRouteEvent(e: RouteEvent): Promise<void> {
  if (!sql) return;
  try {
    await sql`
      insert into route_events (session_id, turn, question, topic_id, hint_id, kind, ficha_id, ficha_title, entity, rewrites, candidates, district, latency_ms, ip_hash, error)
      values (${e.sessionId.slice(0, 64)}, ${e.turn}, ${redactPii(e.question).slice(0, 500)}, ${e.topicId ?? null}, ${e.hintId ?? null}, ${e.kind},
        ${e.ficha?.id ?? null}, ${e.ficha?.title ?? null}, ${e.ficha?.entity ?? null}, ${JSON.stringify((e.rewrites ?? []).map(redactPii))},
        ${JSON.stringify((e.candidates ?? []).slice(0, 10))}, ${e.district ?? null}, ${e.latencyMs ?? null}, ${e.ip ? hashIp(e.ip) : null}, ${e.error?.slice(0, 500) ?? null})`;
  } catch (err) {
    console.error("analytics insert failed", err);
  }
}
