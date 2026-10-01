"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { FichaCard } from "@/components/ficha-card";
import type { PeruMessage } from "@/lib/messages";

const EXAMPLES = [
  "Me robaron el DNI",
  "Quiero sacar mi pasaporte",
  "Voy a trabajar como independiente",
  "Quiero sacar mi brevete",
];

export function Assistant({ initialQuestion }: { initialQuestion?: string }) {
  const { messages, sendMessage, status, error } = useChat<PeruMessage>({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });
  const [input, setInput] = useState("");
  const busy = status === "submitted" || status === "streaming";

  const ask = (text: string, hint?: number) => {
    if (!text.trim() || busy) return;
    sendMessage({ text }, hint ? { body: { hint } } : undefined);
    setInput("");
  };
  const asked = useRef(false);
  useEffect(() => {
    if (initialQuestion && !asked.current) {
      asked.current = true;
      sendMessage({ text: initialQuestion });
    }
  }, [initialQuestion, sendMessage]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    ask(input);
  };

  const composer = (
    <form
      onSubmit={onSubmit}
      className="flex w-full items-center gap-2 rounded-full border border-border bg-surface p-2 pl-5 shadow-sm"
    >
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Cuéntame qué necesitas, por ejemplo “perdí mi DNI”"
        aria-label="Describe lo que necesitas"
        className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted"
      />
      <button
        type="submit"
        disabled={busy || !input.trim()}
        className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
      >
        Preguntar
      </button>
    </form>
  );

  if (!messages.length) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
        <h1 className="font-display text-5xl sm:text-6xl">Hola, Perú</h1>
        <p className="text-muted">
          Cuéntame tu situación y te llevo al trámite correcto de gob.pe.
        </p>
        {composer}
        <div className="flex flex-wrap justify-center gap-2">
          {EXAMPLES.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => ask(e)}
              className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm hover:border-accent"
            >
              {e}
            </button>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
      {messages.map((m) =>
        m.role === "user" ? (
          <p
            key={m.id}
            className="self-end rounded-2xl bg-surface px-4 py-2 shadow-sm"
          >
            {m.parts.map((p) => (p.type === "text" ? p.text : "")).join("")}
          </p>
        ) : (
          <AssistantMessage key={m.id} message={m} onAsk={ask} />
        ),
      )}
      {busy && messages.at(-1)?.role === "user" ? (
        <p className="text-sm text-muted">Buscando en gob.pe…</p>
      ) : null}
      {error ? (
        <p className="text-sm text-accent">
          No pude responder. Intenta de nuevo.
        </p>
      ) : null}
      <div className="sticky bottom-4 mt-auto">{composer}</div>
    </main>
  );
}

function AssistantMessage({
  message,
  onAsk,
}: {
  message: PeruMessage;
  onAsk: (text: string, hint?: number) => void;
}) {
  const summary = message.parts
    .flatMap((p) => (p.type === "text" ? [p.text] : []))
    .join("");
  return (
    <div className="flex flex-col gap-3">
      {message.parts.map((part, i) => {
        const key = `${message.id}-${i}`;
        switch (part.type) {
          case "data-route":
            return (
              <ol
                key={key}
                className="flex flex-wrap items-center gap-1 text-xs text-muted"
              >
                {part.data.steps.map((s, j) => (
                  <li key={s.value} className="flex items-center gap-1">
                    {j > 0 ? <span aria-hidden>→</span> : null}
                    <span>{s.value}</span>
                  </li>
                ))}
              </ol>
            );
          case "data-ficha":
            return <FichaCard key={key} ficha={part.data} summary={summary} />;
          case "data-alternatives":
            return (
              <div
                key={key}
                className="flex flex-wrap items-center gap-2 text-sm"
              >
                <span className="text-muted">¿Buscabas otra cosa?</span>
                {part.data.items.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onAsk(c.title, c.id)}
                    className="rounded-full border border-border bg-surface px-3 py-1 hover:border-accent"
                  >
                    {c.title}
                  </button>
                ))}
              </div>
            );
          case "data-clarify":
            return (
              <div
                key={key}
                className="rounded-2xl border border-border bg-surface p-4"
              >
                <p className="font-medium">
                  ¿Cuál de estos trámites necesitas?
                </p>
                <div className="mt-3 flex flex-col gap-2">
                  {part.data.options.map((o) => (
                    <button
                      key={o}
                      type="button"
                      onClick={() => onAsk(o)}
                      className="rounded-xl border border-border px-3 py-2 text-left hover:border-accent"
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </div>
            );
          case "data-none":
            return (
              <div
                key={key}
                className="rounded-2xl border border-border bg-surface p-4"
              >
                <p>No encontré ese trámite en el catálogo de gob.pe.</p>
                <a
                  className="mt-2 inline-block text-sm text-accent underline"
                  href={`https://www.gob.pe/busquedas?term=${encodeURIComponent(part.data.query)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Buscar directamente en gob.pe
                </a>
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
