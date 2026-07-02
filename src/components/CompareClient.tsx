"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { btnPrimary, btnSecondary, inputBase, selectBase } from "@/components/ui/styles";
import { getCarCoverImageUrl } from "@/lib/car-images";
import { carBrandLabel, carModelLabel, carVersionLabel, pickLocaleText } from "@/lib/locale-text";

type CarOpt = { id: string; label: string };

type CompareCar = {
  id: string;
  brandAr: string;
  brandFr: string | null;
  modelAr: string;
  modelFr: string | null;
  versionAr: string;
  versionFr: string | null;
  year: number;
  priceNewEst: number;
  fuel: string;
  transmission: string;
  bodyType: string;
  imageUrl: string | null;
  imageUrls: unknown;
  brandLogoUrl: string | null;
  pros: string[];
  cons: string[];
  specs: {
    globalScore: number | null;
    reliabilityScore: number | null;
    resaleScore: number | null;
    comfortScore: number | null;
  } | null;
};

type CompareResponse = {
  cars: CompareCar[];
  conclusion: { winnerId: string; textAr: string; textFr: string };
};

function firstImage(c: CompareCar): string | null {
  return getCarCoverImageUrl(c);
}

function carLabel(c: CompareCar, locale: "ar" | "fr"): string {
  return `${carBrandLabel(c, locale)} ${carModelLabel(c, locale)} — ${carVersionLabel(c, locale)}`;
}

