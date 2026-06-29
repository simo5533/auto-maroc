import type { PrismaClient } from "@prisma/client";
import { ReviewOrigin, ReviewStatus } from "@prisma/client";
import type { CatalogVehicleInput } from "@/lib/catalog-vehicle-zod";

async function syncTemplateReviews(
  prisma: PrismaClient,
  carId: string,
  reviews: CatalogVehicleInput["reviews"],
) {
  if (reviews === undefined) return;
  await prisma.review.deleteMany({
    where: { carId, reviewOrigin: ReviewOrigin.CATALOG_DEMO },
  });
  if (!reviews.length) return;
  await prisma.review.createMany({
    data: reviews.map((r) => ({
      carId,
      userId: null,
      displayLabel: r.displayLabel,
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
      reviewOrigin: ReviewOrigin.CATALOG_DEMO,
      verified: false,
      status: ReviewStatus.APPROVED,
    })),
  });
}

function normalizeImages(data: CatalogVehicleInput): { imageUrl: string | null; imageUrls: string[] } {
  const urls = (data.imageUrls?.length ? data.imageUrls : data.imageUrl ? [data.imageUrl] : []).filter(Boolean);
  return {
    imageUrl: data.imageUrl ?? urls[0] ?? null,
    imageUrls: urls,
  };
}

export async function upsertCatalogVehicle(prisma: PrismaClient, data: CatalogVehicleInput) {
  const { specs, reviews, ...rest } = data;
  const { imageUrl, imageUrls } = normalizeImages(data);

  const carPayload = {
    ...rest,
    imageUrl,
    imageUrls,
    priceUsedEst: rest.priceUsedEst ?? null,
    descriptionFr: rest.descriptionFr ?? null,
  };

  const existing = await prisma.car.findFirst({
    where: {
      brandAr: rest.brandAr,
      modelAr: rest.modelAr,
      year: rest.year,
      versionAr: rest.versionAr,
    },
  });

  if (existing) {
    await prisma.car.update({
      where: { id: existing.id },
      data: carPayload,
    });
    if (specs && Object.keys(specs).length > 0) {
      await prisma.carSpecs.upsert({
        where: { carId: existing.id },
        create: { carId: existing.id, ...specs },
        update: { ...specs },
      });
    }
    await syncTemplateReviews(prisma, existing.id, reviews);
    return { id: existing.id, action: "updated" as const };
  }

  const car = await prisma.car.create({
    data: carPayload,
  });
  if (specs && Object.keys(specs).length > 0) {
    await prisma.carSpecs.create({ data: { carId: car.id, ...specs } });
  }
  await syncTemplateReviews(prisma, car.id, reviews);
  return { id: car.id, action: "created" as const };
}
