import type { Prisma } from "@prisma/client";
import { BodyType, ConditionType, FuelType, Transmission, UsageType } from "@prisma/client";

function isEnum<T extends Record<string, string>>(en: T, v: string): v is T[keyof T] {
  return Object.values(en).includes(v as T[keyof T]);
}

export function carWhereFromSearchParams(sp: URLSearchParams): Prisma.CarWhereInput {
  const where: Prisma.CarWhereInput = {};
  const q = sp.get("q")?.trim();
  if (q) {
    where.OR = [
      { brandAr: { contains: q } },
      { brandFr: { contains: q } },
      { modelAr: { contains: q } },
      { modelFr: { contains: q } },
    ];
  }

  const price: Prisma.IntFilter = {};
  const minP = sp.get("minPrice");
  const maxP = sp.get("maxPrice");
  if (minP && !Number.isNaN(Number(minP))) price.gte = Number(minP);
  if (maxP && !Number.isNaN(Number(maxP))) price.lte = Number(maxP);
  if (Object.keys(price).length) where.priceNewEst = price;

  const fuel = sp.get("fuel");
  if (fuel && isEnum(FuelType, fuel)) where.fuel = fuel;

  const transmission = sp.get("transmission");
  if (transmission && isEnum(Transmission, transmission)) where.transmission = transmission;

  const body = sp.get("body");
  if (body && isEnum(BodyType, body)) where.bodyType = body;

  const condition = sp.get("condition");
  if (condition && isEnum(ConditionType, condition)) where.conditionDefault = condition;

  const usage = sp.get("usage");
  if (usage && isEnum(UsageType, usage)) {
    // SQLite : filtre JSON sans array_contains — on cible la valeur entre guillemets dans le tableau sérialisé.
    where.usageRecommended = { string_contains: `"${usage}"` };
  }

  const brand = sp.get("brand")?.trim();
  if (brand) {
    return {
      AND: [
        where,
        {
          OR: [{ brandFr: brand }, { brandAr: brand }],
        },
      ],
    };
  }

  return where;
}
