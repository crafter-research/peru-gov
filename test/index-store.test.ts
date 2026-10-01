import { expect, test } from "bun:test";
import { completeness, mergeScan, needsFetch } from "@/corpus/index-store";

const e = (id: number, lastmod: string | null = "2026-09-01T00:00:00Z") => ({
  url: `https://www.gob.pe/${id}-x`,
  id,
  slug: `${id}-x`,
  lastmod,
});

test("an incomplete scan marks entries missing instead of dropping them", () => {
  const first = mergeScan(null, [e(1), e(2)], "2026-09-01T00:00:00Z");
  const second = mergeScan(first, [e(1)], "2026-09-02T00:00:00Z");
  expect(Object.keys(second.entries)).toEqual(["1", "2"]);
  expect(second.entries[2].missingSince).toBe("2026-09-02T00:00:00Z");
  expect(completeness(first, second).ratio).toBe(0.5);
});

test("a recovered entry clears missingSince and keeps fetchedAt", () => {
  const a = mergeScan(null, [e(1)], "t1");
  a.entries[1].fetchedAt = "2026-09-05T00:00:00Z";
  const b = mergeScan(mergeScan(a, [], "t2"), [e(1)], "t3");
  expect(b.entries[1]).toMatchObject({
    missingSince: null,
    fetchedAt: "2026-09-05T00:00:00Z",
  });
});

test("needsFetch only when never fetched or lastmod is newer", () => {
  const base = { ...e(1), missingSince: null };
  expect(needsFetch({ ...base, fetchedAt: null })).toBe(true);
  expect(needsFetch({ ...base, fetchedAt: "2026-09-05T00:00:00Z" })).toBe(
    false,
  );
  expect(
    needsFetch({
      ...base,
      lastmod: "2026-09-10T00:00:00Z",
      fetchedAt: "2026-09-05T00:00:00Z",
    }),
  ).toBe(true);
  expect(needsFetch({ ...base, fetchedAt: null, missingSince: "t" })).toBe(
    false,
  );
});
