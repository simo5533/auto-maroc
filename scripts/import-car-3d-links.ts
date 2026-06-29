/**
 * Importe les liens 3D extérieur/intérieur dans CarSpecs depuis data/car-3d-links.json
 *
 * Usage: npm run cars:import-3d
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { loadEnvFiles } from "./lib/load-env";
import { car3dImportFileSchema } from "../src/lib/car-3d-import-zod";

loadEnvFiles();
const prisma = new PrismaClient();

async function main() {
  const path = join(process.cwd(), "data", "car-3d-links.json");
  if (!existsSync(path)) {
    console.error(
      "Fichier introuvable : data/car-3d-links.json\nCopiez data/car-3d-links.example.json vers ce nom et remplissez-le.",
    );
    process.exit(1);
  }

  const raw = JSON.parse(readFileSync(path, "utf8"));
  const parsed = car3dImportFileSchema.safeParse(raw);
  if (!parsed.success) {
    console.error("JSON invalide :", parsed.error.flatten());
    process.exit(1);
  }

  let updated = 0;
  for (const entry of parsed.data.entries) {
    let carId: string | null = entry.carId ?? null;
    if (carId) {
      const existing = await prisma.car.findUnique({
        where: { id: carId },
        select: { id: true },
      });
      if (!existing) {
        console.warn(`carId introuvable (${carId}) — entrée ignorée.`);
        carId = null;
      }
    }
    if (!carId && entry.match) {
      const m = entry.match;
      const car = await prisma.car.findFirst({
        where: {
          brandAr: m.brandAr,
          modelAr: m.modelAr,
          year: m.year,
          versionAr: m.versionAr,
        },
        select: { id: true },
      });
      carId = car?.id ?? null;
    }
    if (!carId) {
      console.warn("Aucune fiche trouvée (carId/match) — entrée ignorée.");
      continue;
    }

    await prisma.carSpecs.upsert({
      where: { carId },
      create: {
        carId,
        viewer3dExteriorUrl: entry.viewer3dExteriorUrl ?? null,
        viewer3dInteriorUrl: entry.viewer3dInteriorUrl ?? null,
      },
      update: {
        viewer3dExteriorUrl: entry.viewer3dExteriorUrl ?? null,
        viewer3dInteriorUrl: entry.viewer3dInteriorUrl ?? null,
      },
    });
    updated++;
    console.log(`3D OK pour ${carId}`);
  }

  console.log(`Terminé. ${updated} fiche(s) mise(s) à jour.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
