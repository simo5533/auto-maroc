import type { Car } from "@prisma/client";

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
