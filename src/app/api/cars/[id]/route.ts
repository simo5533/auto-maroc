import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const car = await prisma.car.findUnique({
    where: { id },
    include: {
      specs: true,
      reviews: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!car) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ car });
}
