import { toDarijaLatin } from "@/lib/darija-latin";

export type AppLocale = "ar" | "fr";

export function toAppLocale(locale: string): AppLocale {
  return locale === "ar" ? "ar" : "fr";
}

/** Un seul idiome affiché — pas de repli vers l’autre langue sur la même page. */
export function pickLocaleText(
  locale: string,
  ar: string | null | undefined,
  fr: string | null | undefined,
): string {
  const loc = toAppLocale(locale);
  if (loc === "ar") return ar?.trim() ?? "";
  return fr?.trim() ?? "";
}

export function carBrandLabel(
  car: { brandAr: string; brandFr?: string | null },
  locale: string,
): string {
  return pickLocaleText(locale, car.brandAr, car.brandFr);
}

export function carModelLabel(
  car: { modelAr: string; modelFr?: string | null },
  locale: string,
): string {
  return pickLocaleText(locale, car.modelAr, car.modelFr);
}

export function carVersionLabel(
  car: { versionAr: string; versionFr?: string | null },
  locale: string,
): string {
  return pickLocaleText(locale, car.versionAr, car.versionFr);
}

export function reviewComment(
  review: { commentAr: string; commentFr: string | null },
  locale: string,
): string {
  if (toAppLocale(locale) === "ar") {
    // Mode darija : alphabet latin (franco-arabe), pas le script arabe.
    return toDarijaLatin(review.commentAr);
  }
  return review.commentFr?.trim() ?? "";
}

export function reviewDisplayLabel(
  review: {
    displayLabel: string;
    displayLabelFr?: string | null;
    city: string;
    usageMonths?: number | null;
    mileageKm?: number | null;
  },
  locale: string,
): string {
  if (toAppLocale(locale) === "ar") {
    // Labels aussi en alphabet latin (Karim — Casablanca…), pas محمد / الدار البيضاء.
    const latin =
      review.displayLabelFr?.trim() ||
      toDarijaLatin(review.displayLabel) ||
      review.city;
    return latin;
  }
  if (review.displayLabelFr?.trim()) {
    return review.displayLabelFr.trim();
  }
  const bits: string[] = [];
  bits.push(review.usageMonths != null ? `Propriétaire — env. ${review.usageMonths} mois` : "Propriétaire");
  bits.push(review.city);
  if (review.mileageKm != null) bits.push(`${review.mileageKm.toLocaleString("fr-FR")} km`);
  return bits.join(" · ");
}
