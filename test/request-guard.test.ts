import { expect, test } from "bun:test";
import { MAX_BODY_BYTES, readJson } from "@/lib/request-guard";

const post = (body: string) =>
  new Request("http://x/api/chat", { method: "POST", body });

test("reads a normal JSON body", async () => {
  expect(await readJson(post('{"a":1}'))).toEqual({ a: 1 });
});

test("rejects bodies over the byte cap and invalid JSON", async () => {
  expect(await readJson(post(`"${"x".repeat(MAX_BODY_BYTES)}"`))).toBeNull();
  expect(await readJson(post("{nope"))).toBeNull();
});
