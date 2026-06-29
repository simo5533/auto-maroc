/**
 * Pour chaque modèle existant en base, génère les années manquantes dans une plage
 * donnée (par défaut 2012 → année courante).
 *
 * - Clone la fiche la plus récente du modèle (et ses CarSpecs).
 * - Ajuste `year` et applique une décote linéaire au prix neuf (~3 % / an avant le
 *   millésime de référence) pour rester cohérent.
 * - Idempotent : ne crée rien si une fiche existe déjà pour
 *   (brandFr, modelFr, versionFr, year).
 *
 * Usage :
 *   npm run cars:expand-years
 *   npm run cars:expand-years -- --from=2010 --to=2026 --rate=0.04
 *   npm run cars:expand-years -- --brand="Peugeot"
 */
import { PrismaClient, type Car, type CarSpecs, type Prisma } from "@prisma/client";
import { loadEnvFiles } from "./lib/load-env";

loadEnvFiles();
const prisma = new PrismaClient();

type CliOptions = {
  fromYear: number;
  toYear: number;
  rate: number;
  brand: string | null;
};

function parseArgs(argv: string[]): CliOptions {
  const currentYear = new Date().getFullYear();
  const opts: CliOptions = {
    fromYear: 2012,
    toYear: currentYear,
    rate: 0.03,
    brand: null,
  };
  for (const a of argv.slice(2)) {
    const m = /^--(from|to|rate|brand)=(.+)$/.exec(a);
    if (!m) continue;
    const [, k, v] = m;
    if (k === "from") opts.fromYear = Number(v) || opts.fromYear;
    else if (k === "to") opts.toYear = Number(v) || opts.toYear;
    else if (k === "rate") opts.rate = Number(v) || opts.rate;
    else if (k === "brand") opts.brand = (v ?? "").trim() || null;
  }
  if (opts.fromYear > opts.toYear) {
    throw new Error(`--from (${opts.fromYear}) doit être ≤ --to (${opts.toYear}).`);
  }
  return opts;
}

type CarWithSpecs = Car & { specs: CarSpecs | null };

function applyPriceDecay(price: number, refYear: number, targetYear: number, rate: number): number {
  const delta = refYear - targetYear;
  if (delta <= 0) return price;
  const factor = Math.max(0.35, Math.pow(1 - rate, delta));
  return Math.round(price * factor);
}

/**
 * Sélectionne la fiche de référence (la plus récente) par groupe
 * (brandFr|brandAr, modelFr|modelAr, versionFr|versionAr).
 */
function pickReferenceCars(cars: CarWithSpecs[]): Map<string, CarWithSpecs> {
  const map = new Map<string, CarWithSpecs>();
  for (const c of cars) {
    const key = [
      (c.brandFr ?? c.brandAr).trim(),
      (c.modelFr ?? c.modelAr).trim(),
      (c.versionFr ?? c.versionAr).trim(),
    ].join("__");
    const cur = map.get(key);
    if (!cur || c.year > cur.year) map.set(key, c);
  }
  return map;
}

/** Construit la clé d'unicité (brand|model|version|year) pour les fiches existantes. */
function existingKey(c: Pick<Car, "brandFr" | "brandAr" | "modelFr" | "modelAr" | "versionFr" | "versionAr" | "year">): string {
  return [
    (c.brandFr ?? c.brandAr).trim(),
    (c.modelFr ?? c.modelAr).trim(),
    (c.versionFr ?? c.versionAr).trim(),
    String(c.year),
  ].join("__");
}

