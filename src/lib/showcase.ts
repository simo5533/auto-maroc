/**
 * Lecture seule : données de vitrine (accueil, catalogue, fiche) dérivées des véhicules existants.
 * Aucune écriture en base, aucune modification d'image.
 */
import { cache } from "react";
import type { BodyType, FuelType, Prisma, Transmission } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getDisplayCarImageUrls, getStoredCarImageUrls, isTrustedCarImageUrl } from "@/lib/car-images";
import { isCarDemoStockUrl } from "@/lib/car-demo-images";
import { resolveBrandLogoUrl } from "@/lib/brand-assets";
import { carBrandLabel, carModelLabel, carVersionLabel } from "@/lib/locale-text";

export type VehicleCardData = {
  id: string;
  brand: string;
  model: string;
  version: string;
  year: number;
  price: number | null;
  fuel: FuelType;
  transmission: Transmission;
  bodyType: BodyType;
  coverUrl: string | null;
  /** Photo réelle du modèle (Wikimedia), par opposition à une image de repli générique. */
  coverIsReal: boolean;
  photoCount: number;
  powerHp: number | null;
  logoUrl: string | null;
};

export type ShowcaseCarRow = {
  id: string;
  brandAr: string;
  brandFr: string | null;
  modelAr: string;
  modelFr: string | null;
  versionAr: string;
  versionFr: string | null;
  year: number;
  priceNewEst: number;
  fuel: FuelType;
  transmission: Transmission;
  bodyType: BodyType;
  imageUrl: string | null;
  imageUrls: unknown;
  brandLogoUrl: string | null;
  createdAt: Date;
  specs: { realPowerKw: number | null; globalScore: number | null } | null;
};

export const showcaseCarSelect = {
  id: true,
  brandAr: true,
  brandFr: true,
  modelAr: true,
  modelFr: true,
  versionAr: true,
  versionFr: true,
  year: true,
  priceNewEst: true,
  fuel: true,
  transmission: true,
  bodyType: true,
  imageUrl: true,
  imageUrls: true,
  brandLogoUrl: true,
  createdAt: true,
  specs: { select: { realPowerKw: true, globalScore: true } },
} as const;

export function kwToHp(kw: number | null | undefined): number | null {
  if (kw == null || !Number.isFinite(kw) || kw <= 0) return null;
  return Math.round(kw * 1.35962);
}

export function positivePrice(n: number | null | undefined): number | null {
  return n != null && Number.isFinite(n) && n > 0 ? n : null;
}

export function formatPriceDh(n: number, locale: string): string {
  const nf = locale === "ar" ? "ar-MA" : "fr-FR";
  return `${n.toLocaleString(nf)} ${locale === "ar" ? "درهم" : "DH"}`;
}

export function toVehicleCardData(car: ShowcaseCarRow, locale: string): VehicleCardData {
  const stored = getStoredCarImageUrls(car).filter(isTrustedCarImageUrl);
  const display = getDisplayCarImageUrls(car);
  const cover = display[0] ?? null;
  return {
    id: car.id,
    brand: carBrandLabel(car, locale),
    model: carModelLabel(car, locale),
    version: carVersionLabel(car, locale),
    year: car.year,
    price: positivePrice(car.priceNewEst),
    fuel: car.fuel,
    transmission: car.transmission,
    bodyType: car.bodyType,
    coverUrl: cover,
    coverIsReal: cover != null && stored.length > 0 && !isCarDemoStockUrl(cover),
    photoCount: stored.length > 0 ? stored.length : 0,
    powerHp: kwToHp(car.specs?.realPowerKw),
    logoUrl: resolveBrandLogoUrl(car.brandFr, car.brandLogoUrl),
  };
}

const loadAllShowcaseCars = cache(async (): Promise<ShowcaseCarRow[]> => {
  return prisma.car.findMany({
    select: showcaseCarSelect,
    orderBy: [{ brandAr: "asc" }, { modelAr: "asc" }],
  });
});

function modelKey(c: ShowcaseCarRow): string {
  return `${(c.brandFr ?? c.brandAr).toLowerCase()}|${(c.modelFr ?? c.modelAr).toLowerCase()}`;
}

