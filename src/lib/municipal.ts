import { normalize } from "@/lib/retrieve";

/** "Municipalidad Distrital de Pacasmayo" → "Pacasmayo"; undefined for non-municipal entities. */
export function municipalityName(entity: string): string | undefined {
  const m = entity.match(
    /^Municipalidad\s+(?:(?:Provincial|Distrital|Metropolitana|del Centro Poblado)\s+)?(?:de\s+)?(.+)$/i,
  );
  return m?.[1].trim();
}

/** A municipal ficha only fits when the person named that place; otherwise ask for their district. */
export function needsDistrict(
  entity: string,
  conversation: string,
): string | undefined {
  const place = municipalityName(entity);
  if (!place) return undefined;
  return normalize(conversation).includes(normalize(place)) ? undefined : place;
}
