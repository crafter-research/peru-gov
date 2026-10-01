import { expect, test } from "bun:test";
import { shareSchema } from "@/lib/shares";

const turn = {
  question: "me robaron el dni",
  summary: "Puedes pedir un duplicado.",
  ficha: {
    id: 224,
    title: "Solicitar duplicado de DNI",
    entity: "RENIEC",
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
  expect(
    shareSchema.safeParse({
      turns: [
        { ...turn, ficha: { ...turn.ficha, url: "javascript:alert(1)" } },
      ],
    }).success,
  ).toBe(false);
});
