import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { parseProductStory } from "@/lib/car-product-story";
import { buildProductStoryPayload } from "@/lib/car-product-story-build";
import { answerCarQuestionOffline } from "@/lib/car-ai-offline";
import { buildCarAiSystemPrompt, buildCarKnowledgeContext } from "@/lib/car-ai-context";
import { getOpenAiApiKey } from "@/lib/openai-env";
import { findApprovedReviewsForCar } from "@/lib/car-model-reviews";

const bodySchema = z.object({
  locale: z.enum(["ar", "fr"]),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(6000),
      }),
    )
    .min(1)
    .max(28),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const raw = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body", details: parsed.error.flatten() }, { status: 400 });
  }

  const carBase = await prisma.car.findUnique({
    where: { id },
    include: {
      specs: true,
    },
  });

  if (!carBase) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { reviews: modelYearReviews } = await findApprovedReviewsForCar(carBase, { take: 16 });

  const car = { ...carBase, reviews: modelYearReviews };

  const productStory =
    parseProductStory(car.specs?.productStory) ??
    buildProductStoryPayload({
      brandFr: car.brandFr ?? "—",
      brandAr: car.brandAr,
      modelFr: car.modelFr ?? "—",
      modelAr: car.modelAr,
      bodyType: car.bodyType,
      fuel: car.fuel,
      versionFr: car.versionFr ?? car.versionAr,
      versionAr: car.versionAr,
      year: car.year,
      co2Gkm: car.specs?.co2Gkm ?? null,
      consumptionL100: car.specs?.consumptionL100 ?? null,
    });

  const context = buildCarKnowledgeContext(car, productStory);

  const last = parsed.data.messages[parsed.data.messages.length - 1];
  if (!last || last.role !== "user") {
    return NextResponse.json({ error: "last_message_must_be_user" }, { status: 400 });
  }

  const key = getOpenAiApiKey();
  if (!key) {
    const reply = answerCarQuestionOffline(parsed.data.locale, context, last.content);
    return NextResponse.json({ reply, source: "offline" as const });
  }

  const system = buildCarAiSystemPrompt(parsed.data.locale, context);
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

  const openaiMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: system },
    ...parsed.data.messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: openaiMessages,
      temperature: 0.35,
      max_tokens: 900,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("OpenAI error", res.status, errText.slice(0, 500));
    return NextResponse.json({ error: "openai_error" }, { status: 502 });
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const reply = data.choices?.[0]?.message?.content?.trim();
  if (!reply) {
    return NextResponse.json({ error: "empty_reply" }, { status: 502 });
  }

  return NextResponse.json({ reply, source: "openai" as const });
}
