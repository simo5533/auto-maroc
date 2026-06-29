import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Marques distinctes + nombre de véhicules (lecture publique). */
export async function GET() {
  const rows = await prisma.car.groupBy({
    by: ["brandAr", "brandFr"],
    _count: { _all: true },
  });
  const marques = rows
    .map((r) => ({
      brandAr: r.brandAr,
      brandFr: r.brandFr,
      count: r._count._all,
    }))
    .sort((a, b) => a.brandAr.localeCompare(b.brandAr, "ar"));
  return NextResponse.json({ marques });
}
