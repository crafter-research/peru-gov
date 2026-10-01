"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  startTransition,
  useEffect,
  useRef,
  useState,
  ViewTransition,
} from "react";
import { Streamdown } from "streamdown";
import { Backdrop } from "@/components/backdrop";
import { Composer } from "@/components/composer";
import { FichaCard } from "@/components/ficha-card";
import { SiteHeader } from "@/components/site-header";
import type { PeruMessage } from "@/lib/messages";
import { useScrollToLatestQuestion } from "@/lib/use-scroll-to-question";

const EXAMPLES = [
  "Me robaron el DNI",
  "Quiero sacar mi pasaporte",
  "Voy a trabajar como independiente",
  "Quiero sacar mi brevete",
];

type Ask = (text: string, hint?: number) => void;

export function Assistant({ initialQuestion }: { initialQuestion?: string }) {
  // Anonymous per-conversation id for routing analytics; a new chat gets a new one.
  const session = useRef(crypto.randomUUID());
  const { messages, sendMessage, setMessages, stop, status, error } =
    useChat<PeruMessage>({
      transport: new DefaultChatTransport({
        api: "/api/chat",
        body: () => ({ sessionId: session.current }),
      }),
    });
  const busy = status === "submitted" || status === "streaming";
  const [started, setStarted] = useState(false);
  const chatting = started || messages.length > 0;
  const thread = useRef<HTMLDivElement>(null);
  useScrollToLatestQuestion(
    thread,
    messages.filter((m) => m.role === "user").length,
  );

  const ask: Ask = (text, hint) => {
    if (!text.trim() || busy) return;
    if (!chatting) startTransition(() => setStarted(true));
    sendMessage({ text }, hint ? { body: { hint } } : undefined);
  };

  const newChat = () => {
    if (busy) stop();
    session.current = crypto.randomUUID();
    startTransition(() => {
      setMessages([]);
      setStarted(false);
    });
  };

  const asked = useRef(false);
  useEffect(() => {
    if (initialQuestion && !asked.current) {
      asked.current = true;
      setStarted(true);
      sendMessage({ text: initialQuestion });
    }
  }, [initialQuestion, sendMessage]);

  return (
    <>
      <SiteHeader onHome={newChat} />
      <Backdrop focused={chatting} />
      {chatting ? (
        <main className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col px-4">
          <div ref={thread} className="flex flex-1 flex-col gap-8 py-6">
            {messages.map((m, i) =>
              m.role === "user" ? (
                <p
                  key={m.id}
                  data-question
                  className="glass glass-solid animate-in max-w-[85%] self-end rounded-3xl rounded-br-lg px-4 py-2.5 text-[15px]"
                >
                  {m.parts
                    .map((p) => (p.type === "text" ? p.text : ""))
                    .join("")}
                </p>
              ) : (
                <AssistantMessage
                  key={m.id}
                  message={m}
                  onAsk={ask}
                  streaming={busy && i === messages.length - 1}
                />
              ),
            )}
            {busy && messages.at(-1)?.role === "user" ? <Thinking /> : null}
            {error ? (
              <p className="glass glass-solid self-start rounded-2xl px-4 py-3 text-sm">
                No pude responder. Intenta de nuevo.
              </p>
            ) : null}
            <div aria-hidden className="h-[30dvh] shrink-0" />
          </div>
          <div
            aria-hidden
            className="pointer-events-none fixed inset-x-0 bottom-0 z-10 h-36 bg-gradient-to-t from-background via-background/60 to-transparent"
          />
          <div className="sticky bottom-0 z-20 pt-4 pb-3">
            <ViewTransition name="composer">
              <Composer
                onSubmit={ask}
                busy={busy}
                placeholder="Pregunta otra cosa"
              />
            </ViewTransition>
          </div>
        </main>
      ) : (
        <main className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-7 px-4 pb-16">
          <ViewTransition name="hero" exit="hero-exit" enter="hero-enter">
            <div className="relative text-center">
              <div
                aria-hidden
                className="absolute -inset-x-24 -inset-y-16 -z-10 bg-background/45 backdrop-blur-xl dark:bg-background/25 [mask-image:radial-gradient(closest-side,#000_45%,transparent)]"
              />
              <h1 className="font-display text-[clamp(3rem,11vw,5.5rem)] leading-[0.95] font-normal tracking-[-0.02em] text-foreground">
                Hola, <em className="font-light italic">Perú</em>
              </h1>
              <p className="mt-4 text-[15px] text-foreground/85">
                Cuéntame tu situación y te llevo al trámite correcto de gob.pe.
              </p>
            </div>
          </ViewTransition>
          <ViewTransition name="composer">
            <Composer
              onSubmit={ask}
              busy={busy}
              placeholder="¿Qué necesitas? Por ejemplo, “perdí mi DNI”"
            />
          </ViewTransition>
          <ViewTransition name="examples" exit="hero-exit" enter="hero-enter">
            <div className="flex flex-wrap justify-center gap-2">
              {EXAMPLES.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => ask(e)}
                  className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-[13px] text-foreground shadow-[0_8px_24px_-12px_rgb(0_0_0/0.7)] transition duration-300 ease-smooth hover:-translate-y-0.5 hover:border-accent/40 hover:text-foreground"
                >
                  {e}
                </button>
              ))}
            </div>
          </ViewTransition>
        </main>
      )}
    </>
  );
}

