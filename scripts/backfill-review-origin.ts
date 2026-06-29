/**
 * Une fois après ajout du champ reviewOrigin : classe les lignes existantes.
 * Ordre : comptes utilisateur → imports (source) → reste = anciens textes catalogue démo.
 *
 * npm run reviews:backfill-origin
 */
import { PrismaClient, ReviewOrigin } from "@prisma/client";
import { loadEnvFiles } from "./lib/load-env";

loadEnvFiles();
const prisma = new PrismaClient();

async function main() {
  const u = await prisma.review.updateMany({
    where: { userId: { not: null } },
    data: { reviewOrigin: ReviewOrigin.USER },
  });
  const i = await prisma.review.updateMany({
    where: {
      userId: null,
      OR: [{ sourceName: { not: null } }, { sourceUrl: { not: null } }],
    },
    data: { reviewOrigin: ReviewOrigin.IMPORT },
  });
  const d = await prisma.review.updateMany({
    where: { userId: null, sourceName: null, sourceUrl: null },
    data: { reviewOrigin: ReviewOrigin.CATALOG_DEMO },
  });
  console.log(`Classé : ${u.count} utilisateur(s), ${i.count} import(s), ${d.count} ancien démo catalogue.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
