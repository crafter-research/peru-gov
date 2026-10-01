"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef } from "react";
import { Streamdown } from "streamdown";
import { Backdrop } from "@/components/backdrop";
import { Composer } from "@/components/composer";
import { FichaCard } from "@/components/ficha-card";
import type { PeruMessage } from "@/lib/messages";

const EXAMPLES = [
  "Me robaron el DNI",
  "Quiero sacar mi pasaporte",
  "Voy a trabajar como independiente",
  "Quiero sacar mi brevete",
];

type Ask = (text: string, hint?: number) => void;

export function Assistant({ initialQuestion }: { initialQuestion?: string }) {
  const { messages, sendMessage, status, error } = useChat<PeruMessage>({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });
  const busy = status === "submitted" || status === "streaming";
  const end = useRef<HTMLDivElement>(null);

  const ask: Ask = (text, hint) => {
    if (!text.trim() || busy) return;
    sendMessage({ text }, hint ? { body: { hint } } : undefined);
  };

  const asked = useRef(false);
  useEffect(() => {
    if (initialQuestion && !asked.current) {
      asked.current = true;
      sendMessage({ text: initialQuestion });
    }
  }, [initialQuestion, sendMessage]);

  const count = messages.length;
  useEffect(() => {
    if (count)
      end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [count]);

  if (!messages.length) {
    return (
      <main className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-7 px-4 pb-16">
        <Backdrop focused={false} />
        <div className="relative text-center">
          <div
            aria-hidden
            className="absolute -inset-x-24 -inset-y-16 -z-10 bg-black/25 backdrop-blur-xl [mask-image:radial-gradient(closest-side,#000_45%,transparent)]"
          />
          <h1 className="font-display text-[clamp(3rem,11vw,5.5rem)] leading-[0.95] font-normal tracking-[-0.02em] text-white">
            Hola, <em className="font-light italic">Perú</em>
          </h1>
          <p className="mt-4 text-[15px] text-white/80">
            Cuéntame tu situación y te llevo al trámite correcto de gob.pe.
          </p>
        </div>
        <Composer
          onSubmit={ask}
          busy={busy}
          placeholder="¿Qué necesitas? Por ejemplo, “perdí mi DNI”"
        />
        <div className="flex flex-wrap justify-center gap-2">
          {EXAMPLES.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => ask(e)}
              className="glass rounded-full px-3.5 py-1.5 text-[13px] text-white/90 transition duration-300 ease-smooth hover:-translate-y-0.5 hover:text-white"
            >
              {e}
            </button>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col px-4">
      <Backdrop focused />
      <div className="flex flex-1 flex-col gap-8 py-6">
        {messages.map((m, i) =>
          m.role === "user" ? (
            <p
              key={m.id}
              className="glass max-w-[85%] self-end rounded-3xl rounded-br-lg px-4 py-2.5 text-[15px]"
            >
              {m.parts.map((p) => (p.type === "text" ? p.text : "")).join("")}
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
          <p className="glass self-start rounded-2xl px-4 py-3 text-sm">
            No pude responder. Intenta de nuevo.
          </p>
        ) : null}
        <div ref={end} />
      </div>
      <div className="sticky bottom-0 z-20 -mx-4 bg-gradient-to-t from-black/70 via-black/40 to-transparent px-4 pt-8 pb-3">
        <Composer
          onSubmit={ask}
          busy={busy}
          placeholder="Pregunta otra cosa"
          solid
        />
      </div>
    </main>
  );
}

function Thinking() {
  return (
    <output className="flex items-center gap-2 text-sm text-white/70">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent/70" />
        <span className="relative inline-flex size-2 rounded-full bg-accent" />
      </span>
      Buscando en gob.pe…
    </output>
  );
}

function AssistantMessage({
  message,
  onAsk,
  streaming,
}: {
  message: PeruMessage;
  onAsk: Ask;
  streaming: boolean;
}) {
  const summary = message.parts
    .flatMap((p) => (p.type === "text" ? [p.text] : []))
    .join("");
  const rendered = (
    <Streamdown
      animated
      isAnimating={streaming}
      className="typeset text-[15px] text-white/90"
    >
      {summary}
    </Streamdown>
  );
  return (
    <div className="flex flex-col gap-3 animate-in">
      {message.parts.map((part, i) => {
        const key = `${message.id}-${i}`;
        switch (part.type) {
          case "data-route":
            return (
              <ol
                key={key}
                className="flex flex-wrap items-center gap-1.5 text-xs text-white/65"
              >
                {part.data.steps.map((s, j) => (
                  <li
                    key={`${s.label}-${s.value}`}
                    className="flex items-center gap-1.5"
                  >
                    {j > 0 ? (
                      <span aria-hidden className="text-white/35">
                        /
                      </span>
                    ) : null}
                    <span
                      className={
                        j === part.data.steps.length - 1
                          ? "text-white/90"
                          : undefined
                      }
                    >
                      {s.value}
                    </span>
                  </li>
                ))}
              </ol>
            );
          case "data-ficha":
            return (
              <FichaCard
                key={key}
                ficha={part.data}
                summary={summary ? rendered : undefined}
              />
            );
          case "data-variants":
            return (
              <ChipRow
                key={key}
                label="Otras variantes"
                items={part.data.items}
                onAsk={onAsk}
              />
            );
          case "data-related":
            return (
              <ChipRow
                key={key}
                label="También te puede servir"
                items={part.data.items}
                onAsk={onAsk}
              />
            );
          case "data-alternatives":
            return (
              <ChipRow
                key={key}
                label="¿Buscabas otra cosa?"
                items={part.data.items}
                onAsk={onAsk}
              />
            );
          case "data-clarify":
            return (
              <div key={key} className="glass glass-border rounded-3xl p-5">
                <p className="font-display text-xl">
                  ¿Cuál de estos trámites necesitas?
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  {part.data.options.map((o) => (
                    <button
                      key={o}
                      type="button"
                      onClick={() => onAsk(o)}
                      className="rounded-2xl bg-white/5 px-4 py-3 text-left text-[15px] transition duration-300 ease-smooth hover:bg-white/10"
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </div>
            );
          case "data-none":
            return (
              <div key={key} className="glass rounded-3xl p-5">
                <p className="text-[15px]">
                  No encontré ese trámite en el catálogo de gob.pe.
                </p>
                <a
                  className="mt-3 inline-flex text-sm text-accent underline underline-offset-4"
                  href={`https://www.gob.pe/busquedas?term=${encodeURIComponent(part.data.query)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Buscar directamente en gob.pe
                </a>
              </div>
            );
          case "data-limited":
            return (
              <p key={key} className="glass rounded-3xl p-4 text-sm">
                Hiciste muchas preguntas seguidas. Intenta de nuevo en{" "}
                {Math.ceil(part.data.retryAfterSeconds / 60)} min.
              </p>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}

function ChipRow({
  label,
  items,
  onAsk,
}: {
  label: string;
  items: { id: number; title: string }[];
  onAsk: Ask;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-white/60">{label}</span>
      <div className="flex flex-wrap gap-2">
        {items.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onAsk(c.title, c.id)}
            className="glass rounded-full px-3.5 py-1.5 text-left text-[13px] text-white/90 transition duration-300 ease-smooth first-letter:uppercase hover:-translate-y-0.5 hover:text-white"
          >
            {c.title}
          </button>
        ))}
      </div>
    </div>
  );
}
