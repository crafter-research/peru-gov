import type { ReactNode } from "react";
import type { Ficha } from "@/lib/ficha";

/** Renders official sections verbatim from the ficha JSON (R1): no generated requirements or costs. */
export function FichaCard({
  ficha,
  summary,
}: {
  ficha: Ficha;
  summary?: ReactNode;
}) {
  return (
    <article className="glass glass-border rounded-3xl p-5 sm:p-6">
      <p className="text-[11px] font-medium tracking-[0.08em] text-accent/90 uppercase">
        {ficha.kind} · {ficha.entity}
      </p>
      <h2 className="mt-2 font-display text-[1.65rem] leading-tight tracking-[-0.01em] text-white">
        {ficha.title}
      </h2>
      {summary ? <div className="mt-3">{summary}</div> : null}
      <div className="mt-5 divide-y divide-white/[0.07] border-t border-white/[0.07]">
        {ficha.sections.map((s, i) => (
          <details
            key={`${s.heading}-${i}`}
            open={i === 0}
            className="group py-3"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[15px] font-medium text-white/95 [&::-webkit-details-marker]:hidden">
              {s.heading || "Descripción"}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
                className="shrink-0 text-white/50 transition-transform duration-300 ease-smooth group-open:rotate-180"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </summary>
            <ul className="mt-2.5 space-y-1.5 pl-4 text-sm leading-relaxed text-white/80 marker:text-white/30 [list-style:disc]">
              {s.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </details>
        ))}
      </div>
      <a
        href={ficha.url}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-full bg-white/5 px-3 py-1.5 text-[11px] text-white/60 transition hover:bg-white/10 hover:text-white/85"
      >
        <span className="text-white/85">gob.pe/{ficha.id}</span>
        {ficha.lastChanged ? (
          <span>último cambio {ficha.lastChanged}</span>
        ) : null}
        <span>extraído {ficha.extractedAt.slice(0, 10)}</span>
      </a>
    </article>
  );
}
