import { randomBytes } from "node:crypto";
import { z } from "zod";
import { sql } from "@/lib/db";
import type { Ficha } from "@/lib/ficha";
import { loadOrFetchFicha } from "@/lib/fichas";
import { redactPii } from "@/lib/redact";

export const sharedTurnSchema = z.object({
  question: z.string().min(1).max(500),
  summary: z.string().max(2000),
  // Only the id is taken from the client; title, entity and url come from the
  // canonical ficha, so a shared card can never show made-up "official" text.
  ficha: z.object({ id: z.number().int().positive() }).nullable(),
});
export const shareSchema = z.object({
  turns: z.array(sharedTurnSchema).min(1).max(10),
});
export type SharedTurn = Omit<z.infer<typeof sharedTurnSchema>, "ficha"> & {
  ficha: Pick<Ficha, "id" | "title" | "entity" | "url"> | null;
};

/** Replaces client-sent ficha fields with the canonical record; unknown ids drop the card. */
export async function resolveShareTurns(
  turns: z.infer<typeof shareSchema>["turns"],
  lookup: (id: number) => Promise<Ficha | undefined> = loadOrFetchFicha,
): Promise<SharedTurn[]> {
  return Promise.all(
    turns.map(async (t) => {
      const ficha = t.ficha ? await lookup(t.ficha.id) : undefined;
      return {
        question: redactPii(t.question),
        summary: redactPii(t.summary),
        ficha: ficha
          ? {
              id: ficha.id,
              title: ficha.title,
              entity: ficha.entity,
              url: ficha.url,
            }
          : null,
      };
    }),
  );
}

/** Stores a redacted snapshot and returns its public id. */
export async function createShare(
  turns: z.infer<typeof shareSchema>["turns"],
): Promise<string | null> {
  if (!sql) return null;
  const id = randomBytes(8).toString("base64url");
  const clean = await resolveShareTurns(turns);
  await sql`insert into shares (id, turns) values (${id}, ${JSON.stringify(clean)})`;
  return id;
}

const storedTurnSchema = z.object({
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

export async function getShare(id: string): Promise<SharedTurn[] | null> {
  if (!sql || !/^[\w-]{6,24}$/.test(id)) return null;
  const [row] = await sql`select turns from shares where id = ${id}`;
  if (!row) return null;
  const parsed = z.array(storedTurnSchema).safeParse(row.turns);
  return parsed.success ? parsed.data : null;
}

/** A share is a convenience snapshot, not a record: links expire after 90 days. */
export async function pruneShares(days = 90, now = new Date()) {
  if (!sql) return;
  await sql`delete from shares where created_at < ${now.toISOString()}::timestamptz - make_interval(days => ${days})`;
}
