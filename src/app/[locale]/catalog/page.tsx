import { getTranslations } from "next-intl/server";
import { isDatabaseConfigured } from "@/lib/db-ready";
import { prisma } from "@/lib/prisma";
import { DatabaseRequiredMessage } from "@/components/DatabaseRequiredMessage";
import { DatabaseUnreachableMessage } from "@/components/DatabaseUnreachableMessage";
import { isPrismaDbUnreachableError } from "@/lib/is-prisma-connection-error";
import { carWhereFromSearchParams } from "@/lib/car-filters";
import { toURLSearchParams } from "@/lib/search-params";
import { CatalogToolbar } from "@/components/CatalogToolbar";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/Card";
import { CatalogBrandSection } from "@/components/CatalogBrandSection";
import { ensureRealVehicleImages, getDisplayCarImageUrls } from "@/lib/vehicle-images-resolve";
import { getStoredCarImageUrls } from "@/lib/car-images";
import { isPexelsNonDemoUrl, isPicsumPlaceholderUrl } from "@/lib/car-demo-images";
import { resolveBrandLogoUrl } from "@/lib/brand-assets";
import { officialModelShowroomUrl } from "@/lib/brand-model-official-links";
import type { Car, CarSpecs } from "@prisma/client";

const KEYS = ["q", "minPrice", "maxPrice", "fuel", "transmission", "body", "condition", "usage", "brand"] as const;

type CarRow = Car & { specs: CarSpecs | null };

/**
 * Lance ensureRealVehicleImages avec une concurrence limitée et un budget total :
 * - les cars déjà rafraîchies (Wikimedia / démo whitelistée) sortent vite (needsOpenSourceRefresh).
 * - les cars avec anciennes URLs hors sujet (Picsum, Pexels random) sont mises à jour en DB
 *   pour que la couverture catalogue corresponde à la galerie de la fiche détail.
 *
 * Plafond MAX_REFRESH pour éviter un premier rendu trop long. Le reste sera réparé soit lors
 * de la visite de la fiche, soit en lançant `npm run catalog:backfill-images`.
 */
function carNeedsRefresh(car: Pick<Car, "imageUrl" | "imageUrls">): boolean {
  const stored = getStoredCarImageUrls(car);
  if (stored.length === 0) return true;
  return stored.some((u) => isPicsumPlaceholderUrl(u) || isPexelsNonDemoUrl(u));
}

/**
 * Rafraîchit en DB les voitures dont les URLs stockées sont hors sujet ou absentes,
 * pour que la couverture catalogue corresponde à la galerie de la fiche détail.
 * Plafonné (MAX_REFRESH) afin de garder un rendu rapide ; le reste se répare via la
 * visite de fiche ou `npm run catalog:backfill-images`.
 */
async function refreshCatalogImages(cars: CarRow[]): Promise<void> {
  const todo = cars.filter(carNeedsRefresh);
  if (todo.length === 0) return;
  const CONCURRENCY = 4;
  const MAX_REFRESH = 40;
  const slice = todo.slice(0, MAX_REFRESH);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(CONCURRENCY, slice.length) }, async () => {
    while (cursor < slice.length) {
      const i = cursor++;
      const car = slice[i]!;
      try {
        const fresh = await ensureRealVehicleImages(prisma, car);
        if (fresh.length > 0) {
          car.imageUrl = fresh[0] ?? car.imageUrl;
          car.imageUrls = fresh;
        }
      } catch {
        /* repli déjà géré dans ensureRealVehicleImages */
      }
    }
  });
  await Promise.all(workers);
}

function groupByBrand(cars: CarRow[], locale: string): [string, CarRow[]][] {
  const map = new Map<string, CarRow[]>();
  for (const c of cars) {
    const label = locale === "ar" ? c.brandAr : (c.brandFr ?? c.brandAr);
    const list = map.get(label) ?? [];
    list.push(c);
    map.set(label, list);
  }
  const collator = locale === "ar" ? "ar" : "fr";
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], collator));
}

export default async function CatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!isDatabaseConfigured()) {
    return <DatabaseRequiredMessage />;
  }

  const { locale } = await params;
  const sp = await searchParams;
  const u = toURLSearchParams(sp, KEYS);
  const where = carWhereFromSearchParams(u);
  let cars: CarRow[];
  try {
    cars = await prisma.car.findMany({
      where,
      include: { specs: true },
      orderBy: [{ brandAr: "asc" }, { modelAr: "asc" }],
      take: 500,
    });
  } catch (e) {
    if (isPrismaDbUnreachableError(e)) {
      return <DatabaseUnreachableMessage />;
    }
    throw e;
  }
  await refreshCatalogImages(cars);
  const t = await getTranslations("catalog");
  const grouped = groupByBrand(cars, locale);

  return (
    <div className="pb-8">
      <PageHeader title={t("title")} description={t("subtitle")} eyebrow={t("eyebrow")} />
      <CatalogToolbar initial={Object.fromEntries(u.entries()) as Record<string, string>} />
      {cars.length === 0 ? (
        <Card className="text-center text-zinc-600" padding="p-10">
          {t("empty")}
        </Card>
      ) : (
        <>
          <nav
            className="mt-6 flex flex-wrap gap-2 rounded-2xl border border-zinc-200/90 bg-white p-3 shadow-sm ring-1 ring-zinc-100"
            aria-label={t("brandsNav")}
          >
            {grouped.map(([label], i) => (
              <a
                key={label}
                href={`#marque-${i}`}
                className="rounded-full border border-zinc-200 bg-zinc-50 px-3.5 py-1.5 text-xs font-semibold text-zinc-800 transition hover:border-zinc-300 hover:bg-white"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="mt-10 space-y-12">
            {grouped.map(([brandLabel, list], gi) => {
              const head = list[0];
              const logoUrl = resolveBrandLogoUrl(head?.brandFr, head?.brandLogoUrl);
              const official = head?.officialUrl;
              const items = list.map((c) => {
                const imgs = getDisplayCarImageUrls(c);
                const title =
                  locale === "ar"
                    ? `${c.modelAr}`.trim()
                    : `${c.modelFr ?? c.modelAr}`.trim();
                return {
                  id: c.id,
                  coverUrl: imgs[0] ?? null,
                  title,
                  versionLabel: `${c.year} · ${locale === "ar" ? c.versionAr : c.versionFr ?? c.versionAr}`,
                  bodyType: c.bodyType,
                  fuel: c.fuel,
                  transmission: c.transmission,
                  priceNewEst: c.priceNewEst,
                  globalScore: c.specs?.globalScore ?? null,
                  showroomUrl: officialModelShowroomUrl(c.brandFr, c.modelFr),
                  photoCount: imgs.length,
                };
              });
              return (
                <div key={brandLabel} id={`marque-${gi}`}>
                  <CatalogBrandSection
                    brandLabel={brandLabel}
                    logoUrl={logoUrl}
                    officialUrl={official}
                    locale={locale}
                    items={items}
                  />
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