function Thinking() {
  return (
    <output className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent/70" />
        <span className="relative inline-flex size-2 rounded-full bg-accent" />
      </span>
      Buscando en gob.pe…
    </output>
  );
}

type DataPart<T extends PeruMessage["parts"][number]["type"]> = Extract<
  PeruMessage["parts"][number],
  { type: T }
>;

/**
 * Reading order: where we routed → the streamed answer → the official ficha → next steps.
 * The ficha and chips wait for the answer to finish so static content never jumps under live text.
 */
function AssistantMessage({
  message,
  onAsk,
  streaming,
}: {
  message: PeruMessage;
  onAsk: Ask;
  streaming: boolean;
}) {
  const find = <T extends PeruMessage["parts"][number]["type"]>(type: T) =>
    message.parts.find((p) => p.type === type) as DataPart<T> | undefined;
  const summary = message.parts
    .flatMap((p) => (p.type === "text" ? [p.text] : []))
    .join("");
  const route = find("data-route");
  const ficha = find("data-ficha");
  const variants = find("data-variants");
  const related = find("data-related");
  const alternatives = find("data-alternatives");
  const clarify = find("data-clarify");
  const none = find("data-none");
  const limited = find("data-limited");
  const district = find("data-district");
  const settled = !streaming;

  return (
    <div className="flex flex-col gap-4">
      {route ? (
        <ol className="animate-in flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          {route.data.steps.map((s, j) => (
            <li
              key={`${s.label}-${s.value}`}
              className="flex items-center gap-1.5"
            >
              {j > 0 ? (
                <span aria-hidden className="text-muted-foreground/50">
                  /
                </span>
              ) : null}
              <span
                className={
                  j === route.data.steps.length - 1
                    ? "text-foreground"
                    : undefined
                }
              >
                {s.value}
              </span>
            </li>
          ))}
        </ol>
      ) : null}

      {ficha ? (
        <div className="animate-in">
          {summary ? (
            <Streamdown
              animated
              isAnimating={streaming}
              className="typeset text-[16px] text-foreground"
            >
              {summary}
            </Streamdown>
          ) : (
            <AnswerSkeleton />
          )}
        </div>
      ) : null}

      {district && settled ? (
        <p className="animate-in rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 text-[13px] leading-relaxed text-foreground/90">
          Este trámite es de la{" "}
          <strong className="font-semibold">
            Municipalidad de {district.data.place}
          </strong>
          . Cada municipalidad tiene el suyo: dime en qué distrito estás y busco
          el tuyo.
        </p>
      ) : null}

      {ficha && settled ? (
        <div className="animate-in">
          <FichaCard ficha={ficha.data} />
        </div>
      ) : null}

      {settled && (variants || related || alternatives) ? (
        <NextSteps
          steps={[
            ...(variants?.data.items ?? []),
            ...(related?.data.items ?? []),
          ]}
          alternatives={alternatives?.data.items ?? []}
          onAsk={onAsk}
        />
      ) : null}

      {clarify ? (
        <div className="animate-in glass glass-solid glass-border rounded-3xl p-5">
          <p className="font-display text-xl">
            ¿Cuál de estos trámites necesitas?
          </p>
          <div className="mt-4 flex flex-col gap-2">
            {clarify.data.options.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => onAsk(o)}
                className="rounded-2xl bg-foreground/5 px-4 py-3 text-left text-[15px] transition duration-300 ease-smooth hover:bg-foreground/10"
              >
                {o}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {none ? (
        <div className="animate-in glass glass-solid rounded-3xl p-5">
          <p className="text-[15px]">
            No encontré ese trámite en el catálogo de gob.pe.
          </p>
          <a
            className="mt-3 inline-flex text-sm text-accent underline underline-offset-4"
            href={`https://www.gob.pe/busquedas?term=${encodeURIComponent(none.data.query)}`}
            target="_blank"
            rel="noreferrer"
          >
            Buscar directamente en gob.pe
          </a>
        </div>
      ) : null}

      {limited ? (
        <p className="animate-in glass glass-solid rounded-3xl p-4 text-sm">
          Hiciste muchas preguntas seguidas. Intenta de nuevo en{" "}
          {Math.ceil(limited.data.retryAfterSeconds / 60)} min.
        </p>
      ) : null}
    </div>
  );
}

