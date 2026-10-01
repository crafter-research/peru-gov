import { expect, test } from "bun:test";
import { parseEntries, parseLocs } from "@/corpus/sitemap";

const xml = `<urlset>
<url><loc>http://www.gob.pe/224-solicitar-duplicado-de-dni</loc><lastmod>2026-09-25T11:08:39-05:00</lastmod></url>
<url><loc>http://www.gob.pe/institucion/reniec/noticias/1-x</loc><lastmod>2026-09-25</lastmod></url>
<url><loc>http://www.gob.pe/165-pasaporte-electronico</loc></url>
</urlset>`;

test("parseEntries keeps only top-level pages and normalizes https", () => {
  expect(parseEntries(xml)).toEqual([
    {
      url: "https://www.gob.pe/224-solicitar-duplicado-de-dni",
      id: 224,
      slug: "224-solicitar-duplicado-de-dni",
      lastmod: "2026-09-25T11:08:39-05:00",
    },
    {
      url: "https://www.gob.pe/165-pasaporte-electronico",
      id: 165,
      slug: "165-pasaporte-electronico",
      lastmod: null,
    },
  ]);
});

test("parseLocs reads a sitemap index", () => {
  expect(
    parseLocs(
      "<sitemapindex><sitemap><loc>http://www.gob.pe/sitemaps/sitemap1.xml.gz</loc></sitemap></sitemapindex>",
    ),
  ).toEqual(["http://www.gob.pe/sitemaps/sitemap1.xml.gz"]);
});
