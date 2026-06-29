import { z } from "zod";

export const car3dModelMapSchema = z.object({
  entries: z.array(
    z.object({
      brandFr: z.string().min(1),
      modelFr: z.string().min(1),
      viewer3dExteriorUrl: z.string().url(),
      viewer3dInteriorUrl: z.string().url().optional().nullable(),
    }),
  ),
});

export type Car3dModelMapFile = z.infer<typeof car3dModelMapSchema>;
