import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { carWhereFromSearchParams } from "@/lib/car-filters";

/** Lecture seule : nombre de véhicules correspondant aux filtres (bouton « Voir N véhicules »). */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  try {
    const count = await prisma.car.count({ where: carWhereFromSearchParams(searchParams) });
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: null }, { status: 503 });
  }
}
