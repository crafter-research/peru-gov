"use client";

import { useState } from "react";
import type { Ficha } from "@/lib/ficha";

type Props = { question: string; summary: string; ficha?: Ficha };

/** Copy the answer with its official source, or publish an anonymous link to it. */
export function MessageActions({ question, summary, ficha }: Props) {
  const [state, setState] = useState<
    "idle" | "copied" | "sharing" | "shared" | "error"
  >("idle");

  const copy = async () => {
    const lines = [
      summary.trim(),
      ficha
        ? `Ficha oficial: ${ficha.title} (${ficha.entity}) ${ficha.url}`
        : "",
      "Vía Hola, Perú · peru-gov.crafter.ing (no oficial)",
    ];
    await navigator.clipboard.writeText(lines.filter(Boolean).join("\n\n"));
    setState("copied");
    setTimeout(() => setState("idle"), 1800);
  };

  const share = async () => {
    setState("sharing");
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          turns: [
            {
              question,
              summary,
              ficha: ficha
                ? {
                    id: ficha.id,
                    title: ficha.title,
                    entity: ficha.entity,
                    url: ficha.url,
                  }
                : null,
            },
          ],
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const url = new URL((await res.json()).url, location.origin).toString();
      const title = ficha ? `${ficha.title} · Hola, Perú` : "Hola, Perú";
      if (navigator.share && matchMedia("(pointer: coarse)").matches) {
        await navigator
          .share({ title, text: `“${question}”`, url })
          .catch(() => undefined);
      } else {
        await navigator.clipboard.writeText(url);
      }
      setState("shared");
      setTimeout(() => setState("idle"), 2200);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 2200);
    }
  };

  const button =
    "inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground disabled:opacity-50";
  return (
    <div className="animate-in -ml-2 flex items-center gap-1">
      <button type="button" onClick={copy} className={button}>
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <rect x="9" y="9" width="12" height="12" rx="2" />
          <path d="M5 15V5a2 2 0 0 1 2-2h10" />
        </svg>
        {state === "copied" ? "Copiado" : "Copiar"}
      </button>
      <button
        type="button"
        onClick={share}
        disabled={state === "sharing"}
        className={button}
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v14" />
        </svg>
        {state === "sharing"
          ? "Creando link…"
          : state === "shared"
            ? "Link listo"
            : state === "error"
              ? "No se pudo"
              : "Compartir"}
      </button>
    </div>
  );
}
