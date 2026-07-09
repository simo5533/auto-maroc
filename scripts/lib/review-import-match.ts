export function normText(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

const BRAND_ALIASES = new Map<string, string>([
  ["citroen", "citroen"],
  ["citroën", "citroen"],
  ["mercedes-benz", "mercedes"],
  ["mercedes benz", "mercedes"],
]);

export function normBrand(brand: string): string {
  const n = normText(brand);
  return BRAND_ALIASES.get(n) ?? n;
}

export type CatalogCarRef = {
  id: string;
  brandFr: string | null;
  brandAr: string;
  modelFr: string | null;
  modelAr: string;
  year: number;
};

export function buildCarMatcher(cars: CatalogCarRef[]) {
  const byModel = new Map<string, CatalogCarRef[]>();
  const byBrand = new Map<string, CatalogCarRef[]>();

  for (const c of cars) {
    const brand = normBrand(c.brandFr ?? c.brandAr);
    const model = normText(c.modelFr ?? c.modelAr);
    const modelKey = `${brand}|${model}`;
    if (!byModel.has(modelKey)) byModel.set(modelKey, []);
    byModel.get(modelKey)!.push(c);
    if (!byBrand.has(brand)) byBrand.set(brand, []);
    byBrand.get(brand)!.push(c);
  }

  function pickFromList(list: CatalogCarRef[], year: number): CatalogCarRef {
    const exact = list.find((c) => c.year === year);
    if (exact) return exact;
    return list.reduce((best, cur) =>
      Math.abs(cur.year - year) < Math.abs(best.year - year) ? cur : best,
    );
  }

  function pickCar(marque: string, modele: string, annee: number, seed: string): CatalogCarRef | null {
    const modelKey = `${normBrand(marque)}|${normText(modele)}`;
    const modelList = byModel.get(modelKey);
    if (modelList?.length) return pickFromList(modelList, annee);

    const brandList = byBrand.get(normBrand(marque));
    if (!brandList?.length) return null;

    const h = [...seed].reduce((a, ch) => a + ch.charCodeAt(0), 0);
    return brandList[h % brandList.length]!;
  }

  return { pickCar, byModelSize: byModel.size, byBrandSize: byBrand.size };
}

export function cleanReviewText(raw: string, titre?: string): string {
  const body = String(raw ?? "")
    .replace(/^DEMO\s*:\s*/i, "")
    .trim();
  const title = String(titre ?? "").trim();
  if (!title) return body.slice(0, 4000);
  if (!body) return title.slice(0, 4000);
  return `${title}. ${body}`.slice(0, 4000);
}