/** Un véhicule par modèle, photo réelle obligatoire, en privilégiant la diversité des marques. */
export async function getFeaturedVehicles(locale: string, limit: number): Promise<VehicleCardData[]> {
  const rows = await loadAllShowcaseCars();
  const bestByModel = new Map<string, ShowcaseCarRow>();
  for (const c of rows) {
    const card = toVehicleCardData(c, locale);
    if (!card.coverIsReal || card.price == null) continue;
    const key = modelKey(c);
    const cur = bestByModel.get(key);
    const score = c.specs?.globalScore ?? 0;
    if (!cur || score > (cur.specs?.globalScore ?? 0) || (score === (cur.specs?.globalScore ?? 0) && c.year > cur.year)) {
      bestByModel.set(key, c);
    }
  }
  const ranked = [...bestByModel.values()].sort(
    (a, b) => (b.specs?.globalScore ?? 0) - (a.specs?.globalScore ?? 0) || b.year - a.year,
  );

  const picked: ShowcaseCarRow[] = [];
  const brandsUsed = new Set<string>();
  for (const c of ranked) {
    const brand = (c.brandFr ?? c.brandAr).toLowerCase();
    if (brandsUsed.has(brand)) continue;
    brandsUsed.add(brand);
    picked.push(c);
    if (picked.length >= limit) break;
  }
  for (const c of ranked) {
    if (picked.length >= limit) break;
    if (!picked.includes(c)) picked.push(c);
  }
  return picked.map((c) => toVehicleCardData(c, locale));
}

/** Derniers véhicules ajoutés (un par modèle). */
export async function getLatestVehicles(
  locale: string,
  limit: number,
  excludeIds: ReadonlySet<string> = new Set(),
): Promise<VehicleCardData[]> {
  const rows = await loadAllShowcaseCars();
  const sorted = [...rows].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || b.year - a.year);
  const seen = new Set<string>();
  const out: VehicleCardData[] = [];
  for (const c of sorted) {
    if (excludeIds.has(c.id)) continue;
    const key = modelKey(c);
    if (seen.has(key)) continue;
    const card = toVehicleCardData(c, locale);
    if (!card.coverIsReal) continue;
    seen.add(key);
    out.push(card);
    if (out.length >= limit) break;
  }
  return out;
}

export type BrandSummary = {
  /** Valeur exacte transmise à `?brand=` (brandFr sinon brandAr). */
  filterKey: string;
  label: string;
  logoUrl: string | null;
  vehicleCount: number;
  modelCount: number;
};

export async function getBrandSummaries(locale: string): Promise<BrandSummary[]> {
  const rows = await loadAllShowcaseCars();
  const map = new Map<string, { row: ShowcaseCarRow; vehicles: number; models: Set<string> }>();
  for (const c of rows) {
    const key = c.brandFr?.trim() || c.brandAr.trim();
    if (!key) continue;
    const cur = map.get(key);
    const model = (c.modelFr ?? c.modelAr).toLowerCase();
    if (cur) {
      cur.vehicles++;
      cur.models.add(model);
    } else {
      map.set(key, { row: c, vehicles: 1, models: new Set([model]) });
    }
  }
  return [...map.entries()]
    .map(([filterKey, v]) => ({
      filterKey,
      label: carBrandLabel(v.row, locale),
      logoUrl: resolveBrandLogoUrl(v.row.brandFr, v.row.brandLogoUrl),
      vehicleCount: v.vehicles,
      modelCount: v.models.size,
    }))
    .sort((a, b) => b.vehicleCount - a.vehicleCount || a.label.localeCompare(b.label));
}

export type CategorySummary = {
  bodyCounts: Partial<Record<BodyType, number>>;
  fuelCounts: Partial<Record<FuelType, number>>;
  total: number;
  /** Couverture représentative (photo réelle) par carrosserie et énergie. */
  bodyCovers: Partial<Record<BodyType, string>>;
  fuelCovers: Partial<Record<FuelType, string>>;
};

export async function getCategorySummary(locale: string): Promise<CategorySummary> {
  const rows = await loadAllShowcaseCars();
  const bodyCounts: Partial<Record<BodyType, number>> = {};
  const fuelCounts: Partial<Record<FuelType, number>> = {};
  const bodyCovers: Partial<Record<BodyType, string>> = {};
  const fuelCovers: Partial<Record<FuelType, string>> = {};
  const bestBodyScore: Partial<Record<BodyType, number>> = {};
  const bestFuelScore: Partial<Record<FuelType, number>> = {};

  for (const c of rows) {
    bodyCounts[c.bodyType] = (bodyCounts[c.bodyType] ?? 0) + 1;
    fuelCounts[c.fuel] = (fuelCounts[c.fuel] ?? 0) + 1;
    const card = toVehicleCardData(c, locale);
    if (!card.coverIsReal || !card.coverUrl) continue;
    const score = c.specs?.globalScore ?? 0;
    if (score >= (bestBodyScore[c.bodyType] ?? -1)) {
      bestBodyScore[c.bodyType] = score;
      bodyCovers[c.bodyType] = card.coverUrl;
    }
    if (score >= (bestFuelScore[c.fuel] ?? -1)) {
      bestFuelScore[c.fuel] = score;
      fuelCovers[c.fuel] = card.coverUrl;
    }
  }
  return { bodyCounts, fuelCounts, total: rows.length, bodyCovers, fuelCovers };
}

