"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { BodyType, FuelType, Transmission } from "@prisma/client";

export type CatalogBrandItem = {
  id: string;
  coverUrl: string | null;
  title: string;
  versionLabel: string;
  bodyType: BodyType;
  fuel: FuelType;
  transmission: Transmission;
  priceNewEst: number;
  globalScore: number | null;
  showroomUrl: string | null;
  photoCount: number;
};

const BODY_ORDER: BodyType[] = ["SUV", "SEDAN", "CITY_CAR", "FAMILY", "COMMERCIAL", "PICKUP"];

const FUEL_ORDER: FuelType[] = ["ELECTRIC", "HYBRID", "PETROL", "DIESEL"];

function bodyChipLabel(t: (key: string) => string, b: BodyType): string {
  const map: Record<BodyType, string> = {
    SUV: "brandBodySUV",
    SEDAN: "brandBodySEDAN",
    CITY_CAR: "brandBodyCITY_CAR",
    FAMILY: "brandBodyFAMILY",
    COMMERCIAL: "brandBodyCOMMERCIAL",
    PICKUP: "brandBodyPICKUP",
  };
  return t(map[b]);
}

function fuelChipLabel(t: (key: string) => string, f: FuelType): string {
  const map: Record<FuelType, string> = {
    ELECTRIC: "brandFuelELECTRIC",
    HYBRID: "brandFuelHYBRID",
    PETROL: "brandFuelPETROL",
    DIESEL: "brandFuelDIESEL",
  };
  return t(map[f]);
}

function fuelBadgeClass(f: FuelType): string {
  switch (f) {
    case "ELECTRIC":
      return "border-blue-200 bg-blue-50 text-blue-800";
    case "HYBRID":
      return "border-violet-200 bg-violet-50 text-violet-900";
    case "DIESEL":
      return "border-zinc-200 bg-zinc-100 text-zinc-800";
    default:
      return "border-zinc-200 bg-white text-zinc-700";
  }
}

