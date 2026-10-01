import { existsSync } from "node:fs";
import path from "node:path";
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
} from "ai";
import { after } from "next/server";
import { logRouteEvent, type RouteEvent } from "@/lib/analytics";
import { allFichas, loadOrFetchFicha } from "@/lib/fichas";
import type { ChatBody, PeruMessage } from "@/lib/messages";
import { needsDistrict } from "@/lib/municipal";
import { createDurableLimiter, pruneRateLimits } from "@/lib/rate-limit";
import { clientKey, isBot, MAX_MESSAGES, readJson } from "@/lib/request-guard";
import { retrieve } from "@/lib/retrieve";
import { rewrite } from "@/lib/rewrite";
import { type Candidate, jevPick, route } from "@/lib/router";
import { pathFor, variantCandidates, variantsAndRelated } from "@/lib/tree";

export const maxDuration = 30;

const WINDOW_MS = 10 * 60_000;
const limiter = createDurableLimiter("chat", 20, WINDOW_MS);

const ANSWER_INSTRUCTIONS =
  "Eres un asistente no oficial que explica trámites del Estado peruano. Responde en 2 o 3 oraciones, en español claro, usando SOLO la ficha oficial dada. No menciones requisitos, costos ni plazos que no estén en la ficha. No inventes. Los detalles se muestran aparte; no los repitas en lista.";

const HAS_CATALOG = existsSync(path.join(process.cwd(), "data", "catalog.i8"));

/** Full catalog retrieval when embedded; otherwise the extracted fichas are the whole candidate set. */
async function candidates(
  question: string,
  rewrites: string[],
): Promise<Candidate[]> {
  if (HAS_CATALOG) return retrieve(question, rewrites);
  return [...(await allFichas()).values()].map((f) => ({
    id: f.id,
    title: f.title,
  }));
}

/** The ficha the user was last shown, so follow-ups like "¿y si soy menor?" stay on topic. */
function previousFicha(
  messages: PeruMessage[],
): { id: number; title: string } | undefined {
  for (const m of [...messages].reverse()) {
    const part = m.parts.find((p) => p.type === "data-ficha");
    if (part?.type === "data-ficha")
      return { id: part.data.id, title: part.data.title };
  }
  return undefined;
}

function lastUserText(messages: PeruMessage[]): string {
  const last = messages.findLast((m) => m.role === "user");
  return (
    last?.parts
      .flatMap((p) => (p.type === "text" ? [p.text] : []))
      .join(" ")
      .trim() ?? ""
  );
}

export async function POST(req: Request) {
  if (await isBot())
    return Response.json({ error: "forbidden" }, { status: 403 });
  const body = (await readJson(req)) as
    | ({ messages?: PeruMessage[]; sessionId?: string } & ChatBody)
    | null;
  if (
    !body ||
    !Array.isArray(body.messages) ||
    body.messages.length > MAX_MESSAGES
  )
    return Response.json({ error: "too large" }, { status: 413 });
  const { messages, hint, sessionId } = body as {
    messages: PeruMessage[];
    sessionId?: string;
  } & ChatBody;
  const started = Date.now();
  const question = lastUserText(messages).slice(0, 500);
  const { ip, key } = clientKey(req);
  const allowed = await limiter(key);
  if (!allowed.ok) {
    const stream = createUIMessageStream<PeruMessage>({
      execute: ({ writer }) => {
        writer.write({ type: "start" });
        writer.write({
          type: "data-limited",
          data: { retryAfterSeconds: allowed.retryAfterSeconds },
        });
      },
    });
    return createUIMessageStreamResponse({ stream });
  }
  if (Math.random() < 0.01) after(() => pruneRateLimits(WINDOW_MS));
  const event: RouteEvent = {
    sessionId: sessionId ?? "anon",
    turn: messages.filter((m) => m.role === "user").length,
    question,
    hintId: hint,
    kind: "error",
    ip,
  };
  after(() =>
    logRouteEvent({
      ...event,
      latencyMs: event.latencyMs ?? Date.now() - started,
    }),
  );

  const stream = createUIMessageStream<PeruMessage>({
    onError: (error) => {
      console.error("chat route failed", error);
      event.kind = "error";
      event.error = error instanceof Error ? error.message : String(error);
      return "No pude responder. Intenta de nuevo.";
    },
    execute: async ({ writer }) => {
      writer.write({ type: "start" });
      const topic = previousFicha(messages);
      event.topicId = topic?.id;
      const withVariants = async (q: string, rewrites: string[]) => {
        event.rewrites = rewrites;
        const found = await candidates(q, rewrites);
        event.candidates = found;
        if (!topic) return found;
        const extra = (await variantCandidates(topic.id)).filter(
          (v) => !found.some((f) => f.id === v.id),
        );
        event.candidates = [...extra, ...found].slice(0, 30);
        return event.candidates;
      };
      const routed = topic
        ? `Contexto: la persona venía consultando "${topic.title}". Ahora pregunta: ${question}`
        : question;
      const result = await route(
        routed,
        { rewrite, candidates: withVariants, pick: jevPick },
        hint,
      );

      event.kind = result.kind;
      if (result.kind === "none") {
        writer.write({ type: "data-none", data: { query: question } });
        return;
      }
      if (result.kind === "ask") {
        writer.write({
          type: "data-clarify",
          data: { options: result.options },
        });
        return;
      }

      const ficha = await loadOrFetchFicha(result.id);
      if (!ficha) {
        event.kind = "none";
        writer.write({ type: "data-none", data: { query: question } });
        return;
      }
      writer.write({
        type: "data-route",
        data: { steps: await pathFor(ficha) },
      });
      writer.write({ type: "data-ficha", data: ficha });
      event.ficha = { id: ficha.id, title: ficha.title, entity: ficha.entity };
      event.latencyMs = Date.now() - started;
      const userText = messages
        .filter((m) => m.role === "user")
        .flatMap((m) =>
          m.parts.flatMap((p) => (p.type === "text" ? [p.text] : [])),
        )
        .join(" ");
      const place = needsDistrict(ficha.entity, userText);
      if (place) {
        event.district = place;
        writer.write({ type: "data-district", data: { place } });
      }
      const { variants, related } = await variantsAndRelated(ficha);
      if (variants.length)
        writer.write({ type: "data-variants", data: { items: variants } });
      if (related.length)
        writer.write({ type: "data-related", data: { items: related } });
      if (result.alternatives.length)
        writer.write({
          type: "data-alternatives",
          data: { items: result.alternatives.slice(0, 3) },
        });

      const summary = streamText({
        model: "google/gemini-2.5-flash-lite",
        temperature: 0,
        instructions: ANSWER_INSTRUCTIONS,
        prompt: `Pregunta: ${question}\n\nFicha oficial (JSON):\n${JSON.stringify({ title: ficha.title, entity: ficha.entity, sections: ficha.sections })}`,
      });
      writer.merge(
        toUIMessageStream({ stream: summary.stream, sendStart: false }),
      );
    },
  });
  return createUIMessageStreamResponse({ stream });
}
