"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "@/i18n/navigation";
import { FilterSelect } from "@/components/catalog/FilterSelect";
import { FilterSheet } from "@/components/catalog/FilterSheet";
import {
  PRICE_OPTIONS,
  SORT_VALUES,
  activeFilterCount,
  applyPriceValue,
  buildCatalogQuery,
  currentPriceValue,
  priceRangeLabel,
  sortLabel,
  type CatalogFilterKey,
  type CatalogParams,
} from "@/components/catalog/filter-model";
import { IconSearch, IconSliders } from "@/components/ui/icons";
import { container, focusRing } from "@/components/ui/styles";
import { BODY_VALUES, FUEL_VALUES, GEARBOX_VALUES, bodyLabel, fuelLabel, gearboxLabel } from "@/lib/vehicle-labels";

export function FilterBar({
  params,
  brands,
  years,
}: {
  params: CatalogParams;
  brands: { filterKey: string; label: string }[];
  years: number[];
}) {
  const t = useTranslations("ui");
  const tc = useTranslations("catalog");
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(params.q ?? "");
  const [sheetOpen, setSheetOpen] = useState(false);

  const [syncedQ, setSyncedQ] = useState(params.q ?? "");
  if (syncedQ !== (params.q ?? "")) {
    setSyncedQ(params.q ?? "");
    setQ(params.q ?? "");
  }

  const go = useCallback(
    (next: CatalogParams) => {
      startTransition(() => router.push(`/catalog${buildCatalogQuery(next)}`, { scroll: false }));
    },
    [router],
  );

  const set = (k: CatalogFilterKey) => (v: string) => go({ ...params, [k]: v || undefined });
  const closeSheet = useCallback(() => setSheetOpen(false), []);
  const count = activeFilterCount(params);

  function submit(e: FormEvent) {
    e.preventDefault();
    go({ ...params, q: q.trim() || undefined });
  }

  return (
    <div className="glass sticky top-[var(--header-h)] z-30 border-y border-line" data-pending={pending || undefined}>
      <div className={`${container} flex items-center gap-2 py-3`}>
        <form onSubmit={submit} role="search" className="relative min-w-0 flex-1 lg:max-w-[260px]">
          <label htmlFor="catalog-q" className="sr-only">
            {t("filterSearch")}
          </label>
          <IconSearch size={16} className="pointer-events-none absolute start-3.5 top-1/2 z-10 -translate-y-1/2 text-steel" />
          <input
            id="catalog-q"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onBlur={() => {
              if ((params.q ?? "") !== q.trim()) go({ ...params, q: q.trim() || undefined });
            }}
            placeholder={t("searchPlaceholder")}
            className="h-11 w-full rounded-[10px] border border-line bg-carbon/80 ps-10 pe-3 text-[13px] text-fg placeholder:text-steel transition hover:border-line-strong focus:border-accent/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          />
        </form>

        <div className="hidden min-w-0 flex-1 items-center gap-2 lg:flex">
          <FilterSelect
            className="min-w-0 flex-1"
            label={t("filterBrand")}
            value={params.brand ?? ""}
            onChange={set("brand")}
            placeholder={t("filterBrand")}
            options={brands.map((b) => ({ value: b.filterKey, label: b.label }))}
          />
          <FilterSelect
            className="min-w-0 flex-1"
            label={t("filterPrice")}
            value={currentPriceValue(params)}
            onChange={(v) => go(applyPriceValue(params, v))}
            placeholder={t("filterPrice")}
            options={PRICE_OPTIONS.map((o) => ({ value: o.value, label: priceRangeLabel(t, o.min, o.max, locale) }))}
          />
          <FilterSelect
            className="min-w-0 flex-1"
            label={t("filterFuel")}
            value={params.fuel ?? ""}
            onChange={set("fuel")}
            placeholder={t("filterFuel")}
            options={FUEL_VALUES.map((v) => ({ value: v, label: fuelLabel(tc, v) }))}
          />
          <FilterSelect
            className="hidden min-w-0 flex-1 xl:block"
            label={t("filterGearbox")}
            value={params.transmission ?? ""}
            onChange={set("transmission")}
            placeholder={t("filterGearbox")}
            options={GEARBOX_VALUES.map((v) => ({ value: v, label: gearboxLabel(tc, v) }))}
          />
          <FilterSelect
            className="min-w-0 flex-1"
            label={t("filterBody")}
            value={params.body ?? ""}
            onChange={set("body")}
            placeholder={t("filterBody")}
            options={BODY_VALUES.map((v) => ({ value: v, label: bodyLabel(tc, v) }))}
          />
          <FilterSelect
            className="hidden min-w-0 flex-1 xl:block"
            label={t("filterYear")}
            value={params.year ?? ""}
            onChange={set("year")}
            placeholder={t("filterYear")}
            options={years.map((y) => ({ value: String(y), label: String(y) }))}
          />
        </div>

        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          aria-haspopup="dialog"
          className={`relative inline-flex h-11 shrink-0 items-center gap-2 rounded-[10px] border border-line bg-carbon/80 px-3.5 text-[13px] font-semibold text-fg transition hover:border-line-strong ${focusRing}`}
        >
          <IconSliders size={16} />
          <span className="hidden sm:inline">{t("moreFilters")}</span>
          {count > 0 ? (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-accent-ink">{count}</span>
          ) : null}
        </button>

        <FilterSelect
          className="hidden w-[168px] shrink-0 sm:block"
          label={t("sortLabel")}
          value={params.sort && params.sort !== "brand" ? params.sort : ""}
          onChange={(v) => go({ ...params, sort: v || undefined })}
          placeholder={sortLabel(t, "brand")}
          options={SORT_VALUES.filter((s) => s !== "brand").map((s) => ({ value: s, label: sortLabel(t, s) }))}
        />
      </div>

      {pending ? <div className="absolute inset-x-0 bottom-0 h-px overflow-hidden"><div className="skeleton h-full w-full" /></div> : null}

      {sheetOpen ? (
        <FilterSheet
          onClose={closeSheet}
          initial={params}
          brands={brands}
          years={years}
          onApply={(p) => {
            setSheetOpen(false);
            go(p);
          }}
        />
      ) : null}
    </div>
  );
}
