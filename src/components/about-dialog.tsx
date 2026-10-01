"use client";

import { useRef } from "react";

/** "Acerca de" modal: what the prototype is, who built it, its mission and limits. */
export function AboutDialog() {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        aria-label="Acerca de este proyecto"
        className="grid size-8 place-items-center rounded-lg border border-border bg-surface text-foreground/80 transition hover:border-foreground/20 hover:text-foreground"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5M12 8h.01" />
        </svg>
      </button>
      <dialog
        ref={dialog}
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current?.close();
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") dialog.current?.close();
        }}
        className="glass glass-solid glass-border m-auto w-[min(92vw,34rem)] rounded-3xl p-0 text-foreground backdrop:bg-black/50 backdrop:backdrop-blur-sm open:animate-in"
      >
        <div className="flex flex-col gap-5 p-6 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium tracking-[0.08em] text-accent uppercase">
                Acerca de
              </p>
              <h2 className="mt-1 font-display text-2xl">Hola, Perú</h2>
            </div>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              aria-label="Cerrar"
              className="grid size-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 text-[13px] leading-relaxed">
            <strong className="font-semibold">Prototipo no oficial.</strong> No
            es un sitio del Estado peruano ni está afiliado a la PCM ni a
            ninguna entidad. Verifica siempre requisitos, costos y plazos en la
            ficha oficial de gob.pe antes de hacer un trámite.
          </div>

          <section className="flex flex-col gap-1.5 text-sm leading-relaxed text-foreground/85">
            <h3 className="font-medium text-foreground">Qué es</h3>
            <p>
              Cuentas tu situación con tus palabras y te lleva a la ficha
              correcta de gob.pe, entre las 32,923 páginas de trámites,
              servicios y orientaciones que publica el Estado. Si no queda claro
              qué trámite necesitas, te pregunta en vez de adivinar.
            </p>
          </section>

          <section className="flex flex-col gap-1.5 text-sm leading-relaxed text-foreground/85">
            <h3 className="font-medium text-foreground">Cómo responde</h3>
            <p>
              Los requisitos, costos y pasos que ves son el texto de la ficha
              oficial, sin reescribir. Un modelo solo redacta un resumen breve a
              partir de esa ficha y siempre enlaza la fuente con su fecha.
            </p>
          </section>

          <section className="flex flex-col gap-1.5 text-sm leading-relaxed text-foreground/85">
            <h3 className="font-medium text-foreground">Quién lo hace</h3>
            <p>
              <a
                href="https://crafter.ing"
                target="_blank"
                rel="noreferrer"
                className="text-accent underline underline-offset-4"
              >
                Crafter Research
              </a>
              , el área de investigación de Crafter Station, una comunidad sin
              fines de lucro que construye el ecosistema tecnológico del Perú.
              La misión: que hacer un trámite empiece por entender qué
              necesitas, no por saber qué entidad lo lleva.
            </p>
          </section>

          <section className="flex flex-col gap-1.5 text-sm leading-relaxed text-foreground/85">
            <h3 className="font-medium text-foreground">Privacidad</h3>
            <p>
              No necesitas cuenta. Para mejorar las respuestas guardamos de
              forma anónima tus preguntas y a qué ficha de gob.pe te llevamos,
              sin tu IP y borrando números de documento, teléfonos y correos. No
              escribas datos personales.
            </p>
          </section>

          <p className="border-t border-border pt-4 font-mono text-[10.5px] text-muted-foreground/70">
            Código abierto en github.com/crafter-research/peru-gov · Foto de
            Martin St-Amant, CC BY-SA 3.0
          </p>
        </div>
      </dialog>
    </>
  );
}
