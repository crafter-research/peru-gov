import { brandImage, ogSize } from "@/lib/og";
import { getShare } from "@/lib/shares";

export const alt = "Respuesta compartida de Hola, Perú";
export const size = ogSize;
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const first = (await getShare((await params).id))?.[0];
  if (!first) return brandImage({});
  return brandImage({
    eyebrow: first.ficha ? first.ficha.entity.slice(0, 60) : "Pregunta",
    title: `“${first.question.slice(0, 90)}”`,
    subtitle: first.ficha ? `→ ${first.ficha.title}` : undefined,
  });
}
