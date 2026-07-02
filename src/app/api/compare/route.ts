import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { buildComparisonConclusion } from "@/lib/compare";
import { derivePros, deriveCons, type CarLike } from "@/lib/car-pros-cons";
import { getDisplayCarImageUrls } from "@/lib/car-images";
import { getSession } from "@/lib/auth";

const bodySchema = z.object({
  carIds: z.array(z.string().min(1)).min(2).max(5),
  budgetMAD: z.number().int().positive().optional(),
  locale: z.enum(["ar", "fr"]).optional(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body", details: parsed.error.flatten() }, { status: 400 });
  }

  const { carIds, budgetMAD, locale } = parsed.data;
  const loc = locale ?? "ar";

  const cars = await prisma.car.findMany({
    where: { id: { in: carIds } },
    include: { specs: true },
  });

  if (cars.length < 2) {
    return NextResponse.json({ error: "not_enough_cars" }, { status: 404 });
  }

  const conclusion = buildComparisonConclusion(cars, loc, budgetMAD);

  const session = await getSession();
  if (session) {
    await prisma.comparison.create({
      data: {
        userId: session.sub,
        carIds: carIds,
        conclusionAr: conclusion.textAr,
        conclusionFr: conclusion.textFr,
        title: `Compare ${carIds.length}`,
      },
    });
  }

  const carsWithProsCons = cars.map((c) => {
    const carLike: CarLike = {
      id: c.id,
      fuel: c.fuel,
      transmission: c.transmission,
      bodyType: c.bodyType,
      priceNewEst: c.priceNewEst,
      year: c.year,
      brandFr: c.brandFr,
      brandAr: c.brandAr,
      reliabilityScore: c.specs?.reliabilityScore ?? null,
      resaleScore: c.specs?.resaleScore ?? null,
      comfortScore: c.specs?.comfortScore ?? null,
      consumptionL100: c.specs?.consumptionL100 ?? null,
      maintenanceCostEst: c.specs?.maintenanceCostEst ?? null,
    };
    const imgs = getDisplayCarImageUrls(c);
    return {
      ...c,
      imageUrl: imgs[0] ?? null,
      imageUrls: imgs,
      pros: derivePros(carLike, loc, 5),
      cons: deriveCons(carLike, loc, 5),
    };
  });

  return NextResponse.json({ cars: carsWithProsCons, conclusion });
}
