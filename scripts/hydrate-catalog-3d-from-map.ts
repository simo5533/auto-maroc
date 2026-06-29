/**
 * Recopie les URLs 3D de data/car-3d-model-map.json dans chaque entrée de data/morocco-catalog.json
 * (specs.viewer3dExteriorUrl / viewer3dInteriorUrl) lorsqu’elles manquent — une ligne catalogue = une fiche véhicule.
 *
 * Usage: npm run catalog:hydrate-3d
 * Puis: npm run db:seed (pour réinjecter en base).
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { catalogBundleSchema } from "../src/lib/catalog-vehicle-zod";
import { car3dModelMapSchema } from "../src/lib/car-3d-model-map-zod";

function normKey(brandFr: string, modelFr: string): string {
  return `${brandFr.trim().toLowerCase()}|${modelFr.trim().toLowerCase()}`;
}

function main() {
  const mapPath = join(process.cwd(), "data", "car-3d-model-map.json");
  const catalogPath = join(process.cwd(), "data", "morocco-catalog.json");
  if (!existsSync(mapPath)) {
    console.error("Manquant : data/car-3d-model-map.json");
    process.exit(1);
  }
  if (!existsSync(catalogPath)) {
    console.error("Manquant : data/morocco-catalog.json");
    process.exit(1);
  }

  const mapRaw = JSON.parse(readFileSync(mapPath, "utf8"));
  const mapParsed = car3dModelMapSchema.safeParse(mapRaw);
  if (!mapParsed.success) {
    console.error("car-3d-model-map.json invalide :", mapParsed.error.flatten());
    process.exit(1);
  }
  const modelMap = new Map<
    string,
    { viewer3dExteriorUrl: string; viewer3dInteriorUrl: string | null }
  >();
  for (const e of mapParsed.data.entries) {
    modelMap.set(normKey(e.brandFr, e.modelFr), {
      viewer3dExteriorUrl: e.viewer3dExteriorUrl,
      viewer3dInteriorUrl: e.viewer3dInteriorUrl ?? null,
    });
  }

  const catalogRaw = JSON.parse(readFileSync(catalogPath, "utf8"));
  const catalogParsed = catalogBundleSchema.safeParse(catalogRaw);
  if (!catalogParsed.success) {
    console.error("morocco-catalog.json invalide :", catalogParsed.error.flatten());
    process.exit(1);
  }

  let patched = 0;
  let skippedHasUrl = 0;
  let skippedNoMap = 0;

  for (const v of catalogParsed.data.vehicles) {
    const brandFr = v.brandFr ?? "";
    const modelFr = v.modelFr ?? "";
    const hit = modelMap.get(normKey(brandFr, modelFr));
    if (!hit) {
      skippedNoMap++;
      continue;
    }
    const specs = v.specs ?? {};
    if (specs.viewer3dExteriorUrl?.trim()) {
      skippedHasUrl++;
      continue;
    }
    v.specs = {
      ...specs,
      viewer3dExteriorUrl: hit.viewer3dExteriorUrl,
      ...(hit.viewer3dInteriorUrl ? { viewer3dInteriorUrl: hit.viewer3dInteriorUrl } : {}),
    };
    patched++;
  }

  writeFileSync(catalogPath, JSON.stringify(catalogParsed.data, null, 2), "utf8");
  console.log(
    `Catalogue mis à jour: ${patched} véhicule(s) avec liens 3D ajoutés, ${skippedHasUrl} déjà renseigné(s), ${skippedNoMap} sans entrée dans la carte (inchangé).`,
  );
}

main();
