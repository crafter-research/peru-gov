import { expect, test } from "bun:test";
import { hashIp } from "@/lib/analytics";

test("ip hashes are stable within a day, differ across days, never contain the ip", () => {
  const a = hashIp("190.12.34.56", "2026-10-01");
  expect(hashIp("190.12.34.56", "2026-10-01")).toBe(a);
  expect(hashIp("190.12.34.56", "2026-10-02")).not.toBe(a);
  expect(a).not.toContain("190");
  expect(a).toHaveLength(16);
});
