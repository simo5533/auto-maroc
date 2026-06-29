/**
 * Images de démonstration (véhicules) lorsque le catalogue n’a pas de médias réels
 * (ex. génération avec CATALOG_SKIP_MEDIA=1) ou remplacement des anciennes URLs Picsum.
 * URLs autorisées dans next.config.ts : images.pexels.com, upload.wikimedia.org.
 */

/** IDs Pexels utilisés comme repli générique (vérifiés, photos de voitures uniquement). */
const CAR_DEMO_PEXELS_IDS = [
  "112460",
  "210019",
  "1149137",
  "116675",
  "244206",
  "1149831",
] as const;

const CAR_DEMO_IMAGE_URLS = [
  "https://images.pexels.com/photos/112460/pexels-photo-112460.jpeg?auto=compress&cs=tinysrgb&w=1280",
  "https://images.pexels.com/photos/210019/pexels-photo-210019.jpeg?auto=compress&cs=tinysrgb&w=1280",
  "https://images.pexels.com/photos/1149137/pexels-photo-1149137.jpeg?auto=compress&cs=tinysrgb&w=1280",
  "https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg?auto=compress&cs=tinysrgb&w=1280",
  "https://images.pexels.com/photos/244206/pexels-photo-244206.jpeg?auto=compress&cs=tinysrgb&w=1280",
  "https://images.pexels.com/photos/1149831/pexels-photo-1149831.jpeg?auto=compress&cs=tinysrgb&w=1280",
] as const;

export function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/** URL Picsum utilisée comme repli dans d’anciennes générations de catalogue. */
export function isPicsumPlaceholderUrl(url: string): boolean {
  return typeof url === "string" && url.includes("picsum.photos");
}

export function isCarDemoStockUrl(url: string): boolean {
  if (typeof url !== "string" || !url.includes("images.pexels.com")) return false;
  return CAR_DEMO_PEXELS_IDS.some((id) => url.includes(`/photos/${id}/`));
}

/** Pexels hors liste démo (ex. résultats API « marque + modèle » souvent non représentatifs). */
export function isPexelsNonDemoUrl(url: string): boolean {
  if (typeof url !== "string" || !url.includes("images.pexels.com/photos/")) return false;
  return !isCarDemoStockUrl(url);
}

/**
 * Galerie déterministe (même graine → mêmes visuels) pour éviter les photos hors sujet.
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
