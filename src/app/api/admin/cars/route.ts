import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { vehicleInputSchema } from "@/lib/catalog-vehicle-zod";

async function requireAdmin() {
  const s = await getSession();
  if (!s || s.role !== "ADMIN") return null;
  return s;
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const cars = await prisma.car.findMany({ include: { specs: true }, orderBy: { updatedAt: "desc" } });
  return NextResponse.json({ cars });
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = await req.json().catch(() => null);
  const parsed = vehicleInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid", details: parsed.error.flatten() }, { status: 400 });
  }
  const { specs, ...carData } = parsed.data;
  const car = await prisma.car.create({
    data: {
      ...carData,
      imageUrls: carData.imageUrls?.length ? carData.imageUrls : carData.imageUrl ? [carData.imageUrl] : [],
    },
  });
  if (specs && Object.keys(specs).length) {
    await prisma.carSpecs.create({ data: { carId: car.id, ...specs } });
  }
  const full = await prisma.car.findUnique({ where: { id: car.id }, include: { specs: true } });
  return NextResponse.json({ car: full });
}