export function CatalogBrandSection({
  brandLabel,
  logoUrl,
  officialUrl,
  locale,
  items,
}: {
  brandLabel: string;
  logoUrl: string | null;
  officialUrl: string | null;
  locale: string;
  items: CatalogBrandItem[];
}) {
  const t = useTranslations("catalog");
  const [bodySel, setBodySel] = useState<BodyType | null>(null);
  const [fuelSel, setFuelSel] = useState<FuelType | null>(null);

  const bodiesPresent = useMemo(() => {
    const s = new Set(items.map((i) => i.bodyType));
    return BODY_ORDER.filter((b) => s.has(b));
  }, [items]);

  const fuelsPresent = useMemo(() => {
    const s = new Set(items.map((i) => i.fuel));
    return FUEL_ORDER.filter((f) => s.has(f));
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (bodySel && i.bodyType !== bodySel) return false;
      if (fuelSel && i.fuel !== fuelSel) return false;
      return true;
    });
  }, [items, bodySel, fuelSel]);

  const nf = locale === "ar" ? "ar-MA" : "fr-FR";

  return (
    <section className="scroll-mt-24">
      <div className="overflow-hidden rounded-3xl border border-zinc-200/90 bg-white shadow-[0_4px_24px_-8px_rgba(15,23,42,0.12)] ring-1 ring-zinc-100">
        <header className="flex flex-wrap items-center gap-4 border-b border-zinc-100 bg-gradient-to-r from-white to-zinc-50/80 px-5 py-5 sm:px-8">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200/90">
            {logoUrl ? (
              <Image src={logoUrl} alt="" width={56} height={56} className="object-contain p-2" unoptimized />
            ) : (
              <span className="text-xl font-bold tracking-tight text-zinc-400">{brandLabel.slice(0, 1)}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">{brandLabel}</h2>
            <p className="mt-1 text-sm text-zinc-500">
              {t("modelsCount", { n: items.length })}
              {officialUrl ? (
                <>
                  {" · "}
                  <a
                    href={officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-[#1c69d4] underline-offset-2 hover:underline"
                  >
                    {t("officialSite")}
                  </a>
                </>
              ) : null}
            </p>
          </div>
        </header>

        <div className="grid gap-0 lg:grid-cols-[minmax(220px,260px)_1fr] lg:gap-0">
          <aside className="border-b border-zinc-100 bg-zinc-50/50 p-5 lg:border-b-0 lg:border-e lg:border-zinc-100 lg:p-6">
            <div className="space-y-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">{t("brandFilterBody")}</p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setBodySel(null)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      bodySel === null
                        ? "bg-zinc-900 text-white shadow-sm"
                        : "border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                    }`}
                  >
                    {t("brandFilterAll")}
                  </button>
                  {bodiesPresent.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBodySel(bodySel === b ? null : b)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        bodySel === b
                          ? "bg-zinc-900 text-white shadow-sm"
                          : "border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                      }`}
                    >
                      {bodyChipLabel(t, b)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">{t("brandFilterFuel")}</p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setFuelSel(null)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      fuelSel === null
                        ? "bg-zinc-900 text-white shadow-sm"
                        : "border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                    }`}
                  >
                    {t("brandFilterAll")}
                  </button>
                  {fuelsPresent.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFuelSel(fuelSel === f ? null : f)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        fuelSel === f
                          ? "bg-zinc-900 text-white shadow-sm"
                          : `border bg-white hover:opacity-95 ${fuelBadgeClass(f)}`
                      }`}
                    >
                      {fuelChipLabel(t, f)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <div className="p-5 sm:p-8">
            <p className="mb-5 text-sm font-medium text-zinc-500">
              {t("brandShowing", { visible: filtered.length, total: items.length })}
            </p>
            {filtered.length === 0 ? (
              <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 px-4 py-8 text-center text-sm text-zinc-600">
                {t("brandNoMatch")}
              </p>
            ) : (
              <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((c) => (
                  <li key={c.id}>
                    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-sm ring-1 ring-zinc-100 transition hover:-translate-y-0.5 hover:shadow-lg">
                      <div className="relative aspect-[4/3] bg-gradient-to-b from-zinc-100 via-zinc-50 to-white">
                        <span className="absolute left-3 top-3 z-10 rounded-md bg-white/95 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-700 shadow-sm ring-1 ring-zinc-200/90">
                          {bodyChipLabel(t, c.bodyType)}
                        </span>
                        {c.coverUrl ? (
                          <Image
                            src={c.coverUrl}
                            alt=""
                            fill
                            unoptimized
                            className="object-contain p-5 transition duration-300 group-hover:scale-[1.02]"
                            sizes="(max-width:768px) 100vw, (max-width:1280px) 50vw, 33vw"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-zinc-300">
                            <span className="text-4xl font-light">—</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
                        <h3 className="text-xl font-semibold leading-tight tracking-tight text-zinc-950">{c.title}</h3>
                        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-zinc-400">{t("modelsSubtitle")}</p>
                        <p className="mt-2 text-xs text-zinc-500">{c.versionLabel}</p>
                        <p className="mt-4 text-lg font-semibold tabular-nums text-zinc-900">
                          {c.priceNewEst.toLocaleString(nf)}{" "}
                          <span className="text-sm font-normal text-zinc-500">MAD · {t("from")}</span>
                        </p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          <span
                            className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold ${fuelBadgeClass(c.fuel)}`}
                          >
                            {fuelChipLabel(t, c.fuel)}
                          </span>
                          <span className="inline-flex rounded-md border border-zinc-200 bg-white px-2 py-0.5 text-[11px] font-medium text-zinc-600">
                            {c.transmission === "AUTOMATIC" ? t("txAuto") : t("txManual")}
                          </span>
                          {c.globalScore != null ? (
                            <span className="inline-flex rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-900">
                              {t("scores")} {c.globalScore}
                            </span>
                          ) : null}
                        </div>
                        {c.photoCount > 1 ? (
                          <p className="mt-2 text-[11px] text-zinc-400">{t("photoCount", { n: c.photoCount })}</p>
                        ) : null}
                        {c.showroomUrl ? (
                          <a
                            href={c.showroomUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 text-xs font-semibold text-[#1c69d4] underline-offset-2 hover:underline"
                          >
                            {t("officialModelPage")}
                          </a>
                        ) : null}
                        <Link
                          href={`/cars/${c.id}`}
                          className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
                        >
                          {t("viewDetail")}
                        </Link>
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
