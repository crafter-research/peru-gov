import { expect, test } from "bun:test";
import { normalize, rrf, topK } from "@/lib/retrieve";

test("topK ranks by dot product", () => {
  const v = new Float32Array([1, 0, 0, 1, 0.7, 0.7]);
  expect(topK(v, 2, [1, 0], 2)).toEqual([0, 2]);
});

test("rrf rewards rows ranked well across lists", () => {
  expect(
    rrf(
      [
        [1, 2, 3],
        [2, 1, 4],
        [2, 5],
      ],
      2,
    ),
  ).toEqual([2, 1]);
});

test("normalize strips accents", () => {
  expect(normalize("Carné de Extranjería")).toBe("carne de extranjeria");
});