export function CompareClient({
  locale,
  preA,
  preB,
}: {
  locale: "ar" | "fr";
  preA: string;
  preB: string;
}) {
  const t = useTranslations("compare");
  const [cars, setCars] = useState<CarOpt[]>([]);
  const [a, setA] = useState(preA);
  const [b, setB] = useState(preB);
  const [budget, setBudget] = useState("");
  const [data, setData] = useState<CompareResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const r = await fetch("/api/cars");
        const d = await r.json();
        if (cancelled) return;
        const list = (
          d.cars as {
            id: string;
            brandAr: string;
            modelAr: string;
            brandFr?: string | null;
            modelFr?: string | null;
          }[]
        ).map((c) => ({
          id: c.id,
          label: `${carBrandLabel(c, locale)} ${carModelLabel(c, locale)}`,
        }));
        setCars(list);
      } catch {
        if (!cancelled) setCars([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [locale]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carIds: [a, b].filter(Boolean),
          budgetMAD: budget ? Number(budget) : undefined,
          locale,
        }),
      });
      const json = (await res.json()) as Partial<CompareResponse> & { error?: string };
      if (!res.ok || !json.cars || !json.conclusion) {
        throw new Error(json.error ?? "err");
      }
      setData(json as CompareResponse);
    } catch {
      setError(t("error"));
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setData(null);
    setError(null);
  }

  const lab = "block text-xs font-semibold uppercase tracking-wide text-zinc-500";

  return (
    <div className="mt-6 space-y-8">
      <Card className="max-w-xl" padding="p-6 sm:p-8">
        <form onSubmit={onSubmit} className="space-y-5">
          <label className={lab}>
            {t("vehicleA")}
            <select value={a} onChange={(e) => setA(e.target.value)} className={`mt-1.5 ${selectBase}`}>
              <option value="">—</option>
              {cars.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className={lab}>
            {t("vehicleB")}
            <select value={b} onChange={(e) => setB(e.target.value)} className={`mt-1.5 ${selectBase}`}>
              <option value="">—</option>
              {cars.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className={lab}>
            {t("budget")}
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className={`mt-1.5 ${inputBase}`}
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={loading || !a || !b || a === b}
              className={`${btnPrimary} flex-1 disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {loading ? "…" : t("submit")}
            </button>
            {data ? (
              <button type="button" onClick={reset} className={btnSecondary}>
                {t("reset")}
              </button>
            ) : null}
          </div>
          {error ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {error}
            </p>
          ) : null}
        </form>
      </Card>

      {data ? <CompareResult data={data} locale={locale} /> : null}
    </div>
  );
}

function CompareResult({ data, locale }: { data: CompareResponse; locale: "ar" | "fr" }) {
  const t = useTranslations("compare");
  const [carA, carB] = data.cars;
  if (!carA || !carB) return null;

  const winnerId = data.conclusion.winnerId;
  const conclusionText = pickLocaleText(locale, data.conclusion.textAr, data.conclusion.textFr);

  return (
    <section className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <CompareCarCard car={carA} locale={locale} isWinner={carA.id === winnerId} index={0} />
        <CompareCarCard car={carB} locale={locale} isWinner={carB.id === winnerId} index={1} />
      </div>

      <div
        className="animate-compare-rise rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/40 p-6 shadow-sm sm:p-8"
        style={{ animationDelay: "260ms" }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
          {t("result")}
        </p>
        <p className="mt-3 text-base leading-relaxed text-emerald-950 sm:text-lg">
          {conclusionText}
        </p>
      </div>
    </section>
  );
}

function CompareCarCard({
  car,
  locale,
  isWinner,
  index,
}: {
  car: CompareCar;
  locale: "ar" | "fr";
  isWinner: boolean;
  index: number;
}) {
  const t = useTranslations("compare");
  const img = firstImage(car);
  const label = carLabel(car, locale);

  return (
    <article
      className={`animate-compare-rise relative overflow-hidden rounded-3xl border bg-white shadow-sm transition-shadow hover:shadow-md ${
        isWinner
          ? "border-emerald-300/80 ring-2 ring-emerald-400/40"
          : "border-zinc-200"
      }`}
      style={{ animationDelay: `${index * 90}ms` }}
    >
      {isWinner ? (
        <div className="absolute end-4 top-4 z-10">
          <span className="animate-compare-pop inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-md">
            <span aria-hidden>★</span> {t("recommended")}
          </span>
        </div>
      ) : null}

      <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-zinc-100 via-white to-zinc-50 sm:h-52">
        {img ? (
          <Image
            src={img}
            alt=""
            fill
            unoptimized
            className="object-cover transition-transform duration-700 ease-out hover:scale-[1.03]"
            sizes="(max-width:1024px) 100vw, 50vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl font-bold text-zinc-300">
            {carBrandLabel(car, locale).slice(0, 2)}
          </div>
        )}
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            {car.year}
          </p>
          <h3 className="text-xl font-bold leading-tight text-zinc-900 sm:text-2xl">{label}</h3>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge tone="neutral">{car.bodyType}</Badge>
            <Badge tone="neutral">{car.fuel}</Badge>
            <Badge tone="neutral">{car.transmission}</Badge>
          </div>
        </header>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-zinc-50 p-3 ring-1 ring-zinc-100">
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              {t("priceNew")}
            </dt>
            <dd className="mt-1 text-base font-bold text-zinc-900">
              {car.priceNewEst.toLocaleString(locale === "ar" ? "ar-MA" : "fr-FR")} MAD
            </dd>
          </div>
          <div className="rounded-xl bg-emerald-50/60 p-3 ring-1 ring-emerald-100">
            <dt className="text-xs font-medium uppercase tracking-wide text-emerald-800">
              {t("globalScore")}
            </dt>
            <dd className="mt-1 text-base font-bold text-emerald-900">
              {car.specs?.globalScore ?? "—"}
              <span className="text-xs font-normal text-emerald-700">/100</span>
            </dd>
          </div>
        </dl>

        <ProsConsList items={car.pros} kind="pro" label={t("advantages")} />
        <ProsConsList items={car.cons} kind="con" label={t("drawbacks")} />
      </div>
    </article>
  );
}

function ProsConsList({
  items,
  kind,
  label,
}: {
  items: string[];
  kind: "pro" | "con";
  label: string;
}) {
  if (items.length === 0) return null;
  const isPro = kind === "pro";
  const tone = isPro
    ? "border-emerald-200/80 bg-emerald-50/60"
    : "border-amber-200/80 bg-amber-50/60";
  const headTone = isPro ? "text-emerald-800" : "text-amber-900";
  const iconTone = isPro
    ? "bg-emerald-600 text-white"
    : "bg-amber-500 text-white";
  const icon = isPro ? "✓" : "✕";

  return (
    <section className={`rounded-2xl border p-4 ${tone}`}>
      <h4 className={`text-xs font-bold uppercase tracking-[0.14em] ${headTone}`}>{label}</h4>
      <ul className="mt-3 space-y-2">
        {items.map((it, i) => (
          <li
            key={`${kind}-${i}`}
            className="animate-compare-pop flex items-start gap-3 text-sm leading-relaxed text-zinc-800"
            style={{ animationDelay: `${160 + i * 70}ms` }}
          >
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${iconTone}`}
              aria-hidden
            >
              {icon}
            </span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
