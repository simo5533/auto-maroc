import { NextResponse } from "next/server";
import { ReviewStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  const s = await getSession();
  if (!s || s.role !== "ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const status = (new URL(req.url).searchParams.get("status") as ReviewStatus | null) ?? ReviewStatus.PENDING;
  const reviews = await prisma.review.findMany({
    where: { status },
    include: { car: { select: { id: true, brandAr: true, modelAr: true } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ reviews });
}
