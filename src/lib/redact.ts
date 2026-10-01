/** Strips personal identifiers before a question is stored: DNI/RUC/CE numbers, phones, emails. */
export function redactPii(text: string): string {
  return text
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[correo]")
    .replace(/(?:\+?51[\s-]?)?9\d{2}[\s-]?\d{3}[\s-]?\d{3}\b/g, "[teléfono]")
    .replace(/\b\d{11}\b/g, "[ruc]")
    .replace(/\b\d{8}(?:-?\d)?\b/g, "[documento]")
    .replace(/\b\d{9,12}\b/g, "[número]");
}
