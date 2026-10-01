import { randomBytes } from "node:crypto";
import { z } from "zod";
import { sql } from "@/lib/db";
import { redactPii } from "@/lib/redact";

export const sharedTurnSchema = z.object({
  question: z.string().min(1).max(500),
  summary: z.string().max(2000),
  ficha: z
    .object({
      id: z.number().int().positive(),
      title: z.string().max(300),
      entity: z.string().max(300),
      url: z.url({ protocol: /^https$/, hostname: /^www\.gob\.pe$/ }),
    })
    .nullable(),
});
export const shareSchema = z.object({
  turns: z.array(sharedTurnSchema).min(1).max(10),
});
export type SharedTurn = z.infer<typeof sharedTurnSchema>;

/** Stores a redacted snapshot and returns its public id. */
export async function createShare(turns: SharedTurn[]): Promise<string | null> {
  if (!sql) return null;
  const id = randomBytes(8).toString("base64url");
  const clean = turns.map((t) => ({
    ...t,
    question: redactPii(t.question),
    summary: redactPii(t.summary),
  }));
  await sql`insert into shares (id, turns) values (${id}, ${JSON.stringify(clean)})`;
  return id;
}

export async function getShare(id: string): Promise<SharedTurn[] | null> {
  if (!sql || !/^[\w-]{6,24}$/.test(id)) return null;
  const [row] = await sql`select turns from shares where id = ${id}`;
  if (!row) return null;
  const parsed = z.array(sharedTurnSchema).safeParse(row.turns);
  return parsed.success ? parsed.data : null;
}
