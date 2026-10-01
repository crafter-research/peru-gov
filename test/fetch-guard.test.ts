import { expect, test } from "bun:test";
import { assertGobPeUrl } from "@/corpus/extract";

test("assertGobPeUrl accepts gob.pe pages over https", () => {
  expect(assertGobPeUrl("https://www.gob.pe/224").hostname).toBe("www.gob.pe");
});

test("assertGobPeUrl refuses every other host and scheme", () => {
  expect(() => assertGobPeUrl("https://evil.com/224")).toThrow();
  expect(() => assertGobPeUrl("http://www.gob.pe/224")).toThrow();
  expect(() => assertGobPeUrl("https://gob.pe/224")).toThrow();
  expect(() => assertGobPeUrl("https://www.gob.pe.evil.com/")).toThrow();
  expect(() => assertGobPeUrl("https://169.254.169.254/")).toThrow();
});
