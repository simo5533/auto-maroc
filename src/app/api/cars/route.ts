import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { carWhereFromSearchParams } from "@/lib/car-filters";
import { getDisplayCarImageUrls } from "@/lib/car-images";

type CarRow = Awaited<ReturnType<typeof prisma.car.findMany>>[number];

/**
 * Réduit une liste de Car (par marque) à une entrée par modèle, en gardant la fiche
 * la plus récente comme cover (utile pour la grille « modèles » de la page d'accueil).
 */
function groupByModel(cars: CarRow[]) {
  const map = new Map<
    string,
    {
      brandFr: string | null;
      brandAr: string;
      modelFr: string | null;
      modelAr: string;
      cover: CarRow;
      latestYear: number;
      versionsCount: number;
    }
  >();
  for (const c of cars) {
    const key = `${(c.brandFr ?? c.brandAr).trim()}__${(c.modelFr ?? c.modelAr).trim()}`;
    const cur = map.get(key);
    if (!cur) {
      map.set(key, {
        brandFr: c.brandFr,
        brandAr: c.brandAr,
        modelFr: c.modelFr,
        modelAr: c.modelAr,
        cover: c,
        latestYear: c.year,
        versionsCount: 1,
      });
    } else {
      cur.versionsCount++;
      if (c.year > cur.latestYear) {
        cur.latestYear = c.year;
        cur.cover = c;
      }
    }
  }
  return [...map.values()].sort((a, b) => b.latestYear - a.latestYear);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const where = carWhereFromSearchParams(searchParams);
  const take = Math.min(Number(searchParams.get("take") ?? "50") || 50, 100);
  const groupBy = searchParams.get("groupBy");

  if (groupBy === "model") {
    const cars = await prisma.car.findMany({
      where,
      include: { specs: true },
      orderBy: [{ brandAr: "asc" }, { modelAr: "asc" }, { year: "desc" }],
      take: 300,
    });
    const grouped = groupByModel(cars).slice(0, take);
    const models = grouped.map((g) => {
      const imgs = getDisplayCarImageUrls(g.cover);
      return {
        id: g.cover.id,
        brandFr: g.brandFr,
        brandAr: g.brandAr,
        modelFr: g.modelFr,
        modelAr: g.modelAr,
        year: g.latestYear,
        imageUrl: imgs[0] ?? null,
        imageUrls: imgs,
        versionsCount: g.versionsCount,
      };
    });
    return NextResponse.json({ models });
  }

  const cars = await prisma.car.findMany({
    where,
    include: { specs: true },
    orderBy: [{ brandAr: "asc" }, { modelAr: "asc" }],
    take,
  });

  return NextResponse.json({ cars });
}
