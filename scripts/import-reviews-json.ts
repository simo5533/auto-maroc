/**
 * Importe des avis depuis data/reviews-import.json (textes que vous collectez depuis des forums,
 * pages concessionnaires autorisées, exports CSV convertis, etc.).
 *
 * Usage : npm run reviews:import
 *
 * Reprenez data/reviews-import.example.json vers reviews-import.json et remplissez.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient, ReviewOrigin, ReviewStatus } from "@prisma/client";
import { loadEnvFiles } from "./lib/load-env";
import { reviewsImportFileSchema } from "../src/lib/reviews-import-zod";

loadEnvFiles();

const prisma = new PrismaClient();

async function main() {
  const path = join(process.cwd(), "data", "reviews-import.json");
  if (!existsSync(path)) {
    console.error(
      "Fichier introuvable : data/reviews-import.json\nCopiez data/reviews-import.example.json vers ce nom et remplissez-le.",
    );
    process.exit(1);
  }

  const raw = JSON.parse(readFileSync(path, "utf8"));
  const parsed = reviewsImportFileSchema.safeParse(raw);
  if (!parsed.success) {
    console.error("JSON invalide :", parsed.error.flatten());
    process.exit(1);
  }

  let created = 0;
  for (const entry of parsed.data.entries) {
    let carId: string | null = entry.carId ?? null;
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
      console.warn("Aucune fiche trouvée pour une entrée (carId / match), ignoré.");
      continue;
    }

    await prisma.review.createMany({
      data: entry.reviews.map((r) => ({
        carId,
        userId: null,
        displayLabel: r.displayLabel,
        displayLabelFr: r.displayLabelFr ?? null,
        city: r.city,
        usageMonths: r.usageMonths ?? null,
        mileageKm: r.mileageKm ?? null,
        consumptionNote: r.consumptionNote ?? null,
        comfortNote: r.comfortNote ?? null,
        reliabilityNote: r.reliabilityNote ?? null,
        maintenanceNote: r.maintenanceNote ?? null,
        resaleNote: r.resaleNote ?? null,
        globalNote: r.globalNote ?? null,
        commentAr: r.commentAr,
        commentFr: r.commentFr ?? null,
        sourceName: r.sourceName ?? null,
        sourceUrl: r.sourceUrl ?? null,
        reviewOrigin: ReviewOrigin.IMPORT,
        verified: false,
        status: ReviewStatus.APPROVED,
      })),
    });
    created += entry.reviews.length;
    console.log(`+${entry.reviews.length} avis pour ${carId}`);
  }

  console.log(`Terminé. ${created} avis créés au total.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
