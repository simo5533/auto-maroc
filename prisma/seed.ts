import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { catalogBundleSchema } from "../src/lib/catalog-vehicle-zod";
import { upsertCatalogVehicle } from "../src/lib/upsert-catalog-vehicle";

/** Neon pooler : une seule connexion pour éviter P2024 pendant l’import massif. */
function seedDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw new Error("DATABASE_URL manquant pour le seed.");
  if (url.includes("pooler") && !/connection_limit=/i.test(url)) {
    return `${url}${url.includes("?") ? "&" : "?"}connection_limit=1`;
  }
  return url;
}

const prisma = new PrismaClient({
  datasources: { db: { url: seedDatabaseUrl() } },
});

async function main() {
  const adminHash = await bcrypt.hash("Admin123!", 10);
  await prisma.user.upsert({
    where: { email: "admin@auto-maroc.ma" },
    update: { passwordHash: adminHash },
    create: {
      email: "admin@auto-maroc.ma",
      passwordHash: adminHash,
      role: Role.ADMIN,
      name: "Administrateur",
      localePref: "ar",
    },
  });

  const demoHash = await bcrypt.hash("Demo123!", 10);
  await prisma.user.upsert({
    where: { email: "demo@auto-maroc.ma" },
    update: { passwordHash: demoHash },
    create: {
      email: "demo@auto-maroc.ma",
      passwordHash: demoHash,
      role: Role.BUYER,
      localePref: "ar",
    },
  });

  await prisma.review.deleteMany();
  await prisma.carSpecs.deleteMany();
  await prisma.car.deleteMany();

  const raw = readFileSync(join(__dirname, "..", "data", "morocco-catalog.json"), "utf8");
  const parsed = catalogBundleSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    console.error(parsed.error.flatten());
    throw new Error("morocco-catalog.json invalide");
  }

  for (const v of parsed.data.vehicles) {
    await upsertCatalogVehicle(prisma, v);
  }
}

main()
  .then(() => {
    console.log("Seed OK — admin@auto-maroc.ma / Admin123! — demo@auto-maroc.ma / Demo123!");
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
