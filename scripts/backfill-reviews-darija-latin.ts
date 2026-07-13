/**
 * Convertit commentAr + displayLabel en darija alphabet latin (franco-arabe).
 *
 * Usage : npm run reviews:darija-latin
 */
import { PrismaClient } from "@prisma/client";
import { toDarijaLatin } from "../src/lib/darija-latin";
import { loadEnvFiles } from "./lib/load-env";

loadEnvFiles();
const prisma = new PrismaClient();

const BATCH = 25;

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function updateWithRetry(id: string, commentAr: string, displayLabel: string, tries = 4) {
  let last: unknown;
  for (let t = 0; t < tries; t++) {
    try {
      await prisma.review.update({
        where: { id },
        data: { commentAr, displayLabel },
      });
      return;
    } catch (e) {
      last = e;
      await sleep(800 * (t + 1));
    }
  }
  throw last;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  console.log(`[darija-latin] dry-run: ${dryRun}`);

  const reviews = await prisma.review.findMany({
    select: {
      id: true,
      commentAr: true,
      displayLabel: true,
      displayLabelFr: true,
    },
  });

  type Patch = { id: string; commentAr: string; displayLabel: string };
  const patches: Patch[] = [];

  for (const r of reviews) {
    const nextComment = toDarijaLatin(r.commentAr);
    const nextLabel = (r.displayLabelFr?.trim() || toDarijaLatin(r.displayLabel)).slice(0, 200);
    if (nextComment === r.commentAr && nextLabel === r.displayLabel) continue;
    patches.push({ id: r.id, commentAr: nextComment, displayLabel: nextLabel });
  }

  console.log(`[darija-latin] à mettre à jour: ${patches.length}/${reviews.length}`);
  if (patches[0]) {
    console.log("  ex:", patches[0].commentAr.slice(0, 120));
    console.log("  ex:", patches[0].displayLabel);
  }

  if (dryRun) {
    console.log("[darija-latin] dry-run — aucune écriture.");
    return;
  }

  let updated = 0;
  for (let i = 0; i < patches.length; i += BATCH) {
    const slice = patches.slice(i, i + BATCH);
    await Promise.all(slice.map((p) => updateWithRetry(p.id, p.commentAr, p.displayLabel)));
    updated += slice.length;
    if (updated % 250 === 0 || updated === patches.length) {
      console.log(`[darija-latin] ${updated}/${patches.length}`);
    }
  }

  const still = await prisma.$queryRaw<{ c: bigint }[]>`
    SELECT COUNT(*)::bigint AS c FROM "Review"
    WHERE "commentAr" ~ '[\u0600-\u06FF]' OR "displayLabel" ~ '[\u0600-\u06FF]'
  `;
  console.log({ updated, stillArabic: Number(still[0]?.c ?? 0) });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
