import { NextResponse } from "next/server";
import { ReviewOrigin } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const car = await prisma.car.findUnique({
    where: { id },
    include: {
      specs: true,
      reviews: {
        where: {
          status: "APPROVED",
          NOT: { reviewOrigin: ReviewOrigin.CATALOG_DEMO },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!car) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ car });
}
