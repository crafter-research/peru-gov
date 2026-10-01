import { z } from "zod";

/** gob.pe ficha ids are small integers; anything past this is not a page we serve. */
export const MAX_FICHA_ID = 10_000_000;

export const sectionSchema = z.object({
  heading: z.string(),
  items: z.array(z.string()),
});

export const linkSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
});

export const fichaSchema = z.object({
  id: z.number().int().positive(),
  slug: z.string(),
  url: z.url(),
  title: z.string(),
  kind: z.string(),
  entity: z.string(),
  sections: z.array(sectionSchema),
  costs: z.array(z.string()),
  links: z.array(linkSchema).default([]),
  lastChanged: z.string().nullable(),
  extractedAt: z.iso.datetime(),
});

export type Section = z.infer<typeof sectionSchema>;
export type Ficha = z.infer<typeof fichaSchema>;
export type FichaLink = z.infer<typeof linkSchema>;