export type SearchIndexEntry = {
  brandKey: string;
  brand: string;
  model: string;
  /** Terme passé à `?q=` (nom du modèle). */
  query: string;
};

export async function getSearchIndex(locale: string): Promise<SearchIndexEntry[]> {
  const rows = await loadAllShowcaseCars();
  const seen = new Set<string>();
  const out: SearchIndexEntry[] = [];
  for (const c of rows) {
    const key = modelKey(c);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      brandKey: c.brandFr?.trim() || c.brandAr.trim(),
      brand: carBrandLabel(c, locale),
      model: carModelLabel(c, locale),
      query: (locale === "ar" ? c.modelAr : c.modelFr ?? c.modelAr).trim(),
    });
  }
  return out;
}

export async function getAvailableYears(): Promise<number[]> {
  const rows = await loadAllShowcaseCars();
  return [...new Set(rows.map((r) => r.year))].sort((a, b) => b - a);
}

export const CATALOG_SORTS = ["brand", "priceAsc", "priceDesc", "year"] as const;
export type CatalogSort = (typeof CATALOG_SORTS)[number];

export function parseCatalogSort(v: string | undefined): CatalogSort {
  return CATALOG_SORTS.find((s) => s === v) ?? "brand";
}

function catalogOrderBy(sort: CatalogSort): Prisma.CarOrderByWithRelationInput[] {
  switch (sort) {
    case "brand":
      return [{ brandFr: "asc" }, { brandAr: "asc" }, { modelAr: "asc" }, { year: "desc" }];
    case "priceAsc":
      return [{ priceNewEst: "asc" }, { id: "asc" }];
    case "priceDesc":
      return [{ priceNewEst: "desc" }, { id: "asc" }];
    case "year":
      return [{ year: "desc" }, { createdAt: "desc" }, { id: "asc" }];
    default: {
      const never: never = sort;
      return never;
    }
  }
}

export async function getCatalogPage(
  where: Prisma.CarWhereInput,
  sort: CatalogSort,
  page: number,
  pageSize: number,
  locale: string,
): Promise<{ total: number; items: VehicleCardData[] }> {
  const [total, rows] = await Promise.all([
    prisma.car.count({ where }),
    prisma.car.findMany({
      where,
      select: showcaseCarSelect,
      orderBy: catalogOrderBy(sort),
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  return { total, items: rows.map((r) => toVehicleCardData(r, locale)) };
}

/** Véhicules similaires : même carrosserie, prix neuf estimé à ±25 %, autre modèle. */
export async function getSimilarVehicles(
  car: { id: string; bodyType: BodyType; priceNewEst: number; brandFr: string | null; brandAr: string; modelFr: string | null; modelAr: string },
  locale: string,
  limit: number,
): Promise<VehicleCardData[]> {
  const price = positivePrice(car.priceNewEst);
  if (price == null) return [];
  const rows = await loadAllShowcaseCars();
  const selfKey = `${(car.brandFr ?? car.brandAr).toLowerCase()}|${(car.modelFr ?? car.modelAr).toLowerCase()}`;
  const seen = new Set<string>([selfKey]);
  const candidates = rows
    .filter((c) => c.bodyType === car.bodyType && c.priceNewEst >= price * 0.75 && c.priceNewEst <= price * 1.25)
    .sort((a, b) => Math.abs(a.priceNewEst - price) - Math.abs(b.priceNewEst - price));
  const out: VehicleCardData[] = [];
  for (const c of candidates) {
    const key = modelKey(c);
    if (seen.has(key)) continue;
    const card = toVehicleCardData(c, locale);
    if (!card.coverIsReal) continue;
    seen.add(key);
    out.push(card);
    if (out.length >= limit) break;
  }
  return out;
}
