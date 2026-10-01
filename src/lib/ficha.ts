import { z } from "zod";

export const sectionSchema = z.object({
  heading: z.string(),
  items: z.array(z.string()),
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
  lastChanged: z.string().nullable(),
  extractedAt: z.iso.datetime(),
});

export type Section = z.infer<typeof sectionSchema>;
export type Ficha = z.infer<typeof fichaSchema>;
