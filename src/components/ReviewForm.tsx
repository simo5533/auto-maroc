"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { btnPrimary, inputBase, selectBase } from "@/components/ui/styles";
import { carBrandLabel, carModelLabel } from "@/lib/locale-text";

export function ReviewForm({ locale }: { locale: "ar" | "fr" }) {
  const t = useTranslations("reviews");
  const [cars, setCars] = useState<{ id: string; label: string }[]>([]);
  const [carId, setCarId] = useState("");
  const [city, setCity] = useState("");
  const [mileageKm, setMileageKm] = useState("");
  const [usageMonths, setUsageMonths] = useState("");
  const [commentAr, setCommentAr] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const r = await fetch("/api/cars");
        const d = await r.json();
        if (cancelled) return;
        setCars(
          (d.cars as { id: string; brandAr: string; modelAr: string; brandFr?: string | null; modelFr?: string | null }[]).map((c) => ({
            id: c.id,
            label: `${carBrandLabel(c, locale)} ${carModelLabel(c, locale)}`,
          })),
        );
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
    setMsg(null);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        carId,
        city,
        mileageKm: mileageKm ? Number(mileageKm) : undefined,
        usageMonths: usageMonths ? Number(usageMonths) : undefined,
        globalNote: 4,
        commentAr,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(data.error === "auth" ? (locale === "ar" ? "سجّل الدخول أولاً" : "Connectez-vous d’abord.") : "Erreur");
      return;
    }
    setMsg(locale === "ar" ? "شكراً — سيظهر الرأي بعد المراجعة." : "Merci — modération requise.");
    setCommentAr("");
  }

  const lab = "block text-xs font-semibold uppercase tracking-wide text-zinc-500";

  return (
    <Card className="mb-10" padding="p-6 sm:p-8">
      <h2 className="text-lg font-bold text-zinc-900">{t("add")}</h2>
      <p className="mt-1 text-sm text-zinc-600">{t("pendingNote")}</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className={lab}>
          {t("carSelect")}
          <select value={carId} onChange={(e) => setCarId(e.target.value)} className={`mt-1.5 ${selectBase}`} required>
            <option value="">—</option>
            {cars.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className={lab}>
          {t("city")}
          <input value={city} onChange={(e) => setCity(e.target.value)} className={`mt-1.5 ${inputBase}`} required />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={lab}>
            {t("months")}
            <input value={usageMonths} onChange={(e) => setUsageMonths(e.target.value)} type="number" className={`mt-1.5 ${inputBase}`} />
          </label>
          <label className={lab}>
            {t("kms")}
            <input value={mileageKm} onChange={(e) => setMileageKm(e.target.value)} type="number" className={`mt-1.5 ${inputBase}`} />
          </label>
        </div>
        <label className={lab}>
          {t("comment")}
          <textarea
            value={commentAr}
            onChange={(e) => setCommentAr(e.target.value)}
            className={`mt-1.5 min-h-[120px] ${inputBase}`}
            required
            minLength={10}
          />
        </label>
        <button type="submit" className={btnPrimary}>
          {t("submit")}
        </button>
        {msg && <p className="rounded-xl bg-emerald-50/90 p-3 text-sm text-emerald-950 ring-1 ring-emerald-200">{msg}</p>}
      </form>
    </Card>
  );
}
