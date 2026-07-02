import type { Car } from "@prisma/client";
import {
  isCarDemoStockUrl,
  isPexelsNonDemoUrl,
  isPicsumPlaceholderUrl,
  pickCarDemoGallery,
} from "@/lib/car-demo-images";

/** URL affichable (Wikimedia ou Pexels voiture vérifié) — rejette Picsum et Pexels hors sujet. */
export function isTrustedCarImageUrl(url: string): boolean {
  if (typeof url !== "string" || url.length === 0) return false;
  if (isPicsumPlaceholderUrl(url)) return false;
  if (isPexelsNonDemoUrl(url)) return false;
  if (/^https:\/\/upload\.wikimedia\.org\//i.test(url)) return true;
  if (isCarDemoStockUrl(url)) return true;
  return false;
}

/** URLs affichées : galerie filtrée, puis repli photos voiture (Pexels démo). */
export function getDisplayCarImageUrls(
  car: Pick<Car, "id" | "imageUrl" | "imageUrls" | "brandFr" | "modelFr">,
): string[] {
  const stored = getStoredCarImageUrls(car).filter(isTrustedCarImageUrl);
  if (stored.length > 0) return stored;
  return pickCarDemoGallery(`${car.brandFr ?? ""}|${car.modelFr ?? ""}|${car.id}`, 4);
}

export function getCarCoverImageUrl(
  car: Pick<Car, "id" | "imageUrl" | "imageUrls" | "brandFr" | "modelFr">,
): string | null {
  return getDisplayCarImageUrls(car)[0] ?? null;
}

/** URLs brutes en base (imageUrls JSON + repli imageUrl). Sans substitution — pour photos réelles voir ensureRealVehicleImages. */
export function getStoredCarImageUrls(car: Pick<Car, "imageUrl" | "imageUrls">): string[] {
  const raw = car.imageUrls;
  let urls: string[];
  if (Array.isArray(raw)) {
    urls = raw.filter((u): u is string => typeof u === "string" && u.length > 0);
  } else if (raw != null && typeof raw === "string") {
    try {
      const p = JSON.parse(raw) as unknown;
      urls = Array.isArray(p) ? p.filter((u): u is string => typeof u === "string" && u.length > 0) : [];
    } catch {
      urls = [];
    }
  } else {
    urls = [];
  }
  if (urls.length === 0 && car.imageUrl) {
    urls = [car.imageUrl];
  }
  return urls;
}

/** @deprecated utiliser getStoredCarImageUrls — alias pour le catalogue. */
export function parseCarImageUrls(car: Pick<Car, "imageUrl" | "imageUrls">): string[] {
  return getStoredCarImageUrls(car);
}
