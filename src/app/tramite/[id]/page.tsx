import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Backdrop } from "@/components/backdrop";
import { FichaCard } from "@/components/ficha-card";
import { SiteHeader } from "@/components/site-header";
import { allFichas, loadFicha } from "@/lib/fichas";

export const dynamicParams = true;

export async function generateStaticParams() {
  return [...(await allFichas()).keys()].map((id) => ({ id: String(id) }));
}

async function fichaFor(params: Promise<{ id: string }>) {
  const { id } = await params;
  const n = Number(id.split("-")[0]);
  return Number.isInteger(n) ? loadFicha(n) : undefined;
}

export async function generateMetadata({
  params,
}: PageProps<"/tramite/[id]">): Promise<Metadata> {
  const ficha = await fichaFor(params);
  return ficha
    ? {
        title: `${ficha.title} · Hola, Perú`,
        description: `${ficha.kind} de ${ficha.entity}. Fuente: gob.pe.`,
      }
    : {};
}

export default async function TramitePage({
  params,
}: PageProps<"/tramite/[id]">) {
  const ficha = await fichaFor(params);
  if (!ficha) notFound();
  return (
    <>
      <SiteHeader />
      <Backdrop focused />
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-8">
        <FichaCard ficha={ficha} />
        <Link
          href={`/?q=${encodeURIComponent(ficha.title)}`}
          className="self-start rounded-full bg-accent px-4 py-2 text-sm font-medium text-foreground"
        >
          Preguntar sobre este trámite
        </Link>
      </main>
    </>
  );
}
