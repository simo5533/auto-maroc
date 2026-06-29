import { z } from "zod";

const matchSchema = z.object({
  brandAr: z.string().min(1),
  modelAr: z.string().min(1),
  year: z.number().int().min(1990).max(2035),
  versionAr: z.string().min(1),
});

const entrySchema = z
  .object({
    carId: z.string().min(1).optional(),
    match: matchSchema.optional(),
    viewer3dExteriorUrl: z.string().url().optional().nullable(),
    viewer3dInteriorUrl: z.string().url().optional().nullable(),
  })
  .refine((e) => Boolean(e.carId?.trim()) || Boolean(e.match), {
    message: "Chaque entrée doit avoir « carId » ou « match »",
  })
  .refine(
    (e) =>
      Boolean(e.carId?.trim()) ||
      Boolean(e.viewer3dExteriorUrl) ||
      Boolean(e.viewer3dInteriorUrl),
    {
      message:
        "Sans « carId », chaque entrée doit avoir au moins un lien 3D (extérieur ou intérieur). Avec « carId », les deux peuvent être null pour effacer.",
    },
  );

export const car3dImportFileSchema = z.object({
  entries: z.array(entrySchema).min(1),
});

export type Car3dImportFile = z.infer<typeof car3dImportFileSchema>;
