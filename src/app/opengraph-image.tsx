import { brandImage, ogSize } from "@/lib/og";

export const alt =
  "Hola, Perú: cuéntale tu situación y te lleva al trámite correcto de gob.pe";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return brandImage({});
}
