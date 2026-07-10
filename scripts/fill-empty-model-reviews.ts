/**
 * Attribue des avis aux fiches sans aucun retour (modèle absent du fichier Excel).
 * Copie des avis APPROVED déjà publiés sur d’autres modèles de la même marque.
 *
 * Usage : npm run reviews:fill-empty-models
 */
import { PrismaClient, ReviewOrigin, ReviewStatus } from "@prisma/client";
import { findApprovedReviewsForCar } from "../src/lib/car-model-reviews";
import { hashSeed } from "../src/lib/car-demo-images";
import { loadEnvFiles } from "./lib/load-env";

loadEnvFiles();
const prisma = new PrismaClient();

const SOURCE_NAME = "avis_redistribues_marque";
const REVIEWS_PER_CAR = 10;

async function main() {
  const cars = await prisma.car.findMany({
    select: { id: true, year: true, brandFr: true, modelFr: true, brandAr: true, modelAr: true },
  });

  const brandReviewPool = new Map<string, Awaited<ReturnType<typeof prisma.review.findMany>>>();

  async function poolForBrand(brandFr: string | null, brandAr: string) {
    const key = (brandFr?.trim() || brandAr).toLowerCase();
    if (brandReviewPool.has(key)) return brandReviewPool.get(key)!;

    const rows = await prisma.review.findMany({
      where: {
        status: ReviewStatus.APPROVED,
        sourceName: { not: SOURCE_NAME },
        car: brandFr?.trim()
          ? { brandFr }
          : { brandAr },
      },
      orderBy: { createdAt: "desc" },
      take: 400,
    });
    brandReviewPool.set(key, rows);
    return rows;
  }

  let filled = 0;
  let skipped = 0;

  for (const car of cars) {
    const existing = await findApprovedReviewsForCar(car, { take: 1, prisma });
    if (existing.scope !== "none") continue;

    const pool = await poolForBrand(car.brandFr, car.brandAr);
    if (pool.length === 0) {
      skipped++;
      continue;
    }

    const start = hashSeed(car.id) % pool.length;
    const picked = Array.from({ length: Math.min(REVIEWS_PER_CAR, pool.length) }, (_, i) =>
      pool[(start + i) % pool.length]!,
    );

    await prisma.review.createMany({
      data: picked.map((r) => ({
        carId: car.id,
        userId: null,
        displayLabel: r.displayLabel,
        displayLabelFr: r.displayLabelFr,
        city: r.city,
        usageMonths: r.usageMonths,
        mileageKm: r.mileageKm,
        consumptionNote: r.consumptionNote,
        comfortNote: r.comfortNote,
        reliabilityNote: r.reliabilityNote,
        maintenanceNote: r.maintenanceNote,
        resaleNote: r.resaleNote,
        globalNote: r.globalNote,
        commentAr: r.commentAr,
        commentFr: r.commentFr,
        sourceName: SOURCE_NAME,
        sourceUrl: null,
        reviewOrigin: ReviewOrigin.IMPORT,
        verified: false,
        status: ReviewStatus.APPROVED,
      })),
    });
    filled++;
    console.log(`OK ${car.brandFr} ${car.modelFr} (${picked.length} avis)`);
  }

  console.log(`Terminé — ${filled} fiche(s) complétée(s), ${skipped} sans pool marque.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
