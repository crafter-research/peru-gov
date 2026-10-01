import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
} from "ai";
import { allFichas, loadFicha } from "@/lib/fichas";
import type { ChatBody, PeruMessage } from "@/lib/messages";
import { rewrite } from "@/lib/rewrite";
import { type Candidate, jevPick, route } from "@/lib/router";

export const maxDuration = 30;

const ANSWER_INSTRUCTIONS =
  "Eres un asistente no oficial que explica trámites del Estado peruano. Responde en 2 o 3 oraciones, en español claro, usando SOLO la ficha oficial dada. No menciones requisitos, costos ni plazos que no estén en la ficha. No inventes. Los detalles se muestran aparte; no los repitas en lista.";

async function seedCandidates(): Promise<Candidate[]> {
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
        { rewrite, candidates: seedCandidates, pick: jevPick },
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

      const ficha = await loadFicha(result.id);
      if (!ficha) {
        writer.write({ type: "data-none", data: { query: question } });
        return;
      }
      writer.write({
        type: "data-route",
        data: {
          steps: [
            { label: "Entidad", value: ficha.entity },
            { label: ficha.kind, value: ficha.title },
          ],
        },
      });
      writer.write({ type: "data-ficha", data: ficha });
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
