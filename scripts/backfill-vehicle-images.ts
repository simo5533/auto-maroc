/**
 * Remplit la base avec des images réelles (Wikipédia + Commons + Pexels) pour les fiches
 * qui ont encore Picsum, le repli Pexels générique, ou une galerie vide.
 *
 * Exécution (réseau requis, long) :
 *   npx tsx scripts/backfill-vehicle-images.ts
 *   npx tsx scripts/backfill-vehicle-images.ts --limit=50
 *
 * Clé Pexels optionnelle (plus de résultats) : PEXELS_ACCESS_KEY dans .env
 */
import { loadEnvFiles } from "./lib/load-env";
import { PrismaClient } from "@prisma/client";
import { ensureRealVehicleImages } from "../src/lib/vehicle-images-resolve";
import { getStoredCarImageUrls } from "../src/lib/car-images";
import {
  isCarDemoStockUrl,
  isPexelsNonDemoUrl,
  isPicsumPlaceholderUrl,
} from "../src/lib/car-demo-images";

function needsBackfill(urls: string[]): boolean {
  if (urls.length === 0) return true;
  if (urls.some((u) => isPicsumPlaceholderUrl(u) || isPexelsNonDemoUrl(u))) return true;
  return !urls.every((u) => {
    if (isPicsumPlaceholderUrl(u) || isPexelsNonDemoUrl(u)) return false;
    return u.includes("upload.wikimedia.org") || isCarDemoStockUrl(u);
  });
}

function parseArgs() {
  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1] ?? "", 10) : undefined;
  return { limit: Number.isFinite(limit!) && (limit as number) > 0 ? (limit as number) : undefined };
}

async function main() {
  loadEnvFiles();
  const { limit } = parseArgs();
  const prisma = new PrismaClient();

  const all = await prisma.car.findMany();
  const pending = all.filter((car) => needsBackfill(getStoredCarImageUrls(car)));
  const slice = limit ? pending.slice(0, limit) : pending;

  console.log(`À traiter : ${slice.length} véhicule(s) (${pending.length} nécessaires au total).`);

  let ok = 0;
  let skip = 0;
  for (let i = 0; i < slice.length; i++) {
    const car = slice[i]!;
    process.stdout.write(`[${i + 1}/${slice.length}] ${car.brandFr} ${car.modelFr}… `);
    const urls = await ensureRealVehicleImages(prisma, car);
    const improved = urls.length > 0 && !needsBackfill(urls);
    if (improved) {
      ok++;
      console.log(`OK (${urls.length} images)`);
    } else {
      skip++;
      console.log(`inchangé (${urls.length})`);
    }
    await new Promise((r) => setTimeout(r, 350));
  }

  await prisma.$disconnect();
  console.log(`Terminé — mis à jour utile : ${ok}, sans nouveau jeu d’images : ${skip}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
