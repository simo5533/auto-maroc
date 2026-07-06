import type { Car, CarSpecs, Review } from "@prisma/client";
import type { ProductStory } from "@/lib/car-product-story";

const MAX_CONTEXT_CHARS = 18_000;

function trunc(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max)}\n… [tronqué]`;
}

/**
 * Texte unique passé au modèle : uniquement les données de cette fiche (pas d’autres véhicules).
 */
export function buildCarKnowledgeContext(
  car: Car & {
    specs: CarSpecs | null;
    reviews?: Pick<Review, "commentAr" | "commentFr" | "globalNote" | "city">[];
  },
  productStory: ProductStory | null,
): string {
  const blocks: string[] = [];

  blocks.push(`--- Identité ---`);
  blocks.push(
    [
      `ID interne: ${car.id}`,
      `Marque FR: ${car.brandFr ?? "—"} | AR: ${car.brandAr}`,
      `Modèle FR: ${car.modelFr ?? "—"} | AR: ${car.modelAr}`,
      `Version FR: ${car.versionFr ?? "—"} | AR: ${car.versionAr}`,
      `Année: ${car.year}`,
      `Carburant: ${car.fuel}`,
      `Transmission: ${car.transmission}`,
      `Carrosserie: ${car.bodyType}`,
      `État catalogue par défaut: ${car.conditionDefault}`,
      `Prix neuf estimatif (MAD): ${car.priceNewEst}`,
      car.priceUsedEst != null ? `Prix occasion estimatif (MAD): ${car.priceUsedEst}` : null,
      `Couleur extérieure (indicatif): FR ${car.exteriorColorFr ?? "—"} | AR ${car.exteriorColorAr ?? "—"}`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  if (car.descriptionFr || car.descriptionAr) {
    blocks.push(`--- Descriptions catalogue ---`);
    blocks.push(`FR: ${car.descriptionFr ?? "—"}`);
    blocks.push(`AR: ${car.descriptionAr}`);
  }

  if (car.highlightsFr || car.highlightsAr) {
    blocks.push(`--- Points forts ---`);
    blocks.push(`FR: ${car.highlightsFr ?? "—"}`);
    blocks.push(`AR: ${car.highlightsAr ?? "—"}`);
  }

  if (car.specs) {
    const s = car.specs;
    blocks.push(`--- Fiche technique (extraits) ---`);
    blocks.push(
      trunc(
        JSON.stringify(
          {
            engineFr: s.engineFr,
            engineAr: s.engineAr,
            fiscalPower: s.fiscalPower,
            realPowerKw: s.realPowerKw,
            consumptionL100: s.consumptionL100,
            co2Gkm: s.co2Gkm,
            torqueNm: s.torqueNm,
            groundClearanceMm: s.groundClearanceMm,
            dimensionsAr: s.dimensionsAr,
            seats: s.seats,
            trunkL: s.trunkL,
            safetyAr: s.safetyAr,
            comfortAr: s.comfortAr,
            warrantyAr: s.warrantyAr,
            maintenanceCostEst: s.maintenanceCostEst,
            partsAvailabilityAr: s.partsAvailabilityAr,
            reliabilityScore: s.reliabilityScore,
            resaleScore: s.resaleScore,
            comfortScore: s.comfortScore,
            globalScore: s.globalScore,
          },
          null,
          2,
        ),
        6000,
      ),
    );
  }

  if (productStory) {
    blocks.push(`--- Détails & FAQ (fiche longue) ---`);
    for (const sec of productStory.sections) {
      blocks.push(
        `[${sec.category}] ${sec.titleFr} / ${sec.titleAr}\n${sec.bodyFr}\n---\n${sec.bodyAr}`,
      );
    }
    blocks.push(`--- FAQ ---`);
    for (const q of productStory.faq) {
      blocks.push(`Q(FR): ${q.qFr}\nR(FR): ${q.aFr}\nQ(AR): ${q.qAr}\nR(AR): ${q.aAr}`);
    }
    blocks.push(`--- Environnement / légal (extraits) ---`);
    blocks.push(`FR: ${productStory.environmentFr.slice(0, 2500)}`);
    blocks.push(`AR: ${productStory.environmentAr.slice(0, 2500)}`);
  }

  if (car.reviews?.length) {
    blocks.push(`--- Avis utilisateurs (extraits, statut approuvé) ---`);
    for (const r of car.reviews.slice(0, 8)) {
      const note = r.globalNote != null ? ` (note ${r.globalNote}/5)` : "";
      blocks.push(
        `- ${r.city}${note}: ${(r.commentFr ?? r.commentAr).slice(0, 400)}`,
      );
    }
  }

  const full = blocks.join("\n\n");
  return trunc(full, MAX_CONTEXT_CHARS);
}

export function buildCarAiSystemPrompt(locale: "ar" | "fr", context: string): string {
  const lang =
    locale === "ar"
      ? "Reply only in Moroccan Darija (الدارجة المغربية), using natural spoken Moroccan Arabic — not Modern Standard Arabic. Be clear and concise."
      : "Réponds uniquement en français. Sois clair et concis.";

  return `You are the Auto-Maroc in-page assistant for exactly ONE vehicle listing. ${lang}

Rules (must follow):
- Only answer questions about this specific vehicle, using ONLY the information in VEHICLE CONTEXT below. If the question is about another car, brand politics, or any topic not related to this listing, politely refuse and say you only answer questions about this model on this page.
- If the answer is not in the context, say honestly that the listing does not contain that information. Do not invent exact prices, consumption figures, or specifications not present in the context.
- You may summarize or rephrase information from the context. When mentioning prices, they are indicative (MAD) as in the catalogue unless stated otherwise.

VEHICLE CONTEXT:
${context}`;
}
