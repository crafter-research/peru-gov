import { ipAddress } from "@vercel/functions";
import { checkBotId } from "botid/server";
import { hashIp } from "@/lib/analytics";
import { MAX_FICHA_ID } from "@/lib/ficha";

export const MAX_BODY_BYTES = 32_000;
export const MAX_MESSAGES = 40;
export { MAX_FICHA_ID };

/** Client IP as Vercel reports it, hashed so limiter keys never store the address. */
export function clientKey(req: Request): { ip: string; key: string } {
  const ip = ipAddress(req) ?? "local";
  return { ip, key: hashIp(ip) };
}

/** BotID only classifies on Vercel; local `next start` has no BotID headers to read. */
export async function isBot(): Promise<boolean> {
  if (!process.env.VERCEL) return false;
  return (await checkBotId()).isBot;
}

/** Reads a JSON body with a byte cap; returns null when it is too large or not JSON. */
export async function readJson(req: Request): Promise<unknown | null> {
  const type = req.headers.get("content-type") ?? "";
  if (!type.includes("application/json")) return null;
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) return null;
  const text = await req.text();
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

type MessageShape = { role: unknown; parts: unknown[] };

const isMessageShape = (m: unknown): m is MessageShape =>
  typeof m === "object" &&
  m !== null &&
  typeof (m as MessageShape).role === "string" &&
  Array.isArray((m as MessageShape).parts) &&
  (m as MessageShape).parts.every(
    (p) =>
      typeof p === "object" &&
      p !== null &&
      typeof (p as { type: unknown }).type === "string",
  );

/**
 * Runtime shape of a chat request. `hint` must be a plausible ficha id: it later becomes
 * the argument of an outbound fetch, so an unvalidated string here would be SSRF.
 */
export function parseChatBody<T>(body: unknown):
  | ({
      messages: T[];
      sessionId?: string;
      hint?: number;
    } & Record<string, unknown>)
  | null {
  if (typeof body !== "object" || body === null) return null;
  const b = body as Record<string, unknown>;
  if (!Array.isArray(b.messages) || b.messages.length > MAX_MESSAGES)
    return null;
  if (!b.messages.every(isMessageShape)) return null;
  let hint: number | undefined;
  if (b.hint !== undefined) {
    if (
      typeof b.hint !== "number" ||
      !Number.isInteger(b.hint) ||
      b.hint <= 0 ||
      b.hint > MAX_FICHA_ID
    )
      return null;
    hint = b.hint;
  }
  const sessionId =
    typeof b.sessionId === "string" && b.sessionId.length <= 64
      ? b.sessionId
      : undefined;
  return {
    ...(b as Record<string, unknown>),
    messages: b.messages as T[],
    hint,
    sessionId,
  } as { messages: T[]; sessionId?: string; hint?: number } & Record<
    string,
    unknown
  >;
}
