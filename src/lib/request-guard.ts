import { ipAddress } from "@vercel/functions";
import { checkBotId } from "botid/server";
import { hashIp } from "@/lib/analytics";

export const MAX_BODY_BYTES = 32_000;
export const MAX_MESSAGES = 40;

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
