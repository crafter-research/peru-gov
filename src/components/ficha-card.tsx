import type { Ficha } from "@/lib/ficha";

const OPEN_BY_DEFAULT = /^requisitos/i;

/** Renders official sections verbatim from the ficha JSON (R1): no generated requirements or costs. */
export function FichaCard({ ficha }: { ficha: Ficha }) {
  const openIndex = Math.max(
    0,
    ficha.sections.findIndex((s) => OPEN_BY_DEFAULT.test(s.heading)),
  );
  return (
    <article className="glass glass-solid glass-border rounded-3xl p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-medium tracking-[0.08em] text-accent uppercase">
            Ficha oficial · {ficha.kind}
          </p>
          <h2 className="mt-1.5 font-display text-[1.5rem] leading-tight tracking-[-0.01em] text-foreground">
            {ficha.title}
          </h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {ficha.entity}
          </p>
        </div>
        <a
          href={ficha.url}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 rounded-xl bg-foreground px-3 py-1.5 text-[12px] font-medium text-background transition duration-200 ease-smooth hover:scale-[1.03] active:scale-95"
        >
          Ver en gob.pe ↗
        </a>
      </div>
      <div className="mt-5 divide-y divide-border border-t border-border">
        {ficha.sections.map((s, i) => (
          <details
            key={`${s.heading}-${i}`}
            open={i === openIndex}
            className="group py-3"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[15px] font-medium text-foreground [&::-webkit-details-marker]:hidden">
              {s.heading || "Descripción"}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
                className="shrink-0 text-muted-foreground transition-transform duration-300 ease-smooth group-open:rotate-180"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </summary>
            <ul className="mt-2.5 space-y-1.5 pl-4 text-sm leading-relaxed text-foreground/85 marker:text-muted-foreground/60 [list-style:disc]">
              {s.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </details>
        ))}
      </div>
      <p className="mt-4 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10.5px] tracking-tight text-muted-foreground/60">
        <span>gob.pe/{ficha.id}</span>
        {ficha.lastChanged ? (
          <span>actualizado {ficha.lastChanged}</span>
        ) : null}
        <span>leído {ficha.extractedAt.slice(0, 10)}</span>
      </p>
    </article>
  );
}
