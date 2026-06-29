import type { Car } from "@prisma/client";
import { hashSeed } from "@/lib/car-demo-images";

const EXTERIOR_COLOR_PAIRS: { fr: string; ar: string }[] = [
  { fr: "Gris métallisé", ar: "رمادي معدني" },
  { fr: "Blanc nacré", ar: "أبيض لؤلؤي" },
  { fr: "Noir saphir métallisé", ar: "أسود ياقوتي معدني" },
  { fr: "Bleu marina métallisé", ar: "أزرق مارين معدني" },
  { fr: "Rouge fusion métallisé", ar: "أحمر مرجان معدني" },
  { fr: "Argent Alaska métallisé", ar: "فضي ألاسكا معدني" },
  { fr: "Vert racing métallisé", ar: "أخضر سباق معدني" },
  { fr: "Bronze cuivré métallisé", ar: "برونزي نحاسي معدني" },
  { fr: "Beige dune (perle)", ar: "بيج رملي (لؤلؤي)" },
  { fr: "Gris Minéral satiné", ar: "رمادي معدني ساتان" },
];

/**
 * Teinte affichée sur la fiche / catalogue (base de données ou tirage déterministe depuis l’id).
 */
export function resolveExteriorColors(car: Pick<Car, "id" | "exteriorColorFr" | "exteriorColorAr">): {
  fr: string;
  ar: string;
} {
  const fr = car.exteriorColorFr?.trim();
  const ar = car.exteriorColorAr?.trim();
  if (fr || ar) {
    return {
      fr: fr ?? ar ?? "—",
      ar: ar ?? fr ?? "—",
    };
  }
  const i = hashSeed(car.id) % EXTERIOR_COLOR_PAIRS.length;
  return EXTERIOR_COLOR_PAIRS[i]!;
}

/** Pour la génération catalogue : couleur stable selon l’index de ligne. */
export function pickCatalogExteriorColor(idx: number): { fr: string; ar: string } {
  const i = Math.abs(idx) % EXTERIOR_COLOR_PAIRS.length;
  return EXTERIOR_COLOR_PAIRS[i]!;
}
