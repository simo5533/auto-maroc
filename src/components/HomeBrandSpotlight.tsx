"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import type { HomeBrandStripItem } from "@/lib/home-popular-brands";
import { cardBase } from "@/components/ui/styles";

type ApiModel = {
  id: string;
  brandFr: string | null;
  brandAr: string;
  modelAr: string;
  modelFr: string | null;
  imageUrl: string | null;
  imageUrls: unknown;
  year: number;
  versionsCount: number;
};

function firstImage(c: ApiModel): string | null {
  if (c.imageUrl && c.imageUrl.trim()) return c.imageUrl;
  if (Array.isArray(c.imageUrls) && typeof c.imageUrls[0] === "string") {
    return c.imageUrls[0] as string;
  }
  return null;
}

/** URL du hub modèle « choisir l'année » inspiré de Caradisiac. */
function modelHubHref(brandKey: string, modelKey: string): string {
  return `/fiches-techniques?brand=${encodeURIComponent(brandKey)}&model=${encodeURIComponent(modelKey)}`;
}

export function HomeBrandSpotlight({
  brands,
  locale,
}: {
  brands: HomeBrandStripItem[];
  locale: "ar" | "fr";
}) {
  const t = useTranslations("home");
  const [selectedKey, setSelectedKey] = useState<string | null>(brands[0]?.filterKey ?? null);
  const [models, setModels] = useState<ApiModel[]>([]);
  const [loading, setLoading] = useState(false);

  const loadModels = useCallback(async (brandKey: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/cars?brand=${encodeURIComponent(brandKey)}&groupBy=model&take=12`,
      );
      const data = (await res.json()) as { models?: ApiModel[] };
      setModels(data.models ?? []);
    } catch {
      setModels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedKey) void loadModels(selectedKey);
  }, [selectedKey, loadModels]);

  if (brands.length === 0) return null;

  const catalogAllHref = "/catalog";
  const catalogBrandHref =
    selectedKey != null ? `/catalog?brand=${encodeURIComponent(selectedKey)}` : catalogAllHref;

  return (
    <div className="space-y-10 border-t border-zinc-200/80 pt-12">
      {/* Bande logos */}
      <section className="space-y-4">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="h-9 w-1 shrink-0 rounded-full bg-rose-600" aria-hidden />
            <div>
              <h2 className="text-lg font-bold tracking-tight text-zinc-900 sm:text-xl">
                {t("popularBrandsTitle")}
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500">{t("popularBrandsHint")}</p>
            </div>
          </div>
          <Link
            href={catalogAllHref}
            className="text-sm font-semibold text-zinc-700 underline decoration-zinc-300 underline-offset-4 transition hover:text-emerald-700 hover:decoration-emerald-400"
          >
            {t("seeAllCatalog")}
          </Link>
        </header>

        <div className="-mx-1 flex gap-3 overflow-x-auto pb-2 pt-1 [scrollbar-width:thin] sm:flex-wrap sm:overflow-visible">
          {brands.map((b, i) => {
            const label = locale === "ar" ? b.labelAr : b.labelFr;
            const active = selectedKey === b.filterKey;
            return (
              <button
                key={b.filterKey}
                type="button"
                onClick={() => setSelectedKey(b.filterKey)}
                style={{ animationDelay: `${i * 45}ms` }}
                className={`motion-safe:animate-compare-rise flex min-w-[148px] shrink-0 snap-start items-center gap-3 rounded-2xl border bg-white px-4 py-3 text-start shadow-sm ring-zinc-100 transition hover:border-emerald-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 sm:min-w-0 ${
                  active
                    ? "border-emerald-400 ring-2 ring-emerald-400/30"
                    : "border-zinc-200"
                }`}
              >
                <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-50 ring-1 ring-zinc-100">
                  {b.logoUrl ? (
                    <Image
                      src={b.logoUrl}
                      alt=""
                      width={44}
                      height={44}
                      className="object-contain p-1.5"
                      unoptimized
                    />
                  ) : (
                    <span className="text-xs font-bold text-zinc-400">{label.slice(0, 2)}</span>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-zinc-900">{label}</span>
                  <span className="text-[11px] text-zinc-500">
                    {t("modelsCountChip", { n: b.count })}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Modèles */}
      <section className="space-y-4">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="h-9 w-1 shrink-0 rounded-full bg-rose-600" aria-hidden />
            <div>
              <h2 className="text-lg font-bold tracking-tight text-zinc-900 sm:text-xl">
                {t("popularModelsTitle")}
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500">{t("popularModelsHint")}</p>
            </div>
          </div>
          <Link
            href={catalogBrandHref}
            className="text-sm font-semibold text-zinc-700 underline decoration-zinc-300 underline-offset-4 transition hover:text-emerald-700 hover:decoration-emerald-400"
          >
            {t("seeAllCatalog")}
          </Link>
        </header>

        {loading ? (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <li
                key={i}
                className={`${cardBase} overflow-hidden`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="aspect-[16/10] animate-pulse bg-zinc-200" />
                <div className="space-y-2 p-3">
                  <div className="mx-auto h-3 w-3/4 animate-pulse rounded bg-zinc-200" />
                  <div className="mx-auto h-3 w-1/2 animate-pulse rounded bg-zinc-100" />
                </div>
              </li>
            ))}
          </ul>
        ) : models.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/80 px-4 py-8 text-center text-sm text-zinc-600">
            {t("modelsEmpty")}
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {models.map((m, i) => {
              const img = firstImage(m);
              const modelLabel =
                locale === "ar"
                  ? `${m.modelAr}`.trim()
                  : `${m.modelFr ?? m.modelAr}`.trim();
              const brandKey = m.brandFr ?? m.brandAr;
              const modelKey = m.modelFr ?? m.modelAr;
              return (
                <li
                  key={`${brandKey}-${modelKey}`}
                  className="motion-safe:animate-compare-rise"
                  style={{ animationDelay: `${i * 55}ms` }}
                >
                  <Link
                    href={modelHubHref(brandKey, modelKey)}
                    className={`${cardBase} group flex h-full flex-col overflow-hidden transition hover:-translate-y-1 hover:shadow-lg motion-reduce:hover:translate-y-0`}
                  >
                    <div className="relative aspect-[16/10] bg-gradient-to-br from-zinc-100 to-zinc-50">
                      {img ? (
                        <Image
                          src={img}
                          alt=""
                          fill
                          className="object-cover transition duration-500 group-hover:scale-[1.04] motion-reduce:group-hover:scale-100"
                          sizes="(max-width:640px) 50vw, 20vw"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-2xl font-bold text-zinc-300">
                          {modelLabel.slice(0, 2)}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col justify-center p-3 text-center">
                      <p className="text-sm font-semibold leading-snug text-zinc-900">{modelLabel}</p>
                      <p className="mt-1 text-[11px] font-medium text-zinc-500">
                        {t("modelVersionsChip", { n: m.versionsCount })}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
