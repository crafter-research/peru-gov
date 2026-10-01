import { describe, expect, test } from "bun:test";
import {
  extractCosts,
  extractFicha,
  parseDocumentTitle,
  parseLastChanged,
} from "@/corpus/extract";

const fixture = (name: string) =>
  Bun.file(`${import.meta.dir}/fixtures/${name}.html`).text();

describe("extractFicha", () => {
  test("duplicado de DNI keeps official sections and costs", async () => {
    const f = await extractFicha(
      await fixture("224-solicitar-duplicado-de-dni"),
      "https://www.gob.pe/224-solicitar-duplicado-de-dni",
      "2026-09-30T00:00:00.000Z",
    );
    expect(f.id).toBe(224);
    expect(f.title).toBe("Solicitar duplicado de DNI");
    expect(f.kind).toBe("Trámite");
    expect(f.entity).toBe("Registro Nacional de Identificación y Estado Civil");
    expect(f.costs).toEqual(
      expect.arrayContaining(["S/ 30.00", "S/ 35.00", "S/ 16.00"]),
    );
    expect(f.sections.map((s) => s.heading)).toContain("Requisitos");
    expect(f.sections.map((s) => s.heading)).not.toContain(
      "Enlaces relacionados",
    );
    expect(JSON.stringify(f)).not.toContain("&gt;");
    expect(f.lastChanged).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(f.links.every((l) => l.id !== 224 && l.title.length > 0)).toBe(true);
  });

  test("a variant page takes its own title, not the guide's h1", async () => {
    const f = await extractFicha(
      await fixture("137-variant"),
      "https://www.gob.pe/137",
    );
    expect(f.id).toBe(137);
    expect(f.title).toBe("Licencia de conducir para adultos mayores");
    expect(f.kind).toBe("Orientación");
  });

  test("a guide drops its tab submenu and demotes paragraph-length headings", async () => {
    const f = await extractFicha(
      await fixture("191-guide"),
      "https://www.gob.pe/191",
    );
    const all = f.sections.flatMap((s) => s.items);
    expect(all).not.toContain("Revalidar Licencia de Conducir en Lima");
    expect(f.sections.every((s) => s.heading.length <= 80)).toBe(true);
    expect(
      all.some((i) =>
        i.startsWith(
          "Para licencias de Clase A, si quieres realizar tu trámite de manera virtual",
        ),
      ),
    ).toBe(true);
    expect(f.links.map((l) => l.title)).toContain(
      "Revalidar Licencia de Conducir en Lima",
    );
  });

  test("brevete page parses", async () => {
    const f = await extractFicha(
      await fixture("135-obtener-licencia-de-conducir-brevete-por-primera-vez"),
      "https://www.gob.pe/135-obtener-licencia-de-conducir-brevete-por-primera-vez",
    );
    expect(f.title.toLowerCase()).toContain("licencia de conducir");
    expect(f.sections.length).toBeGreaterThan(0);
  });
});

test("parseDocumentTitle splits kind and entity", () => {
  expect(
    parseDocumentTitle(
      "Solicitar duplicado de DNI - Trámite - Registro Nacional de Identificación y Estado Civil - Plataforma del Estado Peruano",
    ),
  ).toEqual({
    kind: "Trámite",
    entity: "Registro Nacional de Identificación y Estado Civil",
    heading: "Solicitar duplicado de DNI",
  });
});

test("parseDocumentTitle keeps entities that contain dashes", () => {
  expect(
    parseDocumentTitle(
      "Inscripción ordinaria de actas de nacimiento - Trámite - Municipalidad Distrital de San Jerónimo - Cusco - Plataforma del Estado Peruano",
    ),
  ).toEqual({ kind: "Trámite", entity: "Municipalidad Distrital de San Jerónimo - Cusco", heading: "Inscripción ordinaria de actas de nacimiento" });
  expect(
    parseDocumentTitle("Duplicado de licencia de conducir (brevete) - Orientación - Dirección Sub Regional de Trans. y Comun. Chanka - Andah - Plataforma del Estado Peruano").entity,
  ).toBe("Dirección Sub Regional de Trans. y Comun. Chanka - Andah");
});

test("parseLastChanged reads Spanish dates", () => {
  expect(parseLastChanged("Último cambio  08 setiembre 2026")).toBe(
    "2026-09-08",
  );
  expect(parseLastChanged("sin fecha")).toBeNull();
});

test("extractCosts normalizes soles", () => {
  expect(extractCosts("S/  30.00 y S/16 y S/ 30.00")).toEqual([
    "S/ 30.00",
    "S/ 16",
  ]);
});
