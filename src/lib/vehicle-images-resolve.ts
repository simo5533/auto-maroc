import type { Car } from "@prisma/client";

import type { PrismaClient } from "@prisma/client";

import {
  fetchCommonsVehicleImages,
  fetchWikipediaArBundle,
  fetchWikipediaEnBundle,
  fetchWikipediaFrBundle,
  wikiBundleImageMatchesVehicle,
} from "@/lib/catalog-media";

import { getStoredCarImageUrls } from "@/lib/car-images";

import {
  isCarDemoStockUrl,
  isPexelsNonDemoUrl,
  isPicsumPlaceholderUrl,
  pickCarDemoGallery,
} from "@/lib/car-demo-images";



function needsOpenSourceRefresh(urls: string[]): boolean {

  if (urls.length === 0) return true;

  return urls.some(
    (u) => isPicsumPlaceholderUrl(u) || isCarDemoStockUrl(u) || isPexelsNonDemoUrl(u),
  );

}



function pushWm(u: string | null | undefined, arr: string[]) {

  if (!u) return;

  if (!/^https:\/\/upload\.wikimedia\.org\//i.test(u)) return;

  if (!arr.includes(u)) arr.push(u);

}



/**
 * URL persistée fiable pour l’affichage immédiat :
 *   - Wikimedia Commons / Wikipédia (filtrées strictement à la persistance)
 *   - Pexels appartenant à la liste démo vérifiée (voitures uniquement)
 * Toute autre URL (Picsum, Pexels hors whitelist…) est rejetée pour éviter les photos hors sujet.
 */
function isTrustedDisplayUrl(url: string): boolean {
  if (typeof url !== "string" || url.length === 0) return false;
  if (isPicsumPlaceholderUrl(url)) return false;
  if (isPexelsNonDemoUrl(url)) return false;
  if (/^https:\/\/upload\.wikimedia\.org\//i.test(url)) return true;
  if (isCarDemoStockUrl(url)) return true;
  return false;
}

/**

 * URLs affichées : galerie persistée filtrée, puis repli galerie démo déterministe.

 */

export function getDisplayCarImageUrls(

  car: Pick<Car, "id" | "imageUrl" | "imageUrls" | "brandFr" | "modelFr">,

): string[] {

  const stored = getStoredCarImageUrls(car).filter(isTrustedDisplayUrl);

  if (stored.length > 0) return stored;

  return pickCarDemoGallery(`${car.brandFr ?? ""}|${car.modelFr ?? ""}|${car.id}`, 4);

}



async function persistGallery(prisma: PrismaClient, carId: string, urls: string[]) {

  if (urls.length === 0) return;

  await prisma.car.update({

    where: { id: carId },

    data: {

      imageUrl: urls[0] ?? null,

      imageUrls: urls,

    },

  });

}



/**

 * Télécharge vignettes Wikipédia, Commons filtré, Pexels ciblé (comme le générateur de catalogue),

 * pour obtenir des photos réelles liées à marque + modèle.

 */

export async function fetchOpenSourceVehicleImageUrls(
  brandFr: string,
  modelFr: string,
  modelAr?: string | null,
): Promise<string[]> {

  const commons = await fetchCommonsVehicleImages(brandFr, modelFr, 8);

  const [wikiFr, wikiAr, wikiEn] = await Promise.all([
    fetchWikipediaFrBundle(brandFr, modelFr),
    fetchWikipediaArBundle(brandFr, modelFr, modelAr),
    fetchWikipediaEnBundle(brandFr, modelFr),
  ]);

  const imageUrls: string[] = [];

  for (const u of commons) pushWm(u, imageUrls);

  if (wikiBundleImageMatchesVehicle(wikiFr, brandFr, modelFr)) pushWm(wikiFr.thumbnailUrl, imageUrls);
  if (wikiBundleImageMatchesVehicle(wikiAr, brandFr, modelFr)) pushWm(wikiAr.thumbnailUrl, imageUrls);
  if (wikiBundleImageMatchesVehicle(wikiEn, brandFr, modelFr)) pushWm(wikiEn.thumbnailUrl, imageUrls);

  if (imageUrls.length > 0 && imageUrls.length < 4) {

    const primary = imageUrls[0]!;

    while (imageUrls.length < 4) imageUrls.push(primary);

  }

  return imageUrls;

}



/**

 * Remplace Picsum / repli Pexels générique par des sources ouvertes, ou enregistre une galerie Pexels

 * de secours (toujours des URLs valides pour l’affichage).

 */

export async function ensureRealVehicleImages(prisma: PrismaClient, car: Car): Promise<string[]> {

  const stored = getStoredCarImageUrls(car);

  if (!needsOpenSourceRefresh(stored)) {

    return stored;

  }



  const brandFr = car.brandFr?.trim();

  const modelFr = car.modelFr?.trim();

  const seed = `${brandFr ?? ""}|${modelFr ?? ""}|${car.id}`;



  if (!brandFr || !modelFr) {

    const demo = pickCarDemoGallery(car.id, 4);

    await persistGallery(prisma, car.id, demo);

    return demo;

  }



  try {

    const fresh = await fetchOpenSourceVehicleImageUrls(brandFr, modelFr, car.modelAr);

    if (fresh.length > 0) {

      await persistGallery(prisma, car.id, fresh);

      return fresh;

    }

  } catch {

    /* repli galerie démo */

  }



  const demo = pickCarDemoGallery(seed, 4);

  await persistGallery(prisma, car.id, demo);

  return demo;

}

