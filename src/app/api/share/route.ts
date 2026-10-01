import { after } from "next/server";
import { createDurableLimiter, pruneRateLimits } from "@/lib/rate-limit";
import { clientKey, isBot, readJson } from "@/lib/request-guard";
import { createShare, shareSchema } from "@/lib/shares";

const WINDOW_MS = 10 * 60_000;
const limiter = createDurableLimiter("share", 10, WINDOW_MS);

export async function POST(req: Request) {
  if (await isBot())
    return Response.json({ error: "forbidden" }, { status: 403 });
  if (!(await limiter(clientKey(req).key)).ok)
    return Response.json({ error: "limited" }, { status: 429 });
  const body = await readJson(req);
  if (body === null)
    return Response.json({ error: "too large" }, { status: 413 });
  const parsed = shareSchema.safeParse(body);
  if (!parsed.success)
    return Response.json({ error: "invalid" }, { status: 400 });
  const id = await createShare(parsed.data.turns);
  if (!id) return Response.json({ error: "unavailable" }, { status: 503 });
  if (Math.random() < 0.01) after(() => pruneRateLimits(WINDOW_MS));
  return Response.json({ id, url: `/c/${id}` });
}
