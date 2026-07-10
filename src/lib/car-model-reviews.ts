import type { Prisma, PrismaClient, Review } from "@prisma/client";
import { prisma as defaultPrisma } from "@/lib/prisma";

export type CarModelRef = {
  year: number;
  brandFr: string | null;
  modelFr: string | null;
  brandAr: string;
  modelAr: string;
};

export type CarReviewScope = "model-year" | "model-any-year" | "none";

function modelIdentityOr(car: CarModelRef): Prisma.CarWhereInput[] {
  const or: Prisma.CarWhereInput[] = [{ brandAr: car.brandAr, modelAr: car.modelAr }];
  const brandFr = car.brandFr?.trim();
  const modelFr = car.modelFr?.trim();
  if (brandFr && modelFr) {
    or.unshift({ brandFr, modelFr });
  }
  return or;
}

function modelYearCarWhere(car: CarModelRef): Prisma.CarWhereInput {
  return { year: car.year, OR: modelIdentityOr(car) };
}

function modelAnyYearCarWhere(car: CarModelRef): Prisma.CarWhereInput {
  return { OR: modelIdentityOr(car) };
}

/** Toutes les fiches catalogue partageant marque + modèle + millésime (toutes finitions). */
export async function findSiblingCarIds(db: PrismaClient, car: CarModelRef): Promise<string[]> {
  const rows = await db.car.findMany({
    where: modelYearCarWhere(car),
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

export type CarReviewsResult = {
  reviews: Review[];
  scope: CarReviewScope;
  siblingCarIds: string[];
};

/**
 * Avis publiés pour ce modèle : d’abord même année, puis repli sur d’autres millésimes
 * du même modèle si le fichier Excel n’a pas couvert cette année.
 */
export async function findApprovedReviewsForCar(
  car: CarModelRef,
  opts: { take?: number; prisma?: PrismaClient } = {},
): Promise<CarReviewsResult> {
  const db = opts.prisma ?? defaultPrisma;
  const take = opts.take ?? 200;
  const siblingCarIds = await findSiblingCarIds(db, car);

  const exact = await db.review.findMany({
    where: { status: "APPROVED", car: modelYearCarWhere(car) },
    orderBy: { createdAt: "desc" },
    take,
  });
  if (exact.length > 0) {
    return { reviews: exact, scope: "model-year", siblingCarIds };
  }

  const anyYear = await db.review.findMany({
    where: { status: "APPROVED", car: modelAnyYearCarWhere(car) },
    orderBy: { createdAt: "desc" },
    take,
  });
  return {
    reviews: anyYear,
    scope: anyYear.length > 0 ? "model-any-year" : "none",
    siblingCarIds,
  };
}
