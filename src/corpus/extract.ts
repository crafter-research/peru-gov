import { type Ficha, fichaSchema, type Section } from "@/lib/ficha";

const SKIP_HEADINGS = new Set([
  "Enlaces relacionados",
  "Sobre el Estado Peruano",
  "Directorios nacionales",
  "Síguenos",
]);
const MONTHS: Record<string, string> = {
  enero: "01",
  febrero: "02",
  marzo: "03",
  abril: "04",
  mayo: "05",
  junio: "06",
  julio: "07",
  agosto: "08",
  setiembre: "09",
  septiembre: "09",
  octubre: "10",
  noviembre: "11",
  diciembre: "12",
};

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};
const decode = (s: string) =>
  s.replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, e: string) => {
    if (e[0] === "#")
      return String.fromCodePoint(
        e[1] === "x" || e[1] === "X"
          ? Number.parseInt(e.slice(2), 16)
          : Number(e.slice(1)),
      );
    return ENTITIES[e.toLowerCase()] ?? m;
  });
const clean = (s: string) => decode(s).replace(/\s+/g, " ").trim();

/** "<Title> - <Kind> - <Entity> - Plataforma del Estado Peruano" */
export function parseDocumentTitle(raw: string) {
  const parts = clean(raw).split(" - ");
  if (parts.at(-1) === "Plataforma del Estado Peruano") parts.pop();
  const entity = parts.pop() ?? "";
  const kind = parts.pop() ?? "";
  return { kind, entity };
}

export function parseLastChanged(text: string): string | null {
  const m = clean(text).match(/(\d{1,2}) (\p{L}+) (\d{4})/u);
  const month = m && MONTHS[m[2].toLowerCase()];
  return m && month ? `${m[3]}-${month}-${m[1].padStart(2, "0")}` : null;
}

export function extractCosts(text: string): string[] {
  return [
    ...new Set(
      [...text.matchAll(/S\/\s*\d+(?:[.,]\d{2})?/g)].map((m) =>
        clean(m[0]).replace(/S\/\s*/, "S/ "),
      ),
    ),
  ];
}

/** Deterministic HTML → ficha. Keeps official wording; no model involved. */
export async function extractFicha(
  html: string,
  url: string,
  extractedAt = new Date().toISOString(),
): Promise<Ficha> {
  let docTitle = "";
  let h1 = "";
  let lastChanged = "";
  const sections: Section[] = [];
  let current: Section = { heading: "", items: [] };
  let buf = "";
  let inMain = 0;
  let capture: "title" | "h1" | "heading" | "item" | "changed" | null = null;

  const flushItem = () => {
    const t = clean(buf);
    if (t && inMain) current.items.push(t);
    buf = "";
  };
  const startSection = (heading: string) => {
    if (current.heading || current.items.length) sections.push(current);
    current = { heading, items: [] };
  };

  const rewriter = new HTMLRewriter()
    .on("title", {
      element: () => void (capture = "title"),
      text: (t) => void (capture === "title" && (docTitle += t.text)),
    })
    .on("main#main", {
      element: (el) => {
        inMain++;
        el.onEndTag(() => void inMain--);
      },
    })
    .on("main#main h1", {
      element: (el) => {
        capture = "h1";
        el.onEndTag(() => void (capture = null));
      },
      text: (t) => void (capture === "h1" && (h1 += t.text)),
    })
    .on("main#main h2, main#main h3", {
      element: (el) => {
        flushItem();
        capture = "heading";
        let heading = "";
        el.onEndTag(() => {
          capture = null;
          heading = clean(buf);
          buf = "";
          startSection(heading);
        });
      },
      text: (t) => void (capture === "heading" && (buf += t.text)),
    })
    .on("main#main li, main#main p", {
      element: (el) => {
        if (capture === "heading") return;
        flushItem();
        capture = "item";
        el.onEndTag(() => {
          flushItem();
          capture = null;
        });
      },
      text: (t) => void (capture === "item" && (buf += t.text)),
    })
    .on("main#main .last-modification", {
      element: (el) => {
        capture = "changed";
        el.onEndTag(() => void (capture = null));
      },
      text: (t) => void (capture === "changed" && (lastChanged += t.text)),
    });

  await rewriter.transform(new Response(html)).text();
  startSection("");

  const { kind, entity } = parseDocumentTitle(docTitle);
  const kept = sections
    .filter((s) => !SKIP_HEADINGS.has(s.heading) && s.items.length)
    .map((s) => ({
      heading: s.heading,
      items: [...new Set(s.items)].filter((i) => !/^Último cambio/.test(i)),
    }))
    .filter((s) => s.items.length);
  const pathname = new URL(url).pathname.slice(1);
  const id = Number(pathname.split("-")[0]);

  return fichaSchema.parse({
    id,
    slug: pathname,
    url,
    title: clean(h1),
    kind,
    entity,
    sections: kept,
    costs: extractCosts(kept.flatMap((s) => s.items).join(" ")),
    lastChanged: parseLastChanged(lastChanged),
    extractedAt,
  });
}
