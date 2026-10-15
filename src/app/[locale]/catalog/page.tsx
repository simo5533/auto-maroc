import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { isDatabaseConfigured } from "@/lib/db-ready";
import { DatabaseRequiredMessage } from "@/components/DatabaseRequiredMessage";
import { DatabaseUnreachableMessage } from "@/components/DatabaseUnreachableMessage";
import { isPrismaDbUnreachableError } from "@/lib/is-prisma-connection-error";
import { carWhereFromSearchParams } from "@/lib/car-filters";
import { ActiveFilters, type ActiveFilterChip } from "@/components/catalog/ActiveFilters";
import { FilterBar } from "@/components/catalog/FilterBar";
import { Pagination } from "@/components/catalog/Pagination";
import {
  CATALOG_FILTER_KEYS,
  buildCatalogQuery,
  priceLabelFromParams,
  type CatalogFilterKey,
  type CatalogParams,
} from "@/components/catalog/filter-model";
import { EditorialBanner } from "@/components/home/EditorialBanner";
import { IconArrowRight } from "@/components/ui/icons";
import { btnPrimary, btnSecondary, container, eyebrow } from "@/components/ui/styles";
import { EmptyState } from "@/components/vehicle/EmptyState";
import { VehicleCard } from "@/components/vehicle/VehicleCard";
import { getAvailableYears, getBrandSummaries, getCatalogPage, parseCatalogSort } from "@/lib/showcase";
import {
  BODY_VALUES,
  CONDITION_VALUES,
  FUEL_VALUES,
  GEARBOX_VALUES,
  USAGE_VALUES,
  bodyLabel,
  conditionLabel,
  fuelLabel,
  gearboxLabel,
  usageLabel,
} from "@/lib/vehicle-labels";

const PAGE_SIZE = 24;

type SP = Record<string, string | string[] | undefined>;

function pick<T extends string>(values: readonly T[], v: string | undefined): T | undefined {
  return values.find((x) => x === v);
}

function readParams(sp: SP): CatalogParams {
  const out: CatalogParams = {};
  for (const k of [...CATALOG_FILTER_KEYS, "sort"] as const) {
    const v = sp[k];
    if (typeof v === "string" && v.trim()) out[k] = v.trim();
  }
  return out;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "catalog" });
  return { title: `${t("title")} | Auto Maroc`, description: t("subtitle") };
}

