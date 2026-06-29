import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Toutes les marques avec leurs véhicules + fiches techniques (specs).
 * Pour consommation front ou intégrations (read-only).
 */
export async function GET() {
  const cars = await prisma.car.findMany({
    include: { specs: true },
    orderBy: [{ brandAr: "asc" }, { modelAr: "asc" }, { year: "desc" }],
  });

  const byBrand = new Map<string, typeof cars>();
  for (const car of cars) {
    const key = car.brandAr;
    const list = byBrand.get(key) ?? [];
    list.push(car);
    byBrand.set(key, list);
  }

  const marques = [...byBrand.entries()].map(([brandAr, voitures]) => ({
    brandAr,
    brandFr: voitures[0]?.brandFr ?? null,
    nombre: voitures.length,
    voitures,
  }));

  return NextResponse.json({ count: cars.length, marques });
}
