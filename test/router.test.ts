import { describe, expect, test } from "bun:test";
import { type Candidate, decide, type RouterDeps, route } from "@/lib/router";

const cands: Candidate[] = [
  { id: 224, title: "Solicitar duplicado de DNI" },
  { id: 174, title: "Obtener pasaporte electrónico" },
];
const deps = (picked: number | null, rewrites: string[] = []): RouterDeps => ({
  rewrite: async () => rewrites,
  candidates: async () => cands,
  pick: async () => picked,
});

describe("decide", () => {
  test("leaf keeps the rest as alternatives", () => {
    expect(decide(224, [], cands)).toEqual({
      kind: "leaf",
      id: 224,
      alternatives: [cands[1]],
    });
  });
  test("alternatives drop titles that repeat (consulate copies)", () => {
    const dup = [
      ...cands,
      { id: 9, title: "Obtener pasaporte electrónico" },
      { id: 10, title: "Solicitar duplicado de DNI" },
    ];
    expect(decide(224, [], dup)).toEqual({
      kind: "leaf",
      id: 224,
      alternatives: [cands[1]],
    });
  });
  test("none with rewrites asks", () => {
    expect(decide(null, ["Renovar DNI", "Duplicado de DNI"], cands)).toEqual({
      kind: "ask",
      options: ["Renovar DNI", "Duplicado de DNI"],
    });
  });
  test("none without rewrites is out of catalog", () => {
    expect(decide(null, [], cands)).toEqual({ kind: "none" });
  });
});

describe("route", () => {
  test("hint skips the model", async () => {
    const r = await route(
      "x",
      {
        ...deps(null),
        pick: async () => {
          throw new Error("called");
        },
      },
      174,
    );
    expect(r).toEqual({ kind: "leaf", id: 174, alternatives: [] });
  });
  test("a pick outside the candidate set is treated as NONE", async () => {
    expect(await route("x", deps(999))).toEqual({ kind: "none" });
  });
  test("picked candidate routes to leaf", async () => {
    expect((await route("me robaron el dni", deps(224))).kind).toBe("leaf");
  });
});
