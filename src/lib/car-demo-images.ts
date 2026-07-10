/**
 * Images de démonstration (véhicules) lorsque le catalogue n’a pas de médias réels
 * (Wikipédia / Commons). URLs autorisées dans next.config.ts.
 */

/** IDs Pexels — photos automobile génériques (repli stable par marque+modèle). */
const CAR_DEMO_PEXELS_IDS = [
  "112460",
  "210019",
  "1149137",
  "116675",
  "244206",
  "1149831",
  "170811",
  "1592384",
  "1164774",
  "3721471",
  "3802508",
  "1544617",
] as const;

const CAR_DEMO_IMAGE_URLS = CAR_DEMO_PEXELS_IDS.map(
  (id) =>
    `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1280`,
);

export function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/** URL Picsum : photos aléatoires (paysage, etc.) — pas des voitures. */
export function isPicsumPlaceholderUrl(url: string): boolean {
  return typeof url === "string" && url.includes("picsum.photos");
}

export function isCarDemoStockUrl(url: string): boolean {
  if (typeof url !== "string" || !url.includes("images.pexels.com")) return false;
  return CAR_DEMO_PEXELS_IDS.some((id) => url.includes(`/photos/${id}/`));
}

/** Pexels hors banque démo (souvent hors sujet) — à remplacer par Wikimedia ou banque démo. */
export function isPexelsNonDemoUrl(url: string): boolean {
  if (typeof url !== "string" || !url.includes("images.pexels.com/photos/")) return false;
  return !isCarDemoStockUrl(url);
}

/** Même marque+modèle → mêmes visuels de repli (pas une rotation par fiche). */
export function modelImageSeed(brandFr: string | null | undefined, modelFr: string | null | undefined): string {
  return `${brandFr?.trim() ?? ""}|${modelFr?.trim() ?? ""}`;
}

/**
 * Galerie déterministe (même graine → mêmes visuels) pour éviter les changements à chaque chargement.
 */
export function pickCarDemoGallery(seed: string, count: number): string[] {
  const n = Math.min(Math.max(Math.floor(count), 1), 12);
  const pool = CAR_DEMO_IMAGE_URLS;
  const start = hashSeed(seed) % pool.length;
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    out.push(pool[(start + i) % pool.length]!);
  }
  return out;
}
