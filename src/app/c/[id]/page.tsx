import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Backdrop } from "@/components/backdrop";
import { SiteHeader } from "@/components/site-header";
import { getShare } from "@/lib/shares";

export async function generateMetadata({
  params,
}: PageProps<"/c/[id]">): Promise<Metadata> {
  const turns = await getShare((await params).id);
  const first = turns?.[0];
  if (!first) return {};
  const title = `“${first.question}” · Hola, Perú`;
  return {
    title,
    description: first.ficha
      ? `${first.ficha.title} · ${first.ficha.entity}`
      : first.summary.slice(0, 160),
  };
}

export default async function SharedChat({ params }: PageProps<"/c/[id]">) {
  const turns = await getShare((await params).id);
  if (!turns) notFound();
  return (
    <>
      <SiteHeader />
      <Backdrop focused />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-6">
        <p className="text-xs text-muted-foreground">
          Conversación compartida de forma anónima
        </p>
        {turns.map((t, i) => (
          <div key={`${i}-${t.question}`} className="flex flex-col gap-4">
            <p className="glass glass-solid max-w-[85%] self-end rounded-3xl rounded-br-lg px-4 py-2.5 text-[15px]">
              {t.question}
            </p>
            {t.summary ? (
              <p className="text-[16px] leading-relaxed text-foreground">
                {t.summary}
              </p>
            ) : null}
            {t.ficha ? (
              <a
                href={t.ficha.url}
                target="_blank"
                rel="noreferrer"
                className="glass glass-solid glass-border flex items-center justify-between gap-4 rounded-3xl p-5 transition hover:-translate-y-0.5"
              >
                <span className="min-w-0">
                  <span className="block text-[11px] font-medium tracking-[0.08em] text-accent uppercase">
                    Ficha oficial
                  </span>
                  <span className="mt-1 block font-display text-xl text-foreground">
                    {t.ficha.title}
                  </span>
                  <span className="mt-0.5 block text-[13px] text-muted-foreground">
                    {t.ficha.entity}
                  </span>
                </span>
                <span className="shrink-0 rounded-xl bg-foreground px-3 py-1.5 text-[12px] font-medium text-background">
                  Ver en gob.pe ↗
                </span>
              </a>
            ) : null}
          </div>
        ))}
        <Link
          href="/"
          className="self-center rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition hover:scale-[1.03]"
        >
          Haz tu propia pregunta
        </Link>
      </main>
    </>
  );
}
