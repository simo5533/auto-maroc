"use client";

import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { FormEvent, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { btnPrimary, btnSecondary, inputBase, selectBase } from "@/components/ui/styles";

type Props = {
  initial: Record<string, string>;
};

export function CatalogToolbar({ initial }: Props) {
  const t = useTranslations("catalog");
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState(initial.q ?? "");
  const [minPrice, setMinPrice] = useState(initial.minPrice ?? "");
  const [maxPrice, setMaxPrice] = useState(initial.maxPrice ?? "");
  const [fuel, setFuel] = useState(initial.fuel ?? "");
  const [transmission, setTransmission] = useState(initial.transmission ?? "");
  const [body, setBody] = useState(initial.body ?? "");
  const [condition, setCondition] = useState(initial.condition ?? "");
  const [usage, setUsage] = useState(initial.usage ?? "");
  const [brand, setBrand] = useState(initial.brand ?? "");

  const qs = useMemo(() => {
    const u = new URLSearchParams();
    if (q) u.set("q", q);
    if (minPrice) u.set("minPrice", minPrice);
    if (maxPrice) u.set("maxPrice", maxPrice);
    if (fuel) u.set("fuel", fuel);
    if (transmission) u.set("transmission", transmission);
    if (body) u.set("body", body);
    if (condition) u.set("condition", condition);
    if (usage) u.set("usage", usage);
    if (brand) u.set("brand", brand);
    const s = u.toString();
    return s ? `?${s}` : "";
  }, [q, minPrice, maxPrice, fuel, transmission, body, condition, usage, brand]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    router.push(`${pathname}${qs}`);
  }

  function reset() {
    setQ("");
    setMinPrice("");
    setMaxPrice("");
    setFuel("");
    setTransmission("");
    setBody("");
    setCondition("");
    setUsage("");
    setBrand("");
    router.push(pathname);
  }

  const labelClass = "block text-xs font-semibold uppercase tracking-wide text-zinc-500";

  return (
    <Card className="mt-6" padding="p-5 sm:p-6">
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="flex flex-col gap-1 border-b border-zinc-100 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">{t("filters")}</p>
            <p className="text-sm text-zinc-600">{t("subtitle")}</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className={labelClass}>
            {t("search")}
            <input value={q} onChange={(e) => setQ(e.target.value)} className={`mt-1.5 ${inputBase}`} />
          </label>
          <label className={labelClass}>
            {t("minPrice")}
            <input value={minPrice} onChange={(e) => setMinPrice(e.target.value)} type="number" className={`mt-1.5 ${inputBase}`} />
          </label>
          <label className={labelClass}>
            {t("maxPrice")}
            <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} type="number" className={`mt-1.5 ${inputBase}`} />
          </label>
          <label className={labelClass}>
            {t("fuel")}
            <select value={fuel} onChange={(e) => setFuel(e.target.value)} className={`mt-1.5 ${selectBase}`}>
              <option value="">—</option>
              <option value="PETROL">Essence / بنزين</option>
              <option value="DIESEL">Diesel / ديزل</option>
              <option value="HYBRID">Hybride</option>
              <option value="ELECTRIC">Électrique</option>
            </select>
          </label>
          <label className={labelClass}>
            {t("transmission")}
            <select value={transmission} onChange={(e) => setTransmission(e.target.value)} className={`mt-1.5 ${selectBase}`}>
              <option value="">—</option>
              <option value="MANUAL">Manuelle</option>
              <option value="AUTOMATIC">Automatique</option>
            </select>
          </label>
          <label className={labelClass}>
            {t("body")}
            <select value={body} onChange={(e) => setBody(e.target.value)} className={`mt-1.5 ${selectBase}`}>
              <option value="">—</option>
              <option value="CITY_CAR">Citadine</option>
              <option value="SEDAN">Berline</option>
              <option value="SUV">SUV</option>
              <option value="COMMERCIAL">Utilitaire</option>
              <option value="PICKUP">Pick-up</option>
              <option value="FAMILY">Familial</option>
            </select>
          </label>
          <label className={labelClass}>
            {t("condition")}
            <select value={condition} onChange={(e) => setCondition(e.target.value)} className={`mt-1.5 ${selectBase}`}>
              <option value="">—</option>
              <option value="NEW">Neuf</option>
              <option value="USED">Occasion</option>
            </select>
          </label>
          <label className={labelClass}>
            {t("usage")}
            <select value={usage} onChange={(e) => setUsage(e.target.value)} className={`mt-1.5 ${selectBase}`}>
              <option value="">—</option>
              <option value="CITY">Ville</option>
              <option value="FAMILY">Famille</option>
              <option value="TAXI">Taxi</option>
              <option value="PROFESSIONAL">Pro</option>
              <option value="LONG_TRIP">Long trajet</option>
              <option value="STUDENT">Étudiant</option>
            </select>
          </label>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <button type="submit" className={btnPrimary}>
            {t("apply")}
          </button>
          <button type="button" onClick={reset} className={btnSecondary}>
            {t("reset")}
          </button>
        </div>
      </form>
    </Card>
  );
}
