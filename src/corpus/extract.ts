import { USER_AGENT } from "@/corpus/sitemap";
import {
  type Ficha,
  type FichaLink,
  fichaSchema,
  type Section,
} from "@/lib/ficha";

const MAX_HEADING = 80;
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
const PAGE_KINDS = new Set([
  "Trámite",
  "Orientación",
  "Servicio",
  "Campaña",
  "Informes y publicaciones",
  "Normas y documentos legales",
  "Noticias",
]);

/** "<Title> - <Kind> - <Entity> - Plataforma del Estado Peruano"; titles and entities may themselves contain " - ". */
export function parseDocumentTitle(raw: string) {
  const parts = clean(raw).split(" - ");
  if (parts.at(-1) === "Plataforma del Estado Peruano") parts.pop();
  let k = -1;
  for (let i = parts.length - 2; i >= 0; i--) {
    if (PAGE_KINDS.has(parts[i])) {
      k = i;
      break;
    }
  }
  if (k < 0) k = Math.max(0, parts.length - 2);
  return {
    kind: parts[k] ?? "",
    entity: parts.slice(k + 1).join(" - "),
    heading: parts.slice(0, k).join(" - "),
  };
}

/** Variant pages repeat the guide's h1; their own name follows it in the document title. */
export function variantTitle(h1: string, heading: string): string {
  return heading.startsWith(`${h1} - `) ? heading.slice(h1.length + 3) : h1;
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
  let inSubmenu = 0;
  const links: FichaLink[] = [];
  let link: { id: number; text: string } | null = null;
  let capture: "title" | "h1" | "heading" | "item" | "changed" | null = null;

  const flushItem = () => {
    const t = clean(buf);
    if (t && inMain && !inSubmenu) current.items.push(t);
    buf = "";
  };
  const startSection = (heading: string) => {
    if (current.heading || current.items.length) sections.push(current);
    // Some pages style a lead paragraph as a heading; keep it as text, not as a section title.
    current =
      heading.length > MAX_HEADING
        ? { heading: "", items: [heading] }
        : { heading, items: [] };
  };

  const append = (mode: typeof capture, text: string) => {
    if (capture !== mode) return;
    if (mode === "title") docTitle += text;
    else if (mode === "h1") h1 += text;
    else if (mode === "changed") lastChanged += text;
    else buf += text;
  };
  const captureUntilEnd =
    (mode: typeof capture, onEnd?: () => void) =>
    (el: HTMLRewriterTypes.Element) => {
      capture = mode;
      el.onEndTag(() => {
        onEnd?.();
        capture = null;
      });
    };

  const rewriter = new HTMLRewriter()
    .on("title", {
      element: captureUntilEnd("title"),
      text: (t) => append("title", t.text),
    })
    .on("main#main", {
      element: (el) => {
        inMain++;
        el.onEndTag(() => {
          inMain--;
        });
      },
    })
    .on("main#main .submenu", {
      element: (el) => {
        inSubmenu++;
        el.onEndTag(() => {
          inSubmenu--;
        });
      },
    })
    .on("main#main h1", {
      element: captureUntilEnd("h1"),
      text: (t) => append("h1", t.text),
    })
    .on("main#main h2, main#main h3", {
      element: (el) => {
        flushItem();
        captureUntilEnd("heading", () => {
          const heading = clean(buf);
          buf = "";
          startSection(heading);
        })(el);
      },
      text: (t) => append("heading", t.text),
    })
    .on("main#main li, main#main p", {
      element: (el) => {
        if (capture === "heading") return;
        flushItem();
        captureUntilEnd("item", flushItem)(el);
      },
      text: (t) => append("item", t.text),
    })
    .on("main#main a[href]", {
      element: (el) => {
        const m = el
          .getAttribute("href")
          ?.match(/^(?:https?:\/\/www\.gob\.pe)?\/(\d+)-[^/?#]+/);
        if (!m) return;
        link = { id: Number(m[1]), text: "" };
        el.onEndTag(() => {
          if (link) links.push({ id: link.id, title: clean(link.text) });
          link = null;
        });
      },
      text: (t) => {
        if (link) link.text += t.text;
      },
    })
    .on("main#main .last-modification", {
      element: captureUntilEnd("changed"),
      text: (t) => append("changed", t.text),
    });

  await rewriter.transform(new Response(html)).text();
  startSection("");

  const { kind, entity, heading } = parseDocumentTitle(docTitle);
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
    title: variantTitle(clean(h1), heading),
    kind,
    entity,
    sections: kept,
    costs: extractCosts(kept.flatMap((s) => s.items).join(" ")),
    links: [
      ...new Map(
        links.filter((l) => l.id !== id && l.title).map((l) => [l.id, l]),
      ).values(),
    ],
    lastChanged: parseLastChanged(lastChanged),
    extractedAt,
  });
}

/** Fetches one gob.pe page (following slug redirects) and extracts it. */
export async function fetchFicha(
  urlOrPath: string,
): Promise<{ ficha: Ficha; html: string }> {
  const url = urlOrPath.startsWith("http")
    ? urlOrPath
    : `https://www.gob.pe/${urlOrPath}`;
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  const html = await res.text();
  return { ficha: await extractFicha(html, res.url), html };
}
