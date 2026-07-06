import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOpenAiApiKey } from "@/lib/openai-env";

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
    .max(30),
});

function isAutomotiveQuestion(text: string): boolean {
  const q = text.toLowerCase();
  const keywords = [
    "car",
    "voiture",
    "auto",
    "suv",
    "berline",
    "diesel",
    "essence",
    "hybride",
    "electrique",
    "électrique",
    "consommation",
    "fiabil",
    "prix",
    "mad",
    "coffre",
    "moteur",
    "transmission",
    "marque",
    "modele",
    "modèle",
    "bmw",
    "dacia",
    "renault",
    "peugeot",
    "سيارة",
    "سيارات",
    "محرك",
    "استهلاك",
    "سعر",
    "ديزل",
    "بنزين",
    "هايبريد",
    "كهرباء",
    "موديل",
  ];
  return keywords.some((k) => q.includes(k));
}

function offlineReply(locale: "ar" | "fr", question: string): string {
  if (!isAutomotiveQuestion(question)) {
    return locale === "ar"
      ? "أجيب فقط عن الأسئلة المتعلقة بالسيارات (اختيار موديل، مقارنة، سعر، استهلاك، اعتمادية، تجهيزات...)."
      : "Je réponds uniquement aux questions liées aux voitures (choix de modèle, comparaison, prix, consommation, fiabilité, équipements...).";
  }
  return locale === "ar"
    ? "حالياً أعمل في وضع محلي. يمكنني مساعدتك في: المقارنة بين الموديلات، تقدير الاستهلاك والتكلفة، ونقاط القوة/الضعف حسب نوع الاستعمال."
    : "Je suis en mode local pour le moment. Je peux vous aider sur : comparaison de modèles, estimation conso/coût, et points forts/faibles selon votre usage.";
}

function buildSystemPrompt(locale: "ar" | "fr", context: string): string {
  const lang =
    locale === "ar"
      ? "Reply only in Moroccan Darija (الدارجة المغربية), using natural spoken Moroccan Arabic — not Modern Standard Arabic."
      : "Réponds uniquement en français.";
  return `You are the main Auto-Maroc assistant. ${lang}
You MUST answer only automotive questions (cars, models, prices, reliability, maintenance, comparison, buying advice).
If the user asks about non-automotive topics, politely refuse and remind that you only answer car-related questions.
Never invent exact facts when unknown; say the information is not available in current data.

Catalog context (sample):
${context}`;
}

export async function POST(req: Request) {
  const raw = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body", details: parsed.error.flatten() }, { status: 400 });
  }

  const last = parsed.data.messages[parsed.data.messages.length - 1];
  if (!last || last.role !== "user") {
    return NextResponse.json({ error: "last_message_must_be_user" }, { status: 400 });
  }

  if (!isAutomotiveQuestion(last.content)) {
    return NextResponse.json({ reply: offlineReply(parsed.data.locale, last.content), source: "guard" as const });
  }

  const key = getOpenAiApiKey();
  if (!key) {
    return NextResponse.json({ reply: offlineReply(parsed.data.locale, last.content), source: "offline" as const });
  }

  const cars = await prisma.car.findMany({
    orderBy: [{ brandAr: "asc" }, { modelAr: "asc" }],
    take: 120,
    select: {
      brandAr: true,
      brandFr: true,
      modelAr: true,
      modelFr: true,
      year: true,
      fuel: true,
      bodyType: true,
      priceNewEst: true,
      specs: { select: { consumptionL100: true, globalScore: true, reliabilityScore: true } },
    },
  });

  const context = cars
    .slice(0, 80)
    .map(
      (c) =>
        `${c.brandFr ?? c.brandAr} ${c.modelFr ?? c.modelAr} (${c.year}) | ${c.fuel}/${c.bodyType} | ${c.priceNewEst} MAD | conso ${c.specs?.consumptionL100 ?? "n/a"} | score ${c.specs?.globalScore ?? "n/a"}`,
    )
    .join("\n");

  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const system = buildSystemPrompt(parsed.data.locale, context);
  const openaiMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: system },
    ...parsed.data.messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
  ];

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: openaiMessages,
      temperature: 0.25,
      max_tokens: 700,
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    console.error("assistant openai error", res.status, txt.slice(0, 500));
    return NextResponse.json({ reply: offlineReply(parsed.data.locale, last.content), source: "fallback" as const });
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const reply = data.choices?.[0]?.message?.content?.trim();
  if (!reply) {
    return NextResponse.json({ reply: offlineReply(parsed.data.locale, last.content), source: "fallback" as const });
  }
  return NextResponse.json({ reply, source: "openai" as const });
}
