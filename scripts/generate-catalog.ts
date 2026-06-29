/**
 * Génère data/morocco-catalog.json : liste étendue marques/modèles (catalog-reference-brands.ts),
 * plusieurs motorisations par modèle (essence / diesel / hybride ou électrique),
 * photos Wikipédia + Commons + Pexels (clé .env), fiches techniques enrichies.
 * Avis : aucun texte démo — les fiches n’incluent pas d’avis fictifs ; utiliser imports réels (npm run reviews:import) ou avis utilisateurs.
 * Exécution : npm run catalog:generate
 * Génération rapide (sans réseau, ~6 s) : PowerShell `$env:CATALOG_SKIP_MEDIA="1"; npm run catalog:generate`
 * (images : banque Pexels « automobile » de démo, pas des photos aléatoires type Picsum)
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadEnvFiles } from "./lib/load-env";
import {
  fetchCommonsVehicleImages,
  fetchPexelsCarPhotos,
  fetchWikipediaArBundle,
  fetchWikipediaEnBundle,
  fetchWikipediaFrBundle,
} from "../src/lib/catalog-media";
import type { WikiBundle } from "../src/lib/catalog-media";
import { REFERENCE_BRANDS } from "./lib/catalog-reference-brands";
import type { RefBody } from "./lib/catalog-reference-brands";
import {
  buildRichSpecs,
  expandMotorizations,
  indicativeBasePrice,
  technicalHighlightsAr,
  technicalHighlightsFr,
  usageTags,
} from "./lib/catalog-version-specs";
import type { CatalogFuel } from "./lib/catalog-version-specs";
import { buildBrandLogoUrl, officialBrandUrl } from "../src/lib/brand-assets";
import { buildDemoFicheEquipement } from "../src/lib/car-fiche-equipment";
import { buildProductStoryPayload } from "../src/lib/car-product-story-build";
import { pickCatalogExteriorColor } from "../src/lib/exterior-color";

const CITIES = [
  ["الدار البيضاء", "Casablanca"],
  ["الرباط", "Rabat"],
  ["فاس", "Fès"],
  ["مراكش", "Marrakech"],
  ["طنجة", "Tanger"],
  ["أكادير", "Agadir"],
  ["وجدة", "Oujda"],
  ["مكناس", "Meknès"],
] as const;

type MediaPack = { wikiFr: WikiBundle; wikiAr: WikiBundle; wikiEn: WikiBundle; commons: string[]; pex: string[] };

let idx = 0;

async function buildVehicles() {
  loadEnvFiles();
  const vehicles: Record<string, unknown>[] = [];
  const mediaCache = new Map<string, MediaPack>();

  const skipMedia = process.env.CATALOG_SKIP_MEDIA === "1";

  async function loadMedia(brandFr: string, modelFr: string, body: RefBody, modelAr: string): Promise<MediaPack> {
    const key = `${brandFr}|${modelFr}`;
    if (mediaCache.has(key)) return mediaCache.get(key)!;
    if (skipMedia) {
      const empty: MediaPack = {
        wikiFr: { extract: null, thumbnailUrl: null },
        wikiAr: { extract: null, thumbnailUrl: null },
        wikiEn: { extract: null, thumbnailUrl: null },
        commons: [],
        pex: [],
      };
      mediaCache.set(key, empty);
      return empty;
    }
    const [wikiFr, wikiAr, wikiEn] = await Promise.all([
      fetchWikipediaFrBundle(brandFr, modelFr),
      fetchWikipediaArBundle(brandFr, modelFr, modelAr),
      fetchWikipediaEnBundle(brandFr, modelFr),
    ]);
    const commons = await fetchCommonsVehicleImages(brandFr, modelFr, 5);
    const pex = await fetchPexelsCarPhotos(brandFr, modelFr, body, 8);
    const pack: MediaPack = { wikiFr, wikiAr, wikiEn, commons, pex };
    mediaCache.set(key, pack);
    return pack;
  }

  for (const b of REFERENCE_BRANDS) {
    for (const m of b.models) {
      const media = await loadMedia(b.brandFr, m.modelFr, m.body, m.modelAr);
      const versions = expandMotorizations(b.brandFr, m.modelFr, m.body);

      for (const ver of versions) {
        const [cityAr, cityFr] = CITIES[idx % CITIES.length];
        idx++;
        const exterior = pickCatalogExteriorColor(idx);
        const fuel = ver.fuel as CatalogFuel;
        const transmission: "MANUAL" | "AUTOMATIC" =
          fuel === "ELECTRIC" || fuel === "HYBRID"
            ? "AUTOMATIC"
            : fuel === "PETROL" && m.body === "CITY_CAR" && idx % 9 === 0
              ? "MANUAL"
              : "AUTOMATIC";

        const base = indicativeBasePrice(b.tier, m.body, b.brandFr, m.modelFr);
        const priceNewEst = base + (idx % 7) * 2400 + (fuel === "ELECTRIC" ? 12000 : 0);
        const priceUsedEst = Math.round(priceNewEst * 0.78);

        const pushWm = (u: string | null | undefined, arr: string[]) => {
          if (!u) return;
          if (!/^https:\/\/upload\.wikimedia\.org\//i.test(u)) return;
          if (!arr.includes(u)) arr.push(u);
        };

        let imageUrls: string[] = [];
        pushWm(media.wikiFr.thumbnailUrl, imageUrls);
        pushWm(media.wikiAr.thumbnailUrl, imageUrls);
        pushWm(media.wikiEn.thumbnailUrl, imageUrls);
        for (const u of media.commons) pushWm(u, imageUrls);
        for (const u of media.pex) {
          if (!imageUrls.includes(u)) imageUrls.push(u);
        }
        if (imageUrls.length === 1) {
          const primary = imageUrls[0];
          while (imageUrls.length < 4) imageUrls.push(primary);
        }
        /* Pas d’images factices : laisser vide si aucune source ; exécuter catalog:backfill-images ou ouvrir la fiche (résolution Wikipédia/Commons/Pexels). */

        const logo = buildBrandLogoUrl(b.brandFr);
        const official = officialBrandUrl(b.brandFr);
        const usage = usageTags(m.body, m.modelFr);

        const techFr = technicalHighlightsFr(b.brandFr, m.modelFr, m.body, ver.versionFr, fuel);
        const techAr = technicalHighlightsAr(m.modelAr, m.body, ver.versionAr, fuel);

        const highlightsFr = [
          techFr,
          `Positionnement (indicatif) : ${b.brandFr} ${m.modelFr} — ${ver.versionFr}. Usage typique : ${usage.slice(0, 4).join(" / ")}. Prix public neuf indicatif ${priceNewEst.toLocaleString("fr-FR")} MAD.`,
          `Entretien & pièces : prévoir révisions régulières ; disponibilité variable selon ville (${cityFr}, etc.).`,
          media.wikiFr.extract && media.wikiFr.extract.length > 200
            ? `Complément encyclopédique : ${media.wikiFr.extract.slice(200, Math.min(900, media.wikiFr.extract.length))}`
            : null,
        ]
          .filter(Boolean)
          .join("\n\n");

        const highlightsAr = [
          techAr,
          `سياق السوق (إرشادي): ${b.brandAr} ${m.modelAr} — ${ver.versionAr}. استعمالات: ${usage.slice(0, 4).join(" / ")}. سعر تقريبي للجديد ${priceNewEst.toLocaleString("fr-FR")} درهم.`,
          `الصيانة والقطع تختلف حسب المدينة (${cityAr} وغيرها).`,
          media.wikiAr.extract && media.wikiAr.extract.length > 200
            ? `مكمل ويكيبيديا: ${media.wikiAr.extract.slice(200, Math.min(900, media.wikiAr.extract.length))}`
            : null,
        ]
          .filter(Boolean)
          .join("\n\n");

        const fuelAr =
          fuel === "DIESEL" ? "ديزل" : fuel === "HYBRID" ? "هايبريد" : fuel === "ELECTRIC" ? "كهرباء" : "بنزين";
        const fuelFr =
          fuel === "DIESEL"
            ? "Consommation diesel (ordre de grandeur)."
            : fuel === "HYBRID"
              ? "Motorisation hybride."
              : fuel === "ELECTRIC"
                ? "100 % électrique."
                : "Motorisation essence.";
        let descAr = `${b.brandAr} ${m.modelAr} (${ver.versionAr}) : مرجع في السوق المغربي. ${fuelAr}. قطع الغيار ${idx % 3 === 0 ? "جيدة في المدن الكبرى" : "متوسطة حسب المنطقة"}.`;
        let descFr = `${b.brandFr} ${m.modelFr} (${ver.versionFr}) : modèle de référence catalogue démo. ${fuelFr} Pièces ${idx % 3 === 0 ? "bien distribuées" : "correctes"}.`;

        if (media.wikiAr.extract) {
          descAr = `${media.wikiAr.extract}\n\n(مقتطف ويكيبيديا CC-BY-SA — عام.)\n\n${descAr}`;
        }
        if (media.wikiFr.extract) {
          descFr = `${media.wikiFr.extract}\n\n(Extrait Wikipédia CC-BY-SA — général.)\n\n${descFr}`;
        }

        const specsCore = buildRichSpecs({
          idx,
          brandFr: b.brandFr,
          modelFr: m.modelFr,
          body: m.body,
          fuel,
          versionFr: ver.versionFr,
          versionAr: ver.versionAr,
        });

        vehicles.push({
          brandAr: b.brandAr,
          brandFr: b.brandFr,
          modelAr: m.modelAr,
          modelFr: m.modelFr,
          versionAr: ver.versionAr,
          versionFr: ver.versionFr,
          year: 2025,
          priceNewEst,
          priceUsedEst,
          conditionDefault: "NEW",
          fuel,
          transmission,
          bodyType: m.body,
          usageRecommended: usage,
          imageUrl: imageUrls[0],
          imageUrls,
          brandLogoUrl: logo,
          officialUrl: official,
          highlightsAr,
          highlightsFr,
          exteriorColorFr: exterior.fr,
          exteriorColorAr: exterior.ar,
          descriptionAr: descAr,
          descriptionFr: descFr,
          specs: {
            ...specsCore,
            ficheEquipement: buildDemoFicheEquipement({
              idx,
              fuel,
              tier: b.tier,
              body: m.body,
              brandFr: b.brandFr,
              priceNewEst,
              consumptionL100: typeof specsCore.consumptionL100 === "number" ? specsCore.consumptionL100 : null,
            }),
            productStory: buildProductStoryPayload({
              brandFr: b.brandFr,
              brandAr: b.brandAr,
              modelFr: m.modelFr,
              modelAr: m.modelAr,
              bodyType: m.body,
              fuel,
              versionFr: ver.versionFr,
              versionAr: ver.versionAr,
              year: 2025,
              co2Gkm: typeof specsCore.co2Gkm === "number" ? specsCore.co2Gkm : null,
              consumptionL100: typeof specsCore.consumptionL100 === "number" ? specsCore.consumptionL100 : null,
            }),
            viewer3dExteriorUrl: null,
            viewer3dInteriorUrl: null,
          },
          reviews: [],
        });
      }
    }
  }
  return vehicles;
}

