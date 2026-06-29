import { z } from "zod";
import { catalogReviewSchema } from "./catalog-vehicle-zod";

const matchSchema = z.object({
  brandAr: z.string().min(1),
  modelAr: z.string().min(1),
  year: z.number().int().min(1990).max(2035),
  versionAr: z.string().min(1),
});

/**
 * Fichier `data/reviews-import.json` : attacher des avis (textes réels saisis / collectés) à des fiches.
 */
export const reviewsImportFileSchema = z.object({
  entries: z.array(
    z
      .object({
        carId: z.string().min(1).optional(),
        match: matchSchema.optional(),
        reviews: z.array(catalogReviewSchema).min(1).max(40),
      })
      .refine((e) => Boolean(e.carId?.trim()) || Boolean(e.match), {
        message: "Chaque entrée doit avoir « carId » ou « match »",
      }),
  ),
});

export type ReviewsImportFile = z.infer<typeof reviewsImportFileSchema>;
