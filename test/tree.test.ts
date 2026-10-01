import { expect, test } from "bun:test";
import { buildTree, variantLabel, variantsOf } from "@/corpus/tree";

const slugs = [
  "135-obtener-licencia-de-conducir-brevete-por-primera-vez",
  "136-obtener-licencia-de-conducir-brevete-por-primera-vez-condiciones",
  "137-obtener-licencia-de-conducir-brevete-por-primera-vez-licencia-de-conducir-para-adultos-mayores",
  "224-solicitar-duplicado-de-dni",
];

test("children extend the parent's slug", () => {
  const t = buildTree(slugs);
  expect(t.parent[136]).toBe(135);
  expect(t.parent[137]).toBe(135);
  expect(t.children[135]).toEqual([136, 137]);
  expect(t.parent[224]).toBeUndefined();
});

test("variants are children, or siblings plus parent for a variant", () => {
  const t = buildTree(slugs);
  expect(variantsOf(t, 135)).toEqual([136, 137]);
  expect(variantsOf(t, 136)).toEqual([135, 137]);
  expect(variantsOf(t, 224)).toEqual([]);
});

test("variant labels drop the parent's title", () => {
  const t = buildTree(slugs);
  expect(variantLabel(t, 136)).toBe("condiciones");
  expect(variantLabel(t, 137)).toBe(
    "licencia de conducir para adultos mayores",
  );
  expect(variantLabel(t, 135)).toBe(
    "obtener licencia de conducir brevete por primera vez",
  );
});
