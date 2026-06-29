import { NextResponse } from "next/server";
import { z } from "zod";
import { ReviewStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const patchSchema = z.object({
  status: z.nativeEnum(ReviewStatus),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s || s.role !== "ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const review = await prisma.review.update({ where: { id }, data: { status: parsed.data.status } });
  return NextResponse.json({ review });
}
