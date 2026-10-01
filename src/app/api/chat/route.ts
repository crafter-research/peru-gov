import { existsSync } from "node:fs";
import path from "node:path";
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
} from "ai";
import { allFichas, loadOrFetchFicha } from "@/lib/fichas";
import type { ChatBody, PeruMessage } from "@/lib/messages";
import { retrieve } from "@/lib/retrieve";
import { rewrite } from "@/lib/rewrite";
import { type Candidate, jevPick, route } from "@/lib/router";
import { pathFor, variantsAndRelated } from "@/lib/tree";

export const maxDuration = 30;

const ANSWER_INSTRUCTIONS =
  "Eres un asistente no oficial que explica trámites del Estado peruano. Responde en 2 o 3 oraciones, en español claro, usando SOLO la ficha oficial dada. No menciones requisitos, costos ni plazos que no estén en la ficha. No inventes. Los detalles se muestran aparte; no los repitas en lista.";

const HAS_CATALOG = existsSync(path.join(process.cwd(), "data", "catalog.f32"));

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
  const { messages, hint }: { messages: PeruMessage[] } & ChatBody =
    await req.json();
  const question = lastUserText(messages).slice(0, 500);

  const stream = createUIMessageStream<PeruMessage>({
    execute: async ({ writer }) => {
      writer.write({ type: "start" });
      const result = await route(
        question,
        { rewrite, candidates, pick: jevPick },
        hint,
      );

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
        writer.write({ type: "data-none", data: { query: question } });
        return;
      }
      writer.write({
        type: "data-route",
        data: { steps: await pathFor(ficha) },
      });
      writer.write({ type: "data-ficha", data: ficha });
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