export default async function CatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SP>;
}) {
  if (!isDatabaseConfigured()) {
    return <DatabaseRequiredMessage />;
  }

  const { locale } = await params;
  const loc = locale === "ar" ? "ar" : "fr";
  const sp = await searchParams;
  const p = readParams(sp);
  const sort = parseCatalogSort(p.sort);
  const requestedPage = Math.max(1, Math.floor(Number(sp.page)) || 1);

  const u = new URLSearchParams();
  for (const k of CATALOG_FILTER_KEYS) if (p[k]) u.set(k, p[k]);
  const where = carWhereFromSearchParams(u);

  let data: Awaited<ReturnType<typeof getCatalogPage>>;
  let brands: Awaited<ReturnType<typeof getBrandSummaries>>;
  let years: number[];
  try {
    [data, brands, years] = await Promise.all([
      getCatalogPage(where, sort, requestedPage, PAGE_SIZE, loc),
      getBrandSummaries(loc),
      getAvailableYears(),
    ]);
  } catch (e) {
    if (isPrismaDbUnreachableError(e)) return <DatabaseUnreachableMessage />;
    throw e;
  }

  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  if (page !== requestedPage && data.total > 0) {
    data = await getCatalogPage(where, sort, page, PAGE_SIZE, loc);
  }
  const t = await getTranslations("ui");
  const tc = await getTranslations("catalog");

  const without = (...keys: CatalogFilterKey[]): string => {
    const next = { ...p };
    for (const k of keys) delete next[k];
    return `/catalog${buildCatalogQuery(next)}`;
  };

  const chips: ActiveFilterChip[] = [];
  if (p.q) chips.push({ key: "q", label: `« ${p.q} »`, href: without("q") });
  if (p.brand) chips.push({ key: "brand", label: brands.find((b) => b.filterKey === p.brand)?.label ?? p.brand, href: without("brand") });
  const priceLabel = priceLabelFromParams(t, p, loc);
  if (priceLabel) chips.push({ key: "price", label: priceLabel, href: without("minPrice", "maxPrice") });
  const body = pick(BODY_VALUES, p.body);
  if (body) chips.push({ key: "body", label: bodyLabel(tc, body), href: without("body") });
  const fuel = pick(FUEL_VALUES, p.fuel);
  if (fuel) chips.push({ key: "fuel", label: fuelLabel(tc, fuel), href: without("fuel") });
  const gearbox = pick(GEARBOX_VALUES, p.transmission);
  if (gearbox) chips.push({ key: "transmission", label: gearboxLabel(tc, gearbox), href: without("transmission") });
  if (p.year) chips.push({ key: "year", label: p.year, href: without("year") });
  const condition = pick(CONDITION_VALUES, p.condition);
  if (condition) chips.push({ key: "condition", label: conditionLabel(t, condition), href: without("condition") });
  const usage = pick(USAGE_VALUES, p.usage);
  if (usage) chips.push({ key: "usage", label: usageLabel(t, usage), href: without("usage") });

  const clearHref = `/catalog${buildCatalogQuery({ sort: p.sort })}`;
  const hrefFor = (n: number) => `/catalog${buildCatalogQuery(p, n > 1 ? { page: String(n) } : {})}`;

  const firstRow = data.items.slice(0, 6);
  const restRows = data.items.slice(6);
  const breakVehicle = page === 1 && chips.length === 0 ? data.items.find((c) => c.coverIsReal && c.bodyType === "SUV") ?? null : null;

  return (
    <div className="pb-24">
      <header className={`${container} pb-10 pt-12 sm:pt-16`}>
        <p className={eyebrow}>{t("catalogEyebrow")}</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-[40px] font-semibold leading-none tracking-[-0.04em] text-fg sm:text-6xl">{t("catalogTitle")}</h1>
          <p className="text-sm tabular-nums text-fg-muted" aria-live="polite">
            {t("resultsCount", { n: data.total })}
          </p>
        </div>
      </header>

      <FilterBar params={p} brands={brands.map((b) => ({ filterKey: b.filterKey, label: b.label }))} years={years} />

      <div className={`${container} pt-8`}>
        {chips.length > 0 ? (
          <div className="mb-8">
            <ActiveFilters chips={chips} clearHref={clearHref} />
          </div>
        ) : null}

        {data.items.length === 0 ? (
          <EmptyState
            title={t("emptyTitle")}
            body={t("emptyBody")}
            action={
              <Link href={clearHref} className={btnSecondary}>
                {t("clearAll")}
              </Link>
            }
          />
        ) : (
          <>
            <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 xl:gap-6">
              {firstRow.map((car, i) => (
                <li key={car.id}>
                  <VehicleCard car={car} priority={i < 3} />
                </li>
              ))}
            </ul>

            {breakVehicle && restRows.length > 0 ? (
              <div className="my-12 sm:my-16">
                <EditorialBanner
                  compact
                  lines={[t("editorialCompareLine1"), t("editorialCompareLine2")]}
                  body={t("editorialCompareBody")}
                  imageUrl={breakVehicle.coverUrl}
                  imageAlt=""
                  action={
                    <Link href="/compare" className={btnPrimary}>
                      {t("compareCta")}
                      <IconArrowRight size={16} className="rtl:rotate-180" />
                    </Link>
                  }
                />
              </div>
            ) : null}

            {restRows.length > 0 ? (
              <ul className={`grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 xl:gap-6 ${breakVehicle ? "" : "mt-5 xl:mt-6"}`}>
                {restRows.map((car) => (
                  <li key={car.id}>
                    <VehicleCard car={car} />
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="mt-16">
              <Pagination page={page} totalPages={totalPages} hrefFor={hrefFor} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
