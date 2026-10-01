import { expect, test } from "bun:test";
import { normalize, quantize, rrf, topK } from "@/lib/retrieve";

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

test("quantize maps unit floats to int8 without changing ranking", () => {
  expect([...quantize([1, -1, 0.5, 0])]).toEqual([127, -127, 64, 0]);
  const docs = new Int8Array([...quantize([1, 0]), ...quantize([0.6, 0.8])]);
  expect(topK(docs, 2, [0.5, 0.86], 2)).toEqual([1, 0]);
});
