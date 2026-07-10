import type { Car } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import {
  fetchCommonsVehicleImages,
  fetchWikipediaArBundle,
  fetchWikipediaEnBundle,
  fetchWikipediaFrBundle,
  wikiBundleImageMatchesVehicle,
} from "@/lib/catalog-media";
import { getStoredCarImageUrls, isTrustedCarImageUrl } from "@/lib/car-images";
import {
  isPicsumPlaceholderUrl,
  isPexelsNonDemoUrl,
  modelImageSeed,
  pickCarDemoGallery,
} from "@/lib/car-demo-images";

export { getDisplayCarImageUrls } from "@/lib/car-images";

/** Seules les URLs Picsum (faux placeholders) ou galeries vides déclenchent un rafraîchissement. */
function needsOpenSourceRefresh(urls: string[]): boolean {
  if (urls.length === 0) return true;
  if (urls.some(isPicsumPlaceholderUrl)) return true;
  if (urls.some(isPexelsNonDemoUrl)) return true;
  return !urls.some(isTrustedCarImageUrl);
}

function pushWm(u: string | null | undefined, arr: string[]) {
  if (!u) return;
  if (!/^https:\/\/upload\.wikimedia\.org\//i.test(u)) return;
  if (!arr.includes(u)) arr.push(u);
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

/** Réutilise la galerie d’une autre fiche même marque+modèle (évite 637 appels réseau). */
async function findSiblingTrustedGallery(
  prisma: PrismaClient,
  car: Car,
): Promise<string[] | null> {
  if (!car.brandFr?.trim() || !car.modelFr?.trim()) return null;

  const siblings = await prisma.car.findMany({
    where: {
      brandFr: car.brandFr,
      modelFr: car.modelFr,
      NOT: { id: car.id },
    },
    select: { imageUrl: true, imageUrls: true },
    take: 8,
  });

  for (const s of siblings) {
    const urls = getStoredCarImageUrls(s).filter(isTrustedCarImageUrl);
    if (urls.length > 0) return urls;
  }
  return null;
}

export async function ensureRealVehicleImages(prisma: PrismaClient, car: Car): Promise<string[]> {
  const stored = getStoredCarImageUrls(car);

  if (!needsOpenSourceRefresh(stored)) {
    return stored.filter(isTrustedCarImageUrl);
  }

  const brandFr = car.brandFr?.trim();
  const modelFr = car.modelFr?.trim();
  const seed = modelImageSeed(brandFr, modelFr);

  const sibling = await findSiblingTrustedGallery(prisma, car);
  if (sibling?.length) {
    await persistGallery(prisma, car.id, sibling);
    return sibling;
  }

  if (brandFr && modelFr) {
    try {
      const fresh = await fetchOpenSourceVehicleImageUrls(brandFr, modelFr, car.modelAr);
      if (fresh.length > 0) {
        await persistGallery(prisma, car.id, fresh);
        return fresh;
      }
    } catch {
      /* repli galerie démo */
    }
  }

  const demo = pickCarDemoGallery(seed || car.id, 4);
  await persistGallery(prisma, car.id, demo);
  return demo;
}