async function main() {
  const opts = parseArgs(process.argv);
  console.log(
    `[expand-years] plage ${opts.fromYear} → ${opts.toYear}, décote ${(opts.rate * 100).toFixed(1)}%/an${
      opts.brand ? `, marque="${opts.brand}"` : ""
    }`,
  );

  const where: Prisma.CarWhereInput = opts.brand
    ? { OR: [{ brandFr: opts.brand }, { brandAr: opts.brand }] }
    : {};

  const cars = await prisma.car.findMany({ where, include: { specs: true } });
  if (cars.length === 0) {
    console.log("[expand-years] aucune voiture trouvée.");
    return;
  }

  const existing = new Set(cars.map((c) => existingKey(c)));
  const refs = pickReferenceCars(cars);
  console.log(`[expand-years] ${cars.length} fiches lues, ${refs.size} groupes (brand+model+version).`);

  let created = 0;
  let skipped = 0;

  for (const ref of refs.values()) {
    for (let y = opts.fromYear; y <= opts.toYear; y++) {
      if (y === ref.year) continue;
      const k = existingKey({ ...ref, year: y });
      if (existing.has(k)) {
        skipped++;
        continue;
      }

      const newPriceNew = applyPriceDecay(ref.priceNewEst, ref.year, y, opts.rate);
      const newPriceUsed = ref.priceUsedEst != null
        ? applyPriceDecay(ref.priceUsedEst, ref.year, y, opts.rate)
        : null;

      const data: Prisma.CarCreateInput = {
        brandAr: ref.brandAr,
        brandFr: ref.brandFr,
        modelAr: ref.modelAr,
        modelFr: ref.modelFr,
        versionAr: ref.versionAr,
        versionFr: ref.versionFr,
        year: y,
        priceNewEst: newPriceNew,
        priceUsedEst: newPriceUsed,
        conditionDefault: ref.conditionDefault,
        fuel: ref.fuel,
        transmission: ref.transmission,
        bodyType: ref.bodyType,
        usageRecommended: ref.usageRecommended as Prisma.InputJsonValue,
        imageUrl: ref.imageUrl,
        imageUrls: ref.imageUrls as Prisma.InputJsonValue,
        brandLogoUrl: ref.brandLogoUrl,
        officialUrl: ref.officialUrl,
        highlightsAr: ref.highlightsAr,
        highlightsFr: ref.highlightsFr,
        exteriorColorFr: ref.exteriorColorFr,
        exteriorColorAr: ref.exteriorColorAr,
        descriptionAr: ref.descriptionAr,
        descriptionFr: ref.descriptionFr,
      };

      if (ref.specs) {
        const s = ref.specs;
        data.specs = {
          create: {
            engineAr: s.engineAr,
            engineFr: s.engineFr,
            fiscalPower: s.fiscalPower,
            realPowerKw: s.realPowerKw,
            consumptionL100: s.consumptionL100,
            dimensionsAr: s.dimensionsAr,
            seats: s.seats,
            trunkL: s.trunkL,
            safetyAr: s.safetyAr,
            comfortAr: s.comfortAr,
            warrantyAr: s.warrantyAr,
            maintenanceCostEst: s.maintenanceCostEst,
            partsAvailabilityAr: s.partsAvailabilityAr,
            reliabilityScore: s.reliabilityScore,
            resaleScore: s.resaleScore,
            comfortScore: s.comfortScore,
            globalScore: s.globalScore,
            co2Gkm: s.co2Gkm,
            torqueNm: s.torqueNm,
            groundClearanceMm: s.groundClearanceMm,
            ficheEquipement: (s.ficheEquipement ?? undefined) as Prisma.InputJsonValue | undefined,
            productStory: (s.productStory ?? undefined) as Prisma.InputJsonValue | undefined,
            viewer3dExteriorUrl: s.viewer3dExteriorUrl,
            viewer3dInteriorUrl: s.viewer3dInteriorUrl,
          },
        };
      }

      await prisma.car.create({ data });
      existing.add(k);
      created++;
    }
  }

  console.log(`[expand-years] ${created} fiche(s) créée(s), ${skipped} déjà existante(s) (ignorée(s)).`);
}

main()
  .catch((e) => {
    console.error("[expand-years] échec :", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
