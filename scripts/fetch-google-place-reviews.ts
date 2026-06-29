/**
 * Récupère les avis publics Google Maps (Places API New) pour un lieu (concession, garage…)
 * et les attache à une fiche véhicule. Nécessite une clé avec « Places API (New) » activée.
 *
 * Usage :
 *   npm run reviews:google -- --car-id=VOTRE_CUID --place-id=ChIJxxxxxxxx
 *
 * Variables optionnelles : GOOGLE_MAPS_API_KEY (ou GOOGLE_PLACES_API_KEY)
 *
 * Le place_id : ouvrir la fiche Google Maps du lieu → Partager → intégrer une carte,
 * ou utiliser l’outil « Place ID » du centre Google Cloud.
 */
import { PrismaClient, ReviewOrigin, ReviewStatus } from "@prisma/client";
import { loadEnvFiles } from "./lib/load-env";

loadEnvFiles();

const prisma = new PrismaClient();

type PlacesReview = {
  rating?: number;
  text?: { text?: string };
  authorAttribution?: { displayName?: string };
  publishTime?: string;
};

type PlacesResponse = {
  reviews?: PlacesReview[];
};

function parseArgs(): { carId: string; placeId: string } {
  let carId = "";
  let placeId = "";
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a.startsWith("--car-id=")) carId = a.slice("--car-id=".length).trim();
    else if (a === "--car-id" && argv[i + 1]) carId = argv[++i]!.trim();
    else if (a.startsWith("--place-id=")) placeId = a.slice("--place-id=".length).trim();
    else if (a === "--place-id" && argv[i + 1]) placeId = argv[++i]!.trim();
  }
  if (!carId || !placeId) {
    console.error(
      "Usage : npm run reviews:google -- --car-id=<cuid> --place-id=<ChIJ...>\nExemple : npm run reviews:google -- --car-id=abc123 --place-id=ChIJn8vo2lZ5oRQRiAY15RhpIQ",
    );
    process.exit(1);
  }
  return { carId, placeId };
}

async function main() {
  const { carId, placeId } = parseArgs();
  const apiKey =
    process.env.GOOGLE_MAPS_API_KEY?.trim() || process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!apiKey) {
    console.error("Définissez GOOGLE_MAPS_API_KEY (ou GOOGLE_PLACES_API_KEY) dans .env");
    process.exit(1);
  }

  const car = await prisma.car.findUnique({ where: { id: carId }, select: { id: true } });
  if (!car) {
    console.error("car-id introuvable.");
    process.exit(1);
  }

  const pid = placeId.startsWith("places/") ? placeId.slice("places/".length) : placeId;
  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(pid)}`;

  const res = await fetch(url, {
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "reviews",
    },
  });

  if (!res.ok) {
    const t = await res.text();
    console.error("Places API erreur", res.status, t.slice(0, 600));
    process.exit(1);
  }

  const data = (await res.json()) as PlacesResponse;
  const list = data.reviews ?? [];
  if (list.length === 0) {
    console.warn("Aucun avis renvoyé pour ce lieu (quota, lieu sans avis, ou masque API).");
    process.exit(0);
  }

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${encodeURIComponent(pid)}`;

  let n = 0;
  for (const rv of list) {
    const text = rv.text?.text?.trim();
    if (!text) continue;
    const author = rv.authorAttribution?.displayName?.trim() || "Google user";
    const rating = Math.round(rv.rating ?? 3);
    const stars = Math.min(5, Math.max(1, rating));

    await prisma.review.create({
      data: {
        carId,
        userId: null,
        displayLabel: `Google Maps — ${author} — ${stars}/5`,
        city: "Import Google",
        globalNote: stars,
        commentAr: text,
        commentFr: text,
        sourceName: "Google Maps",
        sourceUrl: mapsUrl,
        reviewOrigin: ReviewOrigin.IMPORT,
        verified: false,
        status: ReviewStatus.APPROVED,
      },
    });
    n++;
  }

  console.log(`${n} avis Google importés pour la fiche ${carId}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
