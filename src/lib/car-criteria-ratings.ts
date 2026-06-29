import type { CarSpecs, FuelType, Review } from "@prisma/client";

export type CarCriterionId =
  | "comfort"
  | "consumption"
  | "reliability"
  | "resale"
  | "maintenance"
  | "overall";

export type CarCriterionRating = {
  id: CarCriterionId;
  percentage: number;
  stars: number;
};

function clampPct(n: number): number {
  if (!Number.isFinite(n)) return 70;
  return Math.min(100, Math.max(0, Math.round(n)));
}

export function pctToStarsOutOf5(pct: number): number {
  return Math.min(5, Math.max(1, Math.round(pct / 20)));
}

function avgReviewNotes(
  reviews: Pick<
    Review,
    "comfortNote" | "consumptionNote" | "reliabilityNote" | "maintenanceNote" | "resaleNote"
  >[],
  key: keyof Pick<
    Review,
    "comfortNote" | "consumptionNote" | "reliabilityNote" | "maintenanceNote" | "resaleNote"
  >,
  minSamples: number,
): number | null {
  const vals: number[] = [];
  for (const r of reviews) {
    const v = r[key];
    if (typeof v === "number" && v >= 1 && v <= 5) vals.push(v);
  }
  if (vals.length < minSamples) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function noteAvgToPct(avg: number): number {
  return clampPct((avg / 5) * 100);
}

/** Plus la conso est basse, plus le pourcentage est haut (meilleur). */
export function consumptionPctFromL100(l100: number, fuel: FuelType): number {
  if (fuel === "ELECTRIC") {
    const good = 13;
    const bad = 24;
    const t = (l100 - good) / (bad - good);
    return clampPct(100 - t * 55);
  }
  if (fuel === "HYBRID") {
    const good = 4;
    const bad = 8.5;
    const t = (l100 - good) / (bad - good);
    return clampPct(100 - t * 58);
  }
  if (fuel === "DIESEL") {
    const good = 4.5;
    const bad = 10.5;
    const t = (l100 - good) / (bad - good);
    return clampPct(100 - t * 58);
  }
  const good = 5.5;
  const bad = 11;
  const t = (l100 - good) / (bad - good);
  return clampPct(100 - t * 58);
}

/** Coût d’entretien annuel (MAD) : plus bas = mieux. */
export function maintenancePctFromMadAnnual(mad: number): number {
  if (mad <= 2200) return 92;
  if (mad <= 3800) return 82;
  if (mad <= 5500) return 72;
  if (mad <= 7500) return 60;
  if (mad <= 10000) return 48;
  return 38;
}

type BuildInput = {
  specs: CarSpecs | null;
  fuel: FuelType;
  priceNewEst: number;
  reviews: Pick<
    Review,
    | "comfortNote"
    | "consumptionNote"
    | "reliabilityNote"
    | "maintenanceNote"
    | "resaleNote"
  >[];
};

/**
 * Notes affichées sur la fiche : pourcentage 0–100 et étoiles 1–5.
 * Priorité aux moyennes d’avis (≥ 2 notes) quand présentes, sinon scores catalogue ou heuristiques.
 */
export function buildCarCriteriaRatings(input: BuildInput): CarCriterionRating[] {
  const { specs, fuel, priceNewEst, reviews } = input;
  const minN = 2;

  const comfortFromReviews = avgReviewNotes(reviews, "comfortNote", minN);
  const consumptionFromReviews = avgReviewNotes(reviews, "consumptionNote", minN);
  const reliabilityFromReviews = avgReviewNotes(reviews, "reliabilityNote", minN);
  const resaleFromReviews = avgReviewNotes(reviews, "resaleNote", minN);
  const maintenanceFromReviews = avgReviewNotes(reviews, "maintenanceNote", minN);

  const comfortPct =
    comfortFromReviews != null
      ? noteAvgToPct(comfortFromReviews)
      : specs?.comfortScore != null
        ? clampPct(specs.comfortScore)
        : 70;

  let consumptionPct: number;
  if (consumptionFromReviews != null) {
    consumptionPct = noteAvgToPct(consumptionFromReviews);
  } else if (specs?.consumptionL100 != null && specs.consumptionL100 > 0) {
    consumptionPct = consumptionPctFromL100(specs.consumptionL100, fuel);
  } else {
    consumptionPct = 70;
  }

  const reliabilityPct =
    reliabilityFromReviews != null
      ? noteAvgToPct(reliabilityFromReviews)
      : specs?.reliabilityScore != null
        ? clampPct(specs.reliabilityScore)
        : 70;

  const resalePct =
    resaleFromReviews != null
      ? noteAvgToPct(resaleFromReviews)
      : specs?.resaleScore != null
        ? clampPct(specs.resaleScore)
        : 70;

  let maintenancePct: number;
  if (maintenanceFromReviews != null) {
    maintenancePct = noteAvgToPct(maintenanceFromReviews);
  } else if (specs?.maintenanceCostEst != null && specs.maintenanceCostEst > 0) {
    maintenancePct = maintenancePctFromMadAnnual(specs.maintenanceCostEst);
  } else {
    maintenancePct = Math.min(88, Math.max(52, Math.round(72 - priceNewEst / 180_000)));
  }

  let overallPct: number;
  if (specs?.globalScore != null) {
    overallPct = clampPct(specs.globalScore);
  } else {
    overallPct = clampPct(
      (comfortPct + consumptionPct + reliabilityPct + resalePct + maintenancePct) / 5,
    );
  }

  const rows: CarCriterionRating[] = [
    { id: "comfort", percentage: comfortPct, stars: pctToStarsOutOf5(comfortPct) },
    { id: "consumption", percentage: consumptionPct, stars: pctToStarsOutOf5(consumptionPct) },
    { id: "reliability", percentage: reliabilityPct, stars: pctToStarsOutOf5(reliabilityPct) },
    { id: "resale", percentage: resalePct, stars: pctToStarsOutOf5(resalePct) },
    { id: "maintenance", percentage: maintenancePct, stars: pctToStarsOutOf5(maintenancePct) },
    { id: "overall", percentage: overallPct, stars: pctToStarsOutOf5(overallPct) },
  ];

  return rows;
}
