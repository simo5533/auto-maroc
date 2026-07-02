"use client";

import Image from "next/image";
import { useMemo, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { btnPrimary, selectBase } from "@/components/ui/styles";
import { getCarCoverImageUrl } from "@/lib/car-images";
import { carBrandLabel, carModelLabel, carVersionLabel } from "@/lib/locale-text";
import type { BodyType, FuelType, Transmission } from "@prisma/client";

export type FichesCar = {
  id: string;
  brandFr: string | null;
  brandAr: string;
  modelFr: string | null;
  modelAr: string;
  versionFr: string | null;
  versionAr: string;
  year: number;
  priceNewEst: number;
  fuel: FuelType;
  transmission: Transmission;
  bodyType: BodyType;
  imageUrl: string | null;
  imageUrls: unknown;
};

function firstImage(c: FichesCar): string | null {
  return getCarCoverImageUrl(c);
}

function brandKey(c: FichesCar): string {
  return (c.brandFr?.trim() || c.brandAr).trim();
}

function modelKey(c: FichesCar): string {
  return (c.modelFr?.trim() || c.modelAr).trim();
}

function brandLabel(c: FichesCar, locale: "ar" | "fr"): string {
  return carBrandLabel(c, locale);
}

function modelLabel(c: FichesCar, locale: "ar" | "fr"): string {
  return carModelLabel(c, locale);
}

function versionLabel(c: FichesCar, locale: "ar" | "fr"): string {
  return carVersionLabel(c, locale);
}

export function FichesTechniquesClient({
  cars,
  locale,
  initialBrand,
  initialModel,
}: {
  cars: FichesCar[];
  locale: "ar" | "fr";
  initialBrand: string;
  initialModel: string;
}) {
  const t = useTranslations("fiches");
  const router = useRouter();

  const [brand, setBrand] = useState<string>(initialBrand);
  const [model, setModel] = useState<string>(initialModel);
  const [year, setYear] = useState<number | "">("");
  const [versionId, setVersionId] = useState<string>("");

  // Marques (clé exacte = brandFr ou brandAr fallback)
  const brands = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of cars) {
      const k = brandKey(c);
      if (!map.has(k)) map.set(k, brandLabel(c, locale));
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], locale));
  }, [cars, locale]);

  // Modèles de la marque sélectionnée
  const models = useMemo(() => {
    if (!brand) return [];
    const map = new Map<string, string>();
    for (const c of cars) {
      if (brandKey(c) !== brand) continue;
      const k = modelKey(c);
      if (!map.has(k)) map.set(k, modelLabel(c, locale));
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], locale));
  }, [cars, brand, locale]);

  // Années (puces) du couple marque+modèle
  const years = useMemo(() => {
    if (!brand || !model) return [];
    const set = new Set<number>();
    for (const c of cars) {
      if (brandKey(c) === brand && modelKey(c) === model) set.add(c.year);
    }
    return [...set].sort((a, b) => b - a);
  }, [cars, brand, model]);

  // Versions disponibles pour (marque + modèle + année)
  const versions = useMemo(() => {
    if (!brand || !model || year === "") return [];
    return cars
      .filter((c) => brandKey(c) === brand && modelKey(c) === model && c.year === year)
      .sort((a, b) =>
        versionLabel(a, locale).localeCompare(versionLabel(b, locale), locale),
      );
  }, [cars, brand, model, year, locale]);

  const selectedCar: FichesCar | null = useMemo(() => {
    if (versions.length === 0) return null;
    if (versionId) return versions.find((c) => c.id === versionId) ?? versions[0]!;
    return versions[0]!;
  }, [versions, versionId]);

  // Réinitialise les états en cascade quand la sélection parent change.
  useEffect(() => {
    if (!brand) {
      setModel("");
      return;
    }
    if (model && !models.some(([k]) => k === model)) setModel("");
  }, [brand, model, models]);

  useEffect(() => {
    if (!model) {
      setYear("");
      return;
    }
    if (year !== "" && !years.includes(year)) setYear("");
  }, [model, year, years]);

  useEffect(() => {
    if (year === "") {
      setVersionId("");
      return;
    }
    if (versionId && !versions.some((v) => v.id === versionId)) setVersionId("");
    if (!versionId && versions.length > 0) {
      // Pré-sélection automatique de la 1re version dispo pour fluidifier le flux.
      setVersionId(versions[0]!.id);
    }
  }, [year, versionId, versions]);

  // Quand on arrive depuis le hub modèle (`?brand=...&model=...`), pré-sélectionne
  // l'année la plus récente disponible.
  useEffect(() => {
    if (year === "" && years.length > 0) setYear(years[0]!);
  }, [year, years]);

  // Accès rapide : tous les modèles, triés par millésime le plus récent.
  const quickAccess = useMemo(() => {
    const map = new Map<string, { brand: string; model: string; brandLbl: string; modelLbl: string; latest: number }>();
    for (const c of cars) {
      const bk = brandKey(c);
      const mk = modelKey(c);
      const k = `${bk}__${mk}`;
      const cur = map.get(k);
      if (!cur) {
        map.set(k, {
          brand: bk,
          model: mk,
          brandLbl: brandLabel(c, locale),
          modelLbl: modelLabel(c, locale),
          latest: c.year,
        });
      } else if (c.year > cur.latest) {
        cur.latest = c.year;
      }
    }
    return [...map.values()].sort((a, b) => b.latest - a.latest);
  }, [cars, locale]);

  /**
   * Vue exhaustive : marque → liste de tous ses modèles → toutes les années
   * disponibles en base. Cliquer une année pré-remplit le formulaire.
   */
  type BrandTreeNode = {
    brandKey: string;
    brandLbl: string;
    models: { modelKey: string; modelLbl: string; years: number[] }[];
  };
  const brandTree: BrandTreeNode[] = useMemo(() => {
    const byBrand = new Map<
      string,
      {
        brandLbl: string;
        models: Map<string, { modelLbl: string; years: Set<number> }>;
      }
    >();
    for (const c of cars) {
      const bk = brandKey(c);
      const mk = modelKey(c);
      const bEntry =
        byBrand.get(bk) ??
        (() => {
          const v = { brandLbl: brandLabel(c, locale), models: new Map<string, { modelLbl: string; years: Set<number> }>() };
          byBrand.set(bk, v);
          return v;
        })();
      const mEntry =
        bEntry.models.get(mk) ??
        (() => {
          const v = { modelLbl: modelLabel(c, locale), years: new Set<number>() };
          bEntry.models.set(mk, v);
          return v;
        })();
      mEntry.years.add(c.year);
    }
    return [...byBrand.entries()]
      .map(([k, v]) => ({
        brandKey: k,
        brandLbl: v.brandLbl,
        models: [...v.models.entries()]
          .map(([mk, mv]) => ({
            modelKey: mk,
            modelLbl: mv.modelLbl,
            years: [...mv.years].sort((a, b) => b - a),
          }))
          .sort((a, b) => a.modelLbl.localeCompare(b.modelLbl, locale)),
      }))
      .sort((a, b) => a.brandLbl.localeCompare(b.brandLbl, locale));
  }, [cars, locale]);

  function goToFiche() {
    if (selectedCar) router.push(`/cars/${selectedCar.id}`);
  }

  function pickFromTree(b: string, m: string, y: number) {
    setBrand(b);
    setModel(m);
    setYear(y);
    setVersionId("");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <div className="space-y-10">
      {/* Sélecteurs en cascade — style Caradisiac */}
      <Card padding="p-5 sm:p-6 md:p-8" className="space-y-6">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-zinc-900 sm:text-xl">
            {t("searchTitle")}
          </h2>
          <p className="mt-1 text-sm text-zinc-500">{t("searchHint")}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {t("brand")}
            </span>
            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className={`mt-1.5 ${selectBase}`}
            >
              <option value="">— {t("allBrands")} —</option>
              {brands.map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {t("model")}
            </span>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={!brand}
              className={`mt-1.5 ${selectBase} disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <option value="">
                — {brand ? t("allModels") : t("pickBrandFirst")} —
              </option>
              {models.map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {t("year")}
            </span>
            <select
              value={year === "" ? "" : String(year)}
              onChange={(e) => setYear(e.target.value === "" ? "" : Number(e.target.value))}
              disabled={!model}
              className={`mt-1.5 ${selectBase} disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <option value="">
                — {model ? t("allYears") : t("pickModelFirst")} —
              </option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {t("version")}
            </span>
            <select
              value={versionId}
              onChange={(e) => setVersionId(e.target.value)}
              disabled={year === ""}
              className={`mt-1.5 ${selectBase} disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <option value="">
                — {year !== "" ? t("allVersions") : t("pickYearFirst")} —
              </option>
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  {versionLabel(v, locale)}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Puces années — style Caradisiac */}
        {model && years.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-zinc-900">{t("pickYearTitle")}</p>
            <div className="flex flex-wrap gap-2">
              {years.map((y) => {
                const active = year === y;
                return (
                  <button
                    key={y}
                    type="button"
                    onClick={() => setYear(y)}
                    className={`rounded-lg border px-4 py-2 text-sm font-semibold tabular-nums transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 ${
                      active
                        ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                        : "border-zinc-300 bg-white text-zinc-800 hover:border-zinc-400 hover:bg-zinc-50"
                    }`}
                  >
                    {y}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Aperçu fiche sélectionnée */}
        {selectedCar ? (
          <SelectedCarPreview car={selectedCar} locale={locale} onOpen={goToFiche} />
        ) : null}
      </Card>

      {/* Accès rapide — style Caradisiac */}
      {quickAccess.length > 0 ? (
        <section className="space-y-4">
          <header className="flex items-center gap-3">
            <span className="h-9 w-1 shrink-0 rounded-full bg-rose-600" aria-hidden />
            <div>
              <h2 className="text-lg font-bold tracking-tight text-zinc-900 sm:text-xl">
                {t("quickAccessTitle")}
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500">{t("quickAccessHint")}</p>
            </div>
          </header>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {quickAccess.map((q) => (
              <li key={`${q.brand}-${q.model}`}>
                <button
                  type="button"
                  onClick={() => {
                    setBrand(q.brand);
                    setModel(q.model);
                    setYear("");
                    setVersionId("");
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-start text-sm text-zinc-800 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-900 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                >
                  <span className="truncate">
                    <span className="font-semibold">{q.brandLbl}</span>{" "}
                    <span className="text-zinc-700">{q.modelLbl}</span>
                  </span>
                  <span className="shrink-0 text-[11px] font-semibold text-zinc-400">→</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Vue exhaustive — toutes marques, tous modèles, toutes années */}
      {brandTree.length > 0 ? (
        <section className="space-y-5">
          <header className="flex items-center gap-3">
            <span className="h-9 w-1 shrink-0 rounded-full bg-rose-600" aria-hidden />
            <div>
              <h2 className="text-lg font-bold tracking-tight text-zinc-900 sm:text-xl">
                {t("allFichesTitle")}
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500">{t("allFichesHint")}</p>
            </div>
          </header>

          <nav aria-label={t("allFichesNavAria")} className="-mx-1 flex flex-wrap gap-2 px-1">
            {brandTree.map((b) => (
              <a
                key={b.brandKey}
                href={`#brand-${encodeURIComponent(b.brandKey)}`}
                className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700 transition hover:border-emerald-300 hover:text-emerald-800"
              >
                {b.brandLbl}
              </a>
            ))}
          </nav>

          <div className="grid gap-4 sm:grid-cols-2">
            {brandTree.map((b) => (
              <article
                key={b.brandKey}
                id={`brand-${encodeURIComponent(b.brandKey)}`}
                className="scroll-mt-24 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm ring-1 ring-zinc-100"
              >
                <h3 className="text-base font-bold text-zinc-900">{b.brandLbl}</h3>
                <p className="mt-0.5 text-[11px] uppercase tracking-wider text-zinc-400">
                  {t("modelsCountChip", { n: b.models.length })}
                </p>
                <ul className="mt-4 space-y-3">
                  {b.models.map((m) => (
                    <li
                      key={m.modelKey}
                      className="rounded-xl border border-zinc-100 bg-zinc-50/60 px-3 py-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setBrand(b.brandKey);
                            setModel(m.modelKey);
                            setYear("");
                            setVersionId("");
                            if (typeof window !== "undefined") {
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }
                          }}
                          className="text-sm font-semibold text-zinc-900 underline-offset-2 hover:text-emerald-800 hover:underline"
                        >
                          {m.modelLbl}
                        </button>
                        <span className="text-[10px] uppercase tracking-wider text-zinc-400">
                          {t("yearsCountChip", { n: m.years.length })}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {m.years.map((y) => (
                          <button
                            key={y}
                            type="button"
                            onClick={() => pickFromTree(b.brandKey, m.modelKey, y)}
                            className="rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-semibold tabular-nums text-zinc-800 transition hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                          >
                            {y}
                          </button>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function SelectedCarPreview({
  car,
  locale,
  onOpen,
}: {
  car: FichesCar;
  locale: "ar" | "fr";
  onOpen: () => void;
}) {
  const t = useTranslations("fiches");
  const img = firstImage(car);
  const brand = brandLabel(car, locale);
  const model = modelLabel(car, locale);
  const version = versionLabel(car, locale);
  const nf = locale === "ar" ? "ar-MA" : "fr-FR";

  return (
    <div className="motion-safe:animate-compare-rise grid gap-5 rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/60 via-white to-white p-4 ring-1 ring-emerald-100 sm:grid-cols-[minmax(0,1fr)_minmax(220px,260px)] sm:p-5">
      <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-zinc-100">
        {img ? (
          <Image
            src={img}
            alt=""
            fill
            unoptimized
            className="object-cover"
            sizes="(max-width:768px) 100vw, 50vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl font-bold text-zinc-300">
            {brand.slice(0, 2)}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
          {car.year}
        </p>
        <h3 className="text-xl font-bold leading-tight text-zinc-900">
          {brand} {model}
        </h3>
        <p className="text-sm text-zinc-700">{version}</p>
        <div className="flex flex-wrap gap-2">
          <Badge tone="neutral">{car.bodyType}</Badge>
          <Badge tone="neutral">{car.fuel}</Badge>
          <Badge tone="neutral">{car.transmission}</Badge>
        </div>
        <p className="text-base font-bold tabular-nums text-zinc-900">
          {car.priceNewEst.toLocaleString(nf)}{" "}
          <span className="text-xs font-medium text-zinc-500">MAD</span>
        </p>
        <div className="mt-auto flex flex-wrap gap-2 pt-2">
          <button type="button" onClick={onOpen} className={`${btnPrimary} flex-1`}>
            {t("openSheet")}
          </button>
          <Link
            href={`/compare?a=${car.id}`}
            className="inline-flex items-center justify-center rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:border-zinc-400 hover:bg-zinc-50"
          >
            {t("compareCta")}
          </Link>
        </div>
      </div>
    </div>
  );
}
