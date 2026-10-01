import { expect, test } from "bun:test";
import {
  MAX_BODY_BYTES,
  MAX_MESSAGES,
  parseChatBody,
  readJson,
} from "@/lib/request-guard";

const post = (body: string, type = "application/json") =>
  new Request("http://x/api/chat", {
    method: "POST",
    body,
    headers: { "content-type": type },
  });

test("reads a normal JSON body", async () => {
  expect(await readJson(post('{"a":1}'))).toEqual({ a: 1 });
});

test("rejects bodies over the byte cap and invalid JSON", async () => {
  expect(await readJson(post(`"${"x".repeat(MAX_BODY_BYTES)}"`))).toBeNull();
  expect(await readJson(post("{nope"))).toBeNull();
});

test("rejects non-JSON content types, including text/plain form posts", async () => {
  expect(await readJson(post('{"a":1}', "text/plain"))).toBeNull();
  expect(await readJson(post('{"a":1}', ""))).toBeNull();
});

const msg = (text: string) => ({
  role: "user",
  parts: [{ type: "text", text }],
});

test("parseChatBody accepts a normal chat payload", () => {
  const parsed = parseChatBody({
    messages: [msg("hola")],
    hint: 224,
    sessionId: "abc",
  });
  expect(parsed?.hint).toBe(224);
  expect(parsed?.sessionId).toBe("abc");
});

test("parseChatBody rejects a string hint: it feeds an outbound fetch", () => {
  expect(
    parseChatBody({ messages: [msg("hola")], hint: "https://evil.com" }),
  ).toBeNull();
  expect(parseChatBody({ messages: [msg("hola")], hint: "224" })).toBeNull();
});

test("parseChatBody rejects out-of-range and fractional hint ids", () => {
  expect(parseChatBody({ messages: [msg("h")], hint: 0 })).toBeNull();
  expect(parseChatBody({ messages: [msg("h")], hint: -5 })).toBeNull();
  expect(parseChatBody({ messages: [msg("h")], hint: 1.5 })).toBeNull();
  expect(parseChatBody({ messages: [msg("h")], hint: 99_999_999 })).toBeNull();
});

test("parseChatBody rejects malformed message arrays", () => {
  expect(parseChatBody({ messages: "hola" })).toBeNull();
  expect(parseChatBody({ messages: [{ role: "user" }] })).toBeNull();
  expect(parseChatBody({ messages: [{ role: 1, parts: [] }] })).toBeNull();
  expect(
    parseChatBody({
      messages: Array.from({ length: MAX_MESSAGES + 1 }, () => msg("x")),
    }),
  ).toBeNull();
  expect(parseChatBody(null)).toBeNull();
});

test("parseChatBody rejects non-object parts: they would crash the route with a 500", () => {
  expect(
    parseChatBody({ messages: [{ role: "user", parts: [null] }] }),
  ).toBeNull();
  expect(
    parseChatBody({ messages: [{ role: "user", parts: [42] }] }),
  ).toBeNull();
  expect(
    parseChatBody({
      messages: [{ role: "user", parts: [{ text: "sin type" }] }],
    }),
  ).toBeNull();
});
