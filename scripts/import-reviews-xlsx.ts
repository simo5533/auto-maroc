/**
 * Importe les avis bilingues (darija + français) depuis le fichier Excel DEMO.
 *
 * - commentAr = darija (affiché en locale /ar)
 * - commentFr = français (affiché en locale /fr)
 * - noms virtuels générés (pas nom_demo du fichier)
 * - remplace les anciens avis importés / démo catalogue (pas les avis utilisateur)
 *
 * Usage :
 *   npm run reviews:import-xlsx
 *   npm run reviews:import-xlsx -- --xlsx="C:\\chemin\\fichier.xlsx"
 *   npm run reviews:import-xlsx -- --dry-run
 *   npm run reviews:import-xlsx -- --clean
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { PrismaClient, ReviewOrigin, ReviewStatus } from "@prisma/client";
import * as XLSX from "xlsx";
import { loadEnvFiles } from "./lib/load-env";
import { buildCarMatcher, cleanReviewText } from "./lib/review-import-match";
import { buildDisplayLabels } from "./lib/virtual-review-names";

loadEnvFiles();
const prisma = new PrismaClient();

const SOURCE_NAME = "avis_xlsx_bilingue_demo";

const DEFAULT_XLSX_CANDIDATES = [
  join(process.cwd(), "data", "avis_auto_maroc_bilingue_DEMO_10000.xlsx"),
  join(homedir(), "Downloads", "avis_auto_maroc_bilingue_DEMO_10000.xlsx"),
];

type XlsxRow = {
  review_id?: string;
  marque?: string;
  modele?: string;
  annee?: number | string;
  ville?: string;
  service?: string;
  note_sur_5?: number | string;
  titre_darija?: string;
  commentaire_darija?: string;
  titre_francais?: string;
  commentaire_francais?: string;
};

function parseArgs(argv: string[]) {
  let xlsx = DEFAULT_XLSX_CANDIDATES.find((p) => existsSync(p)) ?? DEFAULT_XLSX_CANDIDATES[0]!;
  let dryRun = false;
  let clean = true;
  for (const a of argv.slice(2)) {
    if (a === "--dry-run") dryRun = true;
    else if (a === "--no-clean") clean = false;
    else if (a === "--clean") clean = true;
    else if (a.startsWith("--xlsx=")) xlsx = a.slice("--xlsx=".length).replace(/^"(.*)"$/, "$1");
  }
  return { xlsx, dryRun, clean };
}

function toInt(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

async function cleanOldImportedReviews(dryRun: boolean) {
  const where = {
    userId: null as null,
    OR: [
      { sourceName: SOURCE_NAME },
      { sourceName: "avis_darija_genere" },
      { sourceName: "avis_synthetiques_maroc_docx" },
      { reviewOrigin: ReviewOrigin.CATALOG_DEMO },
    ],
  };
  if (dryRun) {
    const count = await prisma.review.count({ where });
    console.log(`[import-xlsx] ${count} ancien(s) avis importé(s)/démo seraient supprimés.`);
    return;
  }
  const del = await prisma.review.deleteMany({ where });
  console.log(`[import-xlsx] ${del.count} ancien(s) avis importé(s)/démo supprimés.`);
}

async function main() {
  const { xlsx, dryRun, clean } = parseArgs(process.argv);
  console.log(`[import-xlsx] fichier: ${xlsx}`);
  console.log(`[import-xlsx] dry-run: ${dryRun}`);
  console.log(`[import-xlsx] clean: ${clean}`);

  if (!existsSync(xlsx)) {
    console.error(`[import-xlsx] fichier introuvable: ${xlsx}`);
    console.error("Copiez le .xlsx dans data/ ou passez --xlsx=...");
    process.exit(1);
  }

  if (clean) await cleanOldImportedReviews(dryRun);

  const wb = XLSX.readFile(xlsx, { cellDates: false });
  const sheet = wb.Sheets[wb.SheetNames[0]!];
  const rows = XLSX.utils.sheet_to_json<XlsxRow>(sheet, { defval: "" });
  console.log(`[import-xlsx] ${rows.length} ligne(s) lues.`);

  const cars = await prisma.car.findMany({
    select: { id: true, brandFr: true, brandAr: true, modelFr: true, modelAr: true, year: true },
  });
  if (cars.length === 0) {
    console.error("[import-xlsx] aucune voiture en base — lancez db:seed d'abord.");
    process.exit(1);
  }

  const { pickCar } = buildCarMatcher(cars);
  console.log(`[import-xlsx] ${cars.length} voiture(s) en base.`);

  type BatchRow = {
    carId: string;
    displayLabel: string;
    displayLabelFr: string;
    city: string;
    globalNote: number;
    commentAr: string;
    commentFr: string;
    sourceName: string;
  };

  const batch: BatchRow[] = [];
  let skipped = 0;

  for (const r of rows) {
    const seed = String(r.review_id ?? `row-${batch.length}`).trim();
    const marque = String(r.marque ?? "").trim();
    const modele = String(r.modele ?? "").trim();
    const annee = toInt(r.annee);
    const ville = String(r.ville ?? "Maroc").trim().slice(0, 80);
    const service = String(r.service ?? "usage ville").trim();
    const note = Math.min(5, Math.max(1, toInt(r.note_sur_5, 4)));

    const car = pickCar(marque, modele, annee, seed);
    if (!car) {
      skipped++;
      continue;
    }

    const labels = buildDisplayLabels({ seed, cityFr: ville, serviceFr: service });
    const commentAr = cleanReviewText(String(r.commentaire_darija ?? ""), String(r.titre_darija ?? ""));
    const commentFr = cleanReviewText(String(r.commentaire_francais ?? ""), String(r.titre_francais ?? ""));
    if (!commentAr.trim() || !commentFr.trim()) {
      skipped++;
      continue;
    }

    batch.push({
      carId: car.id,
      displayLabel: labels.displayLabel,
      displayLabelFr: labels.displayLabelFr,
      city: ville,
      globalNote: note,
      commentAr,
      commentFr,
      sourceName: SOURCE_NAME,
    });
  }

  console.log(`[import-xlsx] prêts: ${batch.length}, ignorés: ${skipped}`);
  for (const s of batch.slice(0, 3)) {
    console.log(`  · [${s.globalNote}/5] ${s.displayLabel}`);
    console.log(`    FR: ${s.displayLabelFr}`);
    console.log(`    AR: ${s.commentAr.slice(0, 120)}…`);
    console.log(`    FR: ${s.commentFr.slice(0, 120)}…`);
  }

  if (dryRun) {
    console.log("[import-xlsx] dry-run — aucune écriture.");
    return;
  }

  const CHUNK = 400;
  let inserted = 0;
  for (let i = 0; i < batch.length; i += CHUNK) {
    const slice = batch.slice(i, i + CHUNK);
    await prisma.review.createMany({
      data: slice.map((b) => ({
        carId: b.carId,
        userId: null,
        displayLabel: b.displayLabel,
        displayLabelFr: b.displayLabelFr,
        city: b.city,
        usageMonths: null,
        mileageKm: null,
        consumptionNote: null,
        comfortNote: null,
        reliabilityNote: null,
        maintenanceNote: null,
        resaleNote: null,
        globalNote: b.globalNote,
        commentAr: b.commentAr,
        commentFr: b.commentFr,
        sourceName: b.sourceName,
        sourceUrl: null,
        reviewOrigin: ReviewOrigin.IMPORT,
        verified: false,
        status: ReviewStatus.APPROVED,
      })),
    });
    inserted += slice.length;
    console.log(`[import-xlsx] +${slice.length} (total ${inserted}/${batch.length})`);
  }

  console.log(`[import-xlsx] terminé. ${inserted} avis bilingues créés.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
