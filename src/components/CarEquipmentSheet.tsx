import { getTranslations } from "next-intl/server";
import type { FicheEquipement } from "@/lib/car-fiche-equipment";
import { Card } from "@/components/ui/Card";

function boolLabel(v: boolean, yes: string, no: string) {
  return v ? yes : no;
}

export async function CarEquipmentSheet({ fiche, locale }: { fiche: FicheEquipement; locale: string }) {
  const t = await getTranslations("car");
  const isAr = locale === "ar";

  const lightingLabel = (() => {
    if (fiche.lighting === "HALOGEN") return t("lightingHALOGEN");
    if (fiche.lighting === "LED") return t("lightingLED");
    return t("lightingMATRIX_LED");
  })();

  const rows = [
    { k: "androidAuto", v: boolLabel(fiche.androidAuto, t("yes"), t("no")) },
    { k: "bluetooth", v: boolLabel(fiche.bluetooth, t("yes"), t("no")) },
    { k: "gps", v: boolLabel(fiche.gps, t("yes"), t("no")) },
    { k: "panoramicRoof", v: boolLabel(fiche.panoramicRoof, t("yes"), t("no")) },
    { k: "electricSeats", v: boolLabel(fiche.electricSeats, t("yes"), t("no")) },
    { k: "keylessEntry", v: boolLabel(fiche.keylessEntry, t("yes"), t("no")) },
  ];

  return (
    <Card padding="p-5 sm:p-6 md:p-8" className="space-y-8 md:space-y-10">
      <h2 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">{t("ficheExtendedTitle")}</h2>

      <section className="space-y-4">
        <h3 className="text-base font-bold text-emerald-800 sm:text-lg">{t("ficheConnectivity")}</h3>
        <dl className="grid gap-3 text-base sm:grid-cols-2">
          {rows.map((row) => (
            <div key={row.k} className="flex justify-between gap-4 rounded-xl bg-zinc-50 px-4 py-3 ring-1 ring-zinc-100">
              <dt className="text-zinc-600">{t(row.k as "androidAuto")}</dt>
              <dd className="font-semibold text-zinc-900">{row.v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-bold text-emerald-800 sm:text-lg">💡 {t("ficheLighting")}</h3>
        <p className="rounded-xl bg-zinc-50 px-4 py-3 text-base font-semibold leading-relaxed text-zinc-900 ring-1 ring-zinc-100">
          {lightingLabel}
        </p>
      </section>

      {fiche.electric ? (
        <section className="space-y-4">
          <h3 className="text-base font-bold text-emerald-800 sm:text-lg">⚡ {t("ficheElectric")}</h3>
          <dl className="grid gap-3 text-base sm:grid-cols-2">
            <div className="flex justify-between gap-4 rounded-xl bg-zinc-50 px-4 py-3 ring-1 ring-zinc-100 sm:col-span-2">
              <dt className="text-zinc-600">{t("batteryCapacity")}</dt>
              <dd className="font-semibold text-zinc-900">{fiche.electric.batteryKwh} kWh</dd>
            </div>
            <div className="flex justify-between gap-4 rounded-xl bg-zinc-50 px-4 py-3 ring-1 ring-zinc-100 sm:col-span-2">
              <dt className="text-zinc-600">{t("chargeTimeWallbox")}</dt>
              <dd className="font-semibold text-zinc-900">~{fiche.electric.chargeTimeHoursWallbox} h (AC)</dd>
            </div>
            {fiche.electric.chargeTimeMinutesDcFast != null ? (
              <div className="flex justify-between gap-4 rounded-xl bg-zinc-50 px-4 py-3 ring-1 ring-zinc-100 sm:col-span-2">
                <dt className="text-zinc-600">{t("chargeTimeDc")}</dt>
                <dd className="font-semibold text-zinc-900">~{fiche.electric.chargeTimeMinutesDcFast} min (DC)</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4 rounded-xl bg-zinc-50 px-4 py-3 ring-1 ring-zinc-100 sm:col-span-2">
              <dt className="text-zinc-600">{t("chargerType")}</dt>
              <dd className="text-right text-base font-semibold text-zinc-900">{fiche.electric.chargerTypes}</dd>
            </div>
            <div className="flex justify-between gap-4 rounded-xl bg-zinc-50 px-4 py-3 ring-1 ring-zinc-100 sm:col-span-2">
              <dt className="text-zinc-600">{t("motorPowerEv")}</dt>
              <dd className="font-semibold text-zinc-900">{fiche.electric.motorPowerKw} kW</dd>
            </div>
          </dl>
        </section>
      ) : null}

      <section className="space-y-4">
        <h3 className="text-base font-bold text-emerald-800 sm:text-lg">💰 {t("ficheCommercial")}</h3>
        <p className="whitespace-pre-line rounded-xl bg-emerald-50/80 px-4 py-3 text-base leading-relaxed text-zinc-900 ring-1 ring-emerald-100">
          <span className="font-semibold text-emerald-900">{t("pricePublic")}</span>
          <br />
          {isAr ? fiche.commercial.pricePublicAr : fiche.commercial.pricePublicFr}
        </p>
        <p className="whitespace-pre-line rounded-xl bg-zinc-50 px-4 py-3 text-base leading-relaxed text-zinc-800 ring-1 ring-zinc-100">
          <span className="font-semibold text-zinc-900">{t("warranty")}</span> ({fiche.commercial.warrantyMonths}{" "}
          {t("monthsAbbr")})
          <br />
          {isAr ? fiche.commercial.warrantyAr : fiche.commercial.warrantyFr}
        </p>
        <p className="whitespace-pre-line rounded-xl bg-zinc-50 px-4 py-3 text-base leading-relaxed text-zinc-800 ring-1 ring-zinc-100">
          <span className="font-semibold text-zinc-900">{t("availability")}</span>
          <br />
          {isAr ? fiche.commercial.availabilityAr : fiche.commercial.availabilityFr}
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-bold text-emerald-800 sm:text-lg">{t("ficheConsumptionMaintenance")}</h3>
        <p className="whitespace-pre-line text-base leading-relaxed text-zinc-800">
          {isAr ? fiche.consumptionMaintenance.ar : fiche.consumptionMaintenance.fr}
        </p>
      </section>
    </Card>
  );
}
