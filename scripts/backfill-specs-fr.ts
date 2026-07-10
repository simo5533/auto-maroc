/**
 * Remplit les champs specs FR manquants (dimensions, sécurité, confort, pièces, garantie).
 *
 * Usage : npm run specs:backfill-fr
 */
import { PrismaClient } from "@prisma/client";
import { loadEnvFiles } from "./lib/load-env";

loadEnvFiles();
const prisma = new PrismaClient();

const PARTS_FR: Record<string, string> = {
  "جيدة في المدن الكبرى": "Bonne disponibilité dans les grandes villes",
  "ممتازة في الدار البيضاء والرباط": "Excellente disponibilité à Casablanca et Rabat",
};

function bodyFr(body: string): string {
  switch (body) {
    case "CITY_CAR":
      return "citadine";
    case "SEDAN":
      return "berline";
    case "SUV":
      return "SUV";
    case "PICKUP":
      return "pick-up";
    case "COMMERCIAL":
      return "utilitaire";
    case "FAMILY":
      return "familiale";
    default:
      return body.toLowerCase();
  }
}

function lengthRange(body: string): string {
  switch (body) {
    case "CITY_CAR":
      return "3.95–4.15";
    case "SEDAN":
      return "4.55–4.85";
    case "SUV":
      return "4.35–4.95";
    case "PICKUP":
      return "5.25–5.45";
    case "COMMERCIAL":
      return "4.75–6.95";
    default:
      return "4.25–4.75";
  }
}

function deriveFrenchSpecs(body: string, partsAr: string | null | undefined) {
  const lengthM = lengthRange(body);
  return {
    dimensionsFr: `Longueur indicative env. ${lengthM} m — largeur, hauteur et empattement selon finition (indicatif, à confirmer chez le concessionnaire).`,
    safetyFr: `Airbags avant/latéraux selon finition, ABS, ESP, aide au freinage. Synthèse segment ${bodyFr(body)}.`,
    comfortFr:
      "Climatisation manuelle ou automatique, USB/Bluetooth, écran multimédia selon finition, sièges tissu ou cuir partiel.",
    warrantyFr: "Garantie concessionnaire ou importateur selon la marque — à confirmer à l'achat.",
    partsAvailabilityFr: PARTS_FR[partsAr?.trim() ?? ""] ?? "Bonne disponibilité dans les grandes villes",
  };
}

async function main() {
  const cars = await prisma.car.findMany({
    select: { id: true, bodyType: true, specs: true },
  });

  let updated = 0;
  for (const car of cars) {
    if (!car.specs) continue;
    const s = car.specs;
    const needs =
      !s.dimensionsFr?.trim() ||
      !s.safetyFr?.trim() ||
      !s.comfortFr?.trim() ||
      !s.warrantyFr?.trim() ||
      !s.partsAvailabilityFr?.trim();
    if (!needs) continue;

    const fr = deriveFrenchSpecs(car.bodyType, s.partsAvailabilityAr);
    await prisma.carSpecs.update({
      where: { id: s.id },
      data: {
        dimensionsFr: s.dimensionsFr?.trim() ? undefined : fr.dimensionsFr,
        safetyFr: s.safetyFr?.trim() ? undefined : fr.safetyFr,
        comfortFr: s.comfortFr?.trim() ? undefined : fr.comfortFr,
        warrantyFr: s.warrantyFr?.trim() ? undefined : fr.warrantyFr,
        partsAvailabilityFr: s.partsAvailabilityFr?.trim() ? undefined : fr.partsAvailabilityFr,
      },
    });
    updated++;
  }

  console.log(`[backfill-specs-fr] ${updated} fiche(s) specs mises à jour.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
