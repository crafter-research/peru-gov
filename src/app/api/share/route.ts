import { createLimiter } from "@/lib/rate-limit";
import { createShare, shareSchema } from "@/lib/shares";

const limiter = createLimiter(10, 10 * 60_000);

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
  if (!limiter(ip).ok)
    return Response.json({ error: "limited" }, { status: 429 });
  const parsed = shareSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return Response.json({ error: "invalid" }, { status: 400 });
  const id = await createShare(parsed.data.turns);
  if (!id) return Response.json({ error: "unavailable" }, { status: 503 });
  return Response.json({ id, url: `/c/${id}` });
}