async function main() {
  const vehicles = await buildVehicles();
  const hasPexels = Boolean(process.env.PEXELS_ACCESS_KEY?.trim() || process.env.PEXELS_API_KEY?.trim());
  const bundle = {
    version: "2026.8",
    source: "reference-maroc-extended-demo",
    note:
      process.env.CATALOG_SKIP_MEDIA === "1"
        ? "Génération rapide (CATALOG_SKIP_MEDIA=1) : pas d’appels Wikipédia/Commons ; images démo automobile (Pexels). Relancer sans cette variable pour photos réelles du modèle (long)."
        : hasPexels
          ? "Catalogue étendu : motorisations multiples (essence/diesel/hybride/électrique) par modèle. Photos Wikipédia + Commons filtré + Pexels. Fiches techniques indicatives (démo) — non contractuelles."
          : "Catalogue étendu sans clé Pexels : Wikipédia + Commons ; images démo automobile (Pexels) si aucune image trouvée. Données indicatives.",
    vehicles,
  };
  writeFileSync(join(process.cwd(), "data", "morocco-catalog.json"), JSON.stringify(bundle, null, 2), "utf8");
  const mode =
    process.env.CATALOG_SKIP_MEDIA === "1"
      ? "médias ignorés (images démo auto)"
      : hasPexels
        ? "avec Pexels"
        : "sans clé Pexels";
  console.log(`OK — ${bundle.vehicles.length} véhicules → data/morocco-catalog.json (${mode})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
