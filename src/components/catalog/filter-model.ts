import { PRICE_RANGES } from "@/lib/vehicle-labels";

/** Paramètres d'URL du catalogue (identiques à l'existant + `year`, `sort`, `page`). */
export const CATALOG_FILTER_KEYS = [
  "q",
  "brand",
  "minPrice",
  "maxPrice",
  "fuel",
  "transmission",
  "body",
  "year",
  "condition",
  "usage",
] as const;
export type CatalogFilterKey = (typeof CATALOG_FILTER_KEYS)[number];
export type CatalogParams = Partial<Record<CatalogFilterKey | "sort", string>>;

export function priceRangeValue(min: number | null, max: number | null): string {
  return `${min ?? ""}-${max ?? ""}`;
}

export function currentPriceValue(p: CatalogParams): string {
  if (!p.minPrice && !p.maxPrice) return "";
  return `${p.minPrice ?? ""}-${p.maxPrice ?? ""}`;
}

export function applyPriceValue(p: CatalogParams, value: string): CatalogParams {
  const [min, max] = value.split("-");
  const next = { ...p };
  delete next.minPrice;
  delete next.maxPrice;
  if (min) next.minPrice = min;
  if (max) next.maxPrice = max;
  return next;
}

export function buildCatalogQuery(p: CatalogParams, extra: Record<string, string> = {}): string {
  const u = new URLSearchParams();
  for (const k of CATALOG_FILTER_KEYS) {
    const v = p[k]?.trim();
    if (v) u.set(k, v);
  }
  if (p.sort && p.sort !== "brand") u.set("sort", p.sort);
  for (const [k, v] of Object.entries(extra)) u.set(k, v);
  const s = u.toString();
  return s ? `?${s}` : "";
}

export function activeFilterCount(p: CatalogParams): number {
  let n = 0;
  for (const k of CATALOG_FILTER_KEYS) {
    if (k === "q" || k === "maxPrice") continue;
    if (k === "minPrice") {
      if (p.minPrice || p.maxPrice) n++;
      continue;
    }
    if (p[k]) n++;
  }
  return n;
}

type T = (key: string, values?: Record<string, string | number>) => string;

export function priceRangeLabel(t: T, min: number | null, max: number | null, locale: string): string {
  const nf = locale === "ar" ? "ar-MA" : "fr-FR";
  const f = (n: number) => n.toLocaleString(nf);
  if (min == null && max != null) return t("priceUnder", { v: f(max) });
  if (max == null && min != null) return t("priceOver", { v: f(min) });
  if (min != null && max != null) return t("priceBetween", { min: f(min), max: f(max) });
  return t("anyPrice");
}

export function priceLabelFromParams(t: T, p: CatalogParams, locale: string): string | null {
  if (!p.minPrice && !p.maxPrice) return null;
  const min = p.minPrice ? Number(p.minPrice) : null;
  const max = p.maxPrice ? Number(p.maxPrice) : null;
  return priceRangeLabel(t, Number.isFinite(min) ? min : null, Number.isFinite(max) ? max : null, locale);
}

export const SORT_VALUES = ["brand", "priceAsc", "priceDesc", "year"] as const;
export type SortValue = (typeof SORT_VALUES)[number];

export function sortLabel(t: T, s: SortValue): string {
  switch (s) {
    case "brand":
      return t("sortBrand");
    case "priceAsc":
      return t("sortPriceAsc");
    case "priceDesc":
      return t("sortPriceDesc");
    case "year":
      return t("sortYear");
    default: {
      const never: never = s;
      return never;
    }
  }
}

export const PRICE_OPTIONS = PRICE_RANGES.map((r) => ({ ...r, value: priceRangeValue(r.min, r.max) }));
