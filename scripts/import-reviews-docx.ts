/**
 * Importe les avis depuis un fichier Word (.docx) au format pipe-délimité :
 *   id | nom_affiche | vehicule | annee | ville | motorisation | note | type_avis | categorie | avis
 *
 * Le document `avis_voitures_maroc_10000_darija_latine.docx` indique que les avis
 * sont synthétiques (seed / test) — ils sont importés avec reviewOrigin = IMPORT
 * et sourceName explicite.
 *
 * Usage :
 *   npm run reviews:import-docx
 *   npm run reviews:import-docx -- --docx="C:\\chemin\\fichier.docx"
 *   npm run reviews:import-docx -- --dry-run
 *   npm run reviews:import-docx -- --clean
 *
 * Prérequis : copier le .docx vers le chemin par défaut ou passer --docx=...
 */
import { copyFileSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { PrismaClient, ReviewOrigin, ReviewStatus } from "@prisma/client";
import { loadEnvFiles } from "./lib/load-env";

loadEnvFiles();
const prisma = new PrismaClient();

const DEFAULT_DOCX = join(homedir(), "Downloads", "avis_voitures_maroc_10000_darija_latine.docx");

function parseArgs(argv: string[]) {
  let docx = DEFAULT_DOCX;
  let dryRun = false;
  let clean = false;
  for (const a of argv.slice(2)) {
    if (a === "--dry-run") dryRun = true;
    else if (a === "--clean") clean = true;
    else if (a.startsWith("--docx=")) docx = a.slice("--docx=".length).replace(/^"(.*)"$/, "$1");
  }
  return { docx, dryRun, clean };
}

function extractDocumentXml(docxPath: string): string {
  const tmp = mkdtempSync(join(tmpdir(), "docx-import-"));
  try {
    const zipPath = join(tmp, "in.zip");
    copyFileSync(docxPath, zipPath);
    const outDir = join(tmp, "out");
    const ps = `Expand-Archive -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath '${outDir.replace(/'/g, "''")}' -Force`;
    const r = spawnSync("powershell", ["-NoProfile", "-Command", ps], { encoding: "utf-8" });
    if (r.status !== 0) {
      throw new Error(`Expand-Archive failed: ${r.stderr || r.stdout}`);
    }
    return readFileSync(join(outDir, "word", "document.xml"), "utf8");
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

/** Texte visible Word (OOXML). */
function xmlToPlainText(xml: string): string {
  const parts: string[] = [];
  const re = /<w:t[^>]*>([^<]*)<\/w:t>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    parts.push(m[1]!);
  }
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

function normKey(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

type ParsedRow = {
  id: string;
  displayName: string;
  vehicle: string;
  year: number;
  city: string;
  motor: string;
  note: number;
  typeAvis: string;
  categorie: string;
  avis: string;
};

function parseRows(plain: string): ParsedRow[] {
  const rows: ParsedRow[] = [];
  const chunks = plain.split(/(?=\b\d{5}\s*\|\s+)/);
  for (const chunk of chunks) {
    const m = chunk.match(
      /^(\d{5})\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*(\d{4})\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*(\d)\s*\/\s*5\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([\s\S]+)$/,
    );
    if (!m) continue;
    const year = Number(m[4]);
    if (year < 1990 || year > 2035) continue;
    const note = Number(m[7]);
    if (note < 1 || note > 5) continue;
    rows.push({
      id: m[1]!.trim(),
      displayName: m[2]!.trim(),
      vehicle: m[3]!.trim(),
      year,
      city: m[5]!.trim(),
      motor: m[6]!.trim(),
      note,
      typeAvis: m[8]!.trim(),
      categorie: m[9]!.trim(),
      avis: m[10]!.trim().replace(/\s+$/, ""),
    });
  }
  return rows;
}

function splitVehicle(vehicle: string, brandPrefixes: string[]): { brand: string; model: string } | null {
  const v = vehicle.trim();
  for (const b of brandPrefixes) {
    if (v.length === b.length && normKey(v) === normKey(b)) return { brand: b, model: "" };
    if (v.toLowerCase().startsWith(b.toLowerCase() + " ")) {
      return { brand: b, model: v.slice(b.length).trim() };
    }
  }
  return null;
}

async function main() {
  const { docx, dryRun, clean } = parseArgs(process.argv);
  console.log(`[import-docx] fichier: ${docx}`);
  console.log(`[import-docx] dry-run: ${dryRun}`);
  console.log(`[import-docx] clean avant import: ${clean}`);

  if (clean && !dryRun) {
    const del = await prisma.review.deleteMany({
      where: { sourceName: "avis_synthetiques_maroc_docx" },
    });
    console.log(`[import-docx] ${del.count} avis supprimé(s) (source docx).`);
  }

  let xml: string;
  try {
    xml = extractDocumentXml(docx);
  } catch (e) {
    console.error("[import-docx] impossible de lire le .docx :", e);
    process.exit(1);
  }

  const plain = xmlToPlainText(xml);
  const rows = parseRows(plain);
  console.log(`[import-docx] ${rows.length} ligne(s) reconnue(s) au format id|...`);

  const brandRows = await prisma.car.findMany({
    distinct: ["brandFr"],
    select: { brandFr: true },
    where: { brandFr: { not: null } },
  });
  const brandPrefixes = [...new Set(brandRows.map((r) => r.brandFr!))].sort((a, b) => b.length - a.length);

  const cars = await prisma.car.findMany({
    select: { id: true, brandFr: true, brandAr: true, modelFr: true, modelAr: true, year: true },
  });
  const carIndex = new Map<string, string>();
  for (const c of cars) {
    const bf = c.brandFr ?? c.brandAr;
    const mf = c.modelFr ?? c.modelAr;
    const k = `${normKey(bf)}|${normKey(mf)}|${c.year}`;
    if (!carIndex.has(k)) carIndex.set(k, c.id);
  }
  console.log(`[import-docx] ${carIndex.size} clé(s) unique(s) marque+modèle+année dans la base`);

  const batch: {
    carId: string;
    displayLabel: string;
    city: string;
    globalNote: number;
    commentAr: string;
    commentFr: string | null;
    sourceName: string;
  }[] = [];

  let skippedNoVehicle = 0;
  let skippedNoCar = 0;

  for (const r of rows) {
    const sp = splitVehicle(r.vehicle, brandPrefixes);
    if (!sp || !sp.model) {
      skippedNoVehicle++;
      continue;
    }
    const carId = carIndex.get(`${normKey(sp.brand)}|${normKey(sp.model)}|${r.year}`) ?? null;
    if (!carId) {
      skippedNoCar++;
      continue;
    }
    const displayLabel = `${r.displayName} — ${r.city} — ${r.typeAvis} (${r.categorie})`;
    const commentAr = `${r.avis}\n\n[${r.motor} · synthétique seed]`;
    batch.push({
      carId,
      displayLabel: displayLabel.slice(0, 200),
      city: r.city.slice(0, 80),
      globalNote: r.note,
      commentAr: commentAr.slice(0, 8000),
      commentFr: null,
      sourceName: "avis_synthetiques_maroc_docx",
    });
  }

  console.log(
    `[import-docx] prêts à insérer: ${batch.length}, sans véhicule reconnu: ${skippedNoVehicle}, sans fiche DB: ${skippedNoCar}`,
  );

  if (dryRun) {
    console.log("[import-docx] dry-run — aucune écriture.");
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
    console.log(`[import-docx] +${slice.length} (total ${inserted}/${batch.length})`);
  }

  console.log(`[import-docx] terminé. ${inserted} avis créés.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
