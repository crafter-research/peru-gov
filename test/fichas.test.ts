import { expect, test } from "bun:test";
import { allFichas, loadFicha } from "@/lib/fichas";

test("seed fichas load and validate", async () => {
  const all = await allFichas();
  expect(all.size).toBeGreaterThanOrEqual(6);
  expect((await loadFicha(224))?.title).toBe("Solicitar duplicado de DNI");
  expect(await loadFicha(999999999)).toBeUndefined();
});
