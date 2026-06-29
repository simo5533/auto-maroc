import { z } from "zod";

export const productStorySectionSchema = z.object({
  id: z.string().min(1),
  category: z.enum(["design_exterior", "design_interior", "technology", "assistance", "other"]),
  titleFr: z.string().min(1),
  titleAr: z.string().min(1),
  bodyFr: z.string().min(1),
  bodyAr: z.string().min(1),
});

export const productStoryFaqItemSchema = z.object({
  qFr: z.string().min(1),
  qAr: z.string().min(1),
  aFr: z.string().min(1),
  aAr: z.string().min(1),
});

export const productStorySchema = z.object({
  sections: z.array(productStorySectionSchema),
  faq: z.array(productStoryFaqItemSchema),
  environmentFr: z.string().min(1),
  environmentAr: z.string().min(1),
  disclaimerFr: z.string().min(1),
  disclaimerAr: z.string().min(1),
});

export type ProductStory = z.infer<typeof productStorySchema>;
export type ProductStorySection = z.infer<typeof productStorySectionSchema>;

export function parseProductStory(raw: unknown): ProductStory | null {
  const r = productStorySchema.safeParse(raw);
  return r.success ? r.data : null;
}