function AnswerSkeleton() {
  return (
    <div className="flex flex-col gap-2.5" aria-hidden>
      {["w-11/12", "w-10/12", "w-7/12"].map((w) => (
        <div
          key={w}
          className={`h-3.5 ${w} animate-pulse rounded-full bg-foreground/10`}
        />
      ))}
    </div>
  );
}

type Item = { id: number; title: string };

/** One horizontal row of next steps; alternatives stay folded so the answer keeps the stage. */
function NextSteps({
  steps,
  alternatives,
  onAsk,
}: {
  steps: Item[];
  alternatives: Item[];
  onAsk: Ask;
}) {
  return (
    <div className="animate-in flex flex-col gap-2 [animation-delay:120ms]">
      {steps.length ? (
        <div className="flex snap-x gap-2 overflow-x-auto pr-8 pb-1 [mask-image:linear-gradient(to_right,#000_85%,transparent)] [scrollbar-width:none]">
          {steps.map((c) => (
            <Chip key={c.id} item={c} onAsk={onAsk} />
          ))}
        </div>
      ) : null}
      {alternatives.length ? (
        <details className="group">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-xs text-muted-foreground transition hover:text-foreground [&::-webkit-details-marker]:hidden">
            ¿Buscabas otra cosa?{" "}
            <span className="text-muted-foreground/60">
              ({alternatives.length})
            </span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
              className="transition-transform duration-300 group-open:rotate-180"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </summary>
          <div className="mt-2 flex flex-wrap gap-2">
            {alternatives.map((c) => (
              <Chip key={c.id} item={c} onAsk={onAsk} />
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}

function Chip({ item, onAsk }: { item: Item; onAsk: Ask }) {
  return (
    <button
      type="button"
      onClick={() => onAsk(item.title, item.id)}
      className="shrink-0 snap-start rounded-full border border-border bg-surface px-3 py-1.5 text-left text-[13px] text-foreground/90 transition duration-300 ease-smooth first-letter:uppercase hover:-translate-y-0.5 hover:border-accent/40 hover:text-foreground"
    >
      {item.title}
    </button>
  );
}
