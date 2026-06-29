import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { car3dModelMapSchema } from "../src/lib/car-3d-model-map-zod";

const prisma = new PrismaClient();

function normKey(brandFr: string, modelFr: string): string {
  return `${brandFr.trim().toLowerCase()}|${modelFr.trim().toLowerCase()}`;
}

function loadModelMap(): Map<
  string,
  { viewer3dExteriorUrl: string | null; viewer3dInteriorUrl: string | null }
> {
  const path = join(process.cwd(), "data", "car-3d-model-map.json");
  if (!existsSync(path)) {
    console.warn("Avertissement : data/car-3d-model-map.json absent.");
    return new Map();
  }
  const raw = JSON.parse(readFileSync(path, "utf8"));
  const parsed = car3dModelMapSchema.safeParse(raw);
  if (!parsed.success) {
    console.error("data/car-3d-model-map.json invalide :", parsed.error.flatten());
    process.exit(1);
  }
  const m = new Map<
    string,
    { viewer3dExteriorUrl: string | null; viewer3dInteriorUrl: string | null }
  >();
  for (const e of parsed.data.entries) {
    m.set(normKey(e.brandFr, e.modelFr), {
      viewer3dExteriorUrl: e.viewer3dExteriorUrl,
      viewer3dInteriorUrl: e.viewer3dInteriorUrl ?? null,
    });
  }
  return m;
}

async function main() {
  const modelMap = loadModelMap();
  const cars = await prisma.car.findMany({
    select: {
      id: true,
      brandFr: true,
      modelFr: true,
      specs: { select: { viewer3dExteriorUrl: true, viewer3dInteriorUrl: true } },
    },
    orderBy: [{ brandAr: "asc" }, { modelAr: "asc" }],
    take: 5000,
  });

  let fromDb = 0;
  let fromMap = 0;
  let empty = 0;

  const out = {
    entries: cars.map((c) => {
      const brandFr = c.brandFr ?? "";
      const modelFr = c.modelFr ?? "";
      const hit = modelMap.get(normKey(brandFr, modelFr));

      const dbExt = c.specs?.viewer3dExteriorUrl?.trim() || null;
      const dbInt = c.specs?.viewer3dInteriorUrl?.trim() || null;

      const exterior = dbExt || hit?.viewer3dExteriorUrl || null;
      const interior = dbInt || hit?.viewer3dInteriorUrl || null;

      if (dbExt) fromDb += 1;
      else if (hit?.viewer3dExteriorUrl) fromMap += 1;
      else empty += 1;

      return {
        carId: c.id,
        viewer3dExteriorUrl: exterior,
        viewer3dInteriorUrl: interior,
      };
    }),
  };

  const path = join(process.cwd(), "data", "car-3d-links.json");
  writeFileSync(path, JSON.stringify(out, null, 2), "utf8");
  console.log(
    `Fichier généré: ${path} (${out.entries.length} entrée(s)) — ext. depuis fiche/catalogue: ${fromDb}, ext. depuis carte marque/modèle: ${fromMap}, sans URL: ${empty}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
