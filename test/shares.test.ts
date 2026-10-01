import { expect, test } from "bun:test";
import type { Ficha } from "@/lib/ficha";
import { resolveShareTurns, shareSchema } from "@/lib/shares";

const turn = {
  question: "me robaron el dni",
  summary: "Puedes pedir un duplicado.",
  ficha: {
    id: 224,
    title: "Título cualquiera que no es el oficial",
    entity: "Entidad cualquiera",
    url: "https://www.gob.pe/224",
  },
};

test("share payloads are bounded and typed", () => {
  expect(shareSchema.safeParse({ turns: [turn] }).success).toBe(true);
  expect(shareSchema.safeParse({ turns: [] }).success).toBe(false);
  expect(
    shareSchema.safeParse({ turns: [{ ...turn, question: "x".repeat(501) }] })
      .success,
  ).toBe(false);
});

test("client-sent ficha fields are stripped down to the id", () => {
  const parsed = shareSchema.parse({ turns: [turn] });
  expect(parsed.turns[0].ficha).toEqual({ id: 224 });
});

const canonicalFicha: Ficha = {
  id: 224,
  slug: "224-solicitar-duplicado-de-dni",
  url: "https://www.gob.pe/224-solicitar-duplicado-de-dni",
  title: "Solicitar duplicado de DNI",
  kind: "Trámite",
  entity: "Registro Nacional de Identificación y Estado Civil",
  sections: [],
  costs: [],
  links: [],
  lastChanged: null,
  extractedAt: "2026-09-30T00:00:00.000Z",
};

test("resolveShareTurns replaces ficha fields with the canonical record", async () => {
  const [resolved] = await resolveShareTurns(
    shareSchema.parse({ turns: [turn] }).turns,
    async () => canonicalFicha,
  );
  expect(resolved.ficha?.title).toBe("Solicitar duplicado de DNI");
  expect(resolved.ficha?.entity).toBe(
    "Registro Nacional de Identificación y Estado Civil",
  );
  expect(resolved.ficha?.url).toBe(
    "https://www.gob.pe/224-solicitar-duplicado-de-dni",
  );
});

test("resolveShareTurns drops the card for unknown ids and redacts PII", async () => {
  const [resolved] = await resolveShareTurns(
    shareSchema.parse({
      turns: [{ ...turn, question: "mi dni es 12345678", ficha: { id: 999 } }],
    }).turns,
    async () => undefined,
  );
  expect(resolved.ficha).toBeNull();
  expect(resolved.question).toBe("mi dni es [documento]");
});
