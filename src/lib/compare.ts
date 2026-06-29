import type { Car, CarSpecs } from "@prisma/client";

export type CarWithSpecs = Car & { specs: CarSpecs | null };

function scoreCar(c: CarWithSpecs): number {
  const g = c.specs?.globalScore ?? 70;
  const rel = c.specs?.reliabilityScore ?? g;
  const parts = c.specs?.partsAvailabilityAr ? 5 : 0;
  return g * 0.5 + rel * 0.35 + Math.min(parts, 10);
}

export function buildComparisonConclusion(
  cars: CarWithSpecs[],
  locale: "ar" | "fr",
  budgetMAD?: number,
): { winnerId: string; textAr: string; textFr: string } {
  if (cars.length === 0) {
    return {
      winnerId: "",
      textAr: "لا توجد سيارات للمقارنة.",
      textFr: "Aucun véhicule à comparer.",
    };
  }

  const ranked = [...cars].sort((a, b) => scoreCar(b) - scoreCar(a));
  const best = ranked[0]!;
  const second = ranked[1];

  const nameAr = `${best.brandAr} ${best.modelAr}`;
  const nameFr = [best.brandFr ?? best.brandAr, best.modelFr ?? best.modelAr].join(" ");

  const budgetHint =
    budgetMAD != null && budgetMAD > 0
      ? locale === "ar"
        ? `لميزانية تقريبية ${budgetMAD.toLocaleString("ar-MA")} درهم، `
        : `Pour un budget d’environ ${budgetMAD.toLocaleString("fr-FR")} MAD, `
      : locale === "ar"
        ? ""
        : "";

  if (!second) {
    return {
      winnerId: best.id,
      textAr: `${budgetHint}النموذج ${nameAr} هو المرجع الوحيد المختار.`,
      textFr: `${budgetHint}le modèle ${nameFr} est la seule référence.`,
    };
  }

  const cheaper = best.priceNewEst <= second.priceNewEst ? best : second;

  const textAr = `${budgetHint}يُنصح بـ ${nameAr} لتوازن أفضل بين التقييم الإجمالي (${best.specs?.globalScore ?? "—"}/100) والصيانة المقدرة. ${
    cheaper.id === best.id ? "هو الأنسب سعراً ضمن المقارنة." : "قارن السعر مع البديل الأرخص إن كان ذلك مناسباً لك."
  }`;

  const g = best.specs?.globalScore ?? "—";
  const textFr = `${budgetHint}nous recommandons ${nameFr} pour un meilleur équilibre (score global ${g}/100) et coûts d’entretien. ${
    cheaper.id === best.id
      ? "C’est aussi le plus accessible en prix neuf dans ce duo."
      : "Vérifiez l’alternative moins chère si le budget est prioritaire."
  }`;

  return { winnerId: best.id, textAr, textFr };
}
