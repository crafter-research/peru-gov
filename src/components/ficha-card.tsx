import type { Ficha } from "@/lib/ficha";

/** Renders official sections verbatim from the ficha JSON (R1): no generated requirements or costs. */
export function FichaCard({
  ficha,
  summary,
}: {
  ficha: Ficha;
  summary?: string;
}) {
  return (
    <article className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        {ficha.kind} · {ficha.entity}
      </p>
      <h2 className="mt-1 font-display text-2xl">{ficha.title}</h2>
      {summary ? <p className="mt-3 leading-relaxed">{summary}</p> : null}
      <div className="mt-4 space-y-3">
        {ficha.sections.map((s, i) => (
          <details key={`${s.heading}-${i}`} open={i < 2} className="group">
            <summary className="cursor-pointer font-medium">
              {s.heading || "Descripción"}
            </summary>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-foreground/90">
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
        className="mt-5 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs text-muted hover:text-foreground"
      >
        Fuente: gob.pe/{ficha.id}
        {ficha.lastChanged ? ` · último cambio ${ficha.lastChanged}` : ""}
        {` · extraído ${ficha.extractedAt.slice(0, 10)}`}
      </a>
    </article>
  );
}
