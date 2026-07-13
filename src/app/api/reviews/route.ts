import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ReviewOrigin, ReviewStatus } from "@prisma/client";
import { toDarijaLatin } from "@/lib/darija-latin";

export async function GET(req: Request) {
  const carId = new URL(req.url).searchParams.get("carId");
  if (!carId) return NextResponse.json({ error: "carId_required" }, { status: 400 });
  const reviews = await prisma.review.findMany({
    where: {
      carId,
      status: ReviewStatus.APPROVED,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ reviews });
}

const createSchema = z.object({
  carId: z.string().min(1),
  city: z.string().min(2).max(80),
  usageMonths: z.number().int().nonnegative().optional(),
  mileageKm: z.number().int().nonnegative().optional(),
  consumptionNote: z.number().int().min(1).max(5).optional(),
  comfortNote: z.number().int().min(1).max(5).optional(),
  reliabilityNote: z.number().int().min(1).max(5).optional(),
  maintenanceNote: z.number().int().min(1).max(5).optional(),
  resaleNote: z.number().int().min(1).max(5).optional(),
  globalNote: z.number().int().min(1).max(5).optional(),
  commentAr: z.string().min(10).max(4000),
  commentFr: z.string().max(4000).optional(),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "auth" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid", details: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;
  const car = await prisma.car.findUnique({ where: { id: d.carId } });
  if (!car) return NextResponse.json({ error: "car_not_found" }, { status: 404 });

  const displayLabel =
    d.usageMonths != null && d.mileageKm != null
      ? `Malek depuis ~${d.usageMonths} chhor — ${d.city} — ${d.mileageKm.toLocaleString("fr-FR")} km`
      : `Malek — ${d.city}`;
  const displayLabelFr =
    d.usageMonths != null && d.mileageKm != null
      ? `Propriétaire — env. ${d.usageMonths} mois — ${d.city} — ${d.mileageKm.toLocaleString("fr-FR")} km`
      : `Propriétaire — ${d.city}`;

  const review = await prisma.review.create({
    data: {
      carId: d.carId,
      userId: session.sub,
      displayLabel,
      displayLabelFr,
      city: d.city,
      usageMonths: d.usageMonths ?? null,
      mileageKm: d.mileageKm ?? null,
      consumptionNote: d.consumptionNote ?? null,
      comfortNote: d.comfortNote ?? null,
      reliabilityNote: d.reliabilityNote ?? null,
      maintenanceNote: d.maintenanceNote ?? null,
      resaleNote: d.resaleNote ?? null,
      globalNote: d.globalNote ?? null,
      commentAr: toDarijaLatin(d.commentAr),
      commentFr: d.commentFr ?? null,
      reviewOrigin: ReviewOrigin.USER,
      status: ReviewStatus.PENDING,
      verified: false,
    },
  });

  return NextResponse.json({ review });
}
