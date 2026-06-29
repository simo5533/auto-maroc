import { z } from "zod";

export const ficheEquipementBlockSchema = z.object({
  androidAuto: z.boolean(),
  bluetooth: z.boolean(),
  gps: z.boolean(),
  panoramicRoof: z.boolean(),
  electricSeats: z.boolean(),
  keylessEntry: z.boolean(),
  lighting: z.enum(["HALOGEN", "LED", "MATRIX_LED"]),
  electric: z
    .object({
      batteryKwh: z.number(),
      chargeTimeHoursWallbox: z.number(),
      chargeTimeMinutesDcFast: z.number().optional(),
      chargerTypes: z.string().max(240),
      motorPowerKw: z.number(),
    })
    .optional(),
  commercial: z.object({
    pricePublicFr: z.string().max(1200),
    pricePublicAr: z.string().max(1200),
    warrantyMonths: z.number().int().min(0).max(120),
    warrantyFr: z.string().max(2000),
    warrantyAr: z.string().max(2000),
    availabilityFr: z.string().max(2000),
    availabilityAr: z.string().max(2000),
  }),
  consumptionMaintenance: z.object({
    fr: z.string().max(4000),
    ar: z.string().max(4000),
  }),
});

export type FicheEquipement = z.infer<typeof ficheEquipementBlockSchema>;

export function parseFicheEquipement(raw: unknown): FicheEquipement | null {
  const r = ficheEquipementBlockSchema.safeParse(raw);
  return r.success ? r.data : null;
}

type FuelLite = "PETROL" | "DIESEL" | "HYBRID" | "ELECTRIC";
type BodyLite = "CITY_CAR" | "SEDAN" | "SUV" | "COMMERCIAL" | "PICKUP" | "FAMILY";

function h(idx: number, salt: number): number {
  return Math.abs((idx * 17 + salt * 31) % 10);
}

/** Données démo cohérentes avec le segment (catalogue générateur / seed). */
export function buildDemoFicheEquipement(p: {
  idx: number;
  fuel: FuelLite;
  tier: number;
  body: BodyLite;
  brandFr: string;
  priceNewEst: number;
  consumptionL100?: number | null;
}): FicheEquipement {
  const { idx, fuel, tier, body, brandFr, priceNewEst, consumptionL100 } = p;

  const lighting: FicheEquipement["lighting"] =
    fuel === "ELECTRIC" && tier >= 2
      ? h(idx, 1) > 2
        ? "MATRIX_LED"
        : "LED"
      : tier >= 3
        ? h(idx, 2) > 4
          ? "MATRIX_LED"
          : "LED"
        : tier >= 1
          ? h(idx, 3) > 3
            ? "LED"
            : "HALOGEN"
          : h(idx, 4) > 5
            ? "LED"
            : "HALOGEN";

  const androidAuto = tier >= 1 ? h(idx, 5) !== 0 : h(idx, 5) > 2;
  const bluetooth = true;
  const gps = h(idx, 6) !== 0;
  const panoramicRoof = (body === "SUV" || body === "FAMILY") && tier >= 1 && h(idx, 7) > 3;
  const electricSeats = tier >= 3 || (tier >= 2 && (body === "SUV" || body === "SEDAN") && h(idx, 8) > 4);
  const keylessEntry = tier >= 2 && h(idx, 0) > 2;

  const warrantyMonths = tier >= 4 ? 24 : tier >= 3 ? 36 : tier >= 1 ? 24 : 24;

  const commercial: FicheEquipement["commercial"] = {
    pricePublicFr: `Prix public neuf indicatif : ${priceNewEst.toLocaleString("fr-FR")} MAD (hors promotion, malus éventuel et options — démo catalogue).`,
    pricePublicAr: `سعر جديد إرشادي: ${priceNewEst.toLocaleString("fr-FR")} درهم (بدون تخفيضات ولا رسوم إضافية ولا خيارات — عرض تجريبي).`,
    warrantyMonths,
    warrantyFr: `Garantie constructeur indicative ${warrantyMonths} mois (kilométrage plafonné selon conditions ${brandFr} — à confirmer sur le bon de commande / distributeur Maroc).`,
    warrantyAr: `ضمان إرشادي ${warrantyMonths} شهرًا (حد أقصى للكيلومترات حسب شروط ${brandFr} — يُؤكد عند الوكيل).`,
    availabilityFr:
      h(idx, 2) > 6
        ? `Délai indicatif : stock ou arrivage sous 2–6 semaines selon finition (Casablanca / Rabat — démo catalogue).`
        : `Disponibilité indicative : plusieurs unités ou commande usine selon couleur (grandes villes — démo catalogue).`,
    availabilityAr:
      h(idx, 2) > 6
        ? `مدة تسليم إرشادية: أسبوعان إلى ستة أسابيع حسب التجهيز (الدار البيضاء / الرباط — عرض تجريبي).`
        : `توفر إرشادي: وحدات أو طلب مصنع حسب اللون (مدن كبرى — عرض تجريبي).`,
  };

  const cons =
    consumptionL100 != null
      ? `${consumptionL100.toFixed(1)} L/100 km (ordre de grandeur catalogue démo).`
      : fuel === "ELECTRIC"
        ? `Consommation équivalente : à exprimer en kWh/100 km selon cycle WLTP (non renseigné ici — voir fiche constructeur).`
        : `Consommation : varie selon cycle et style de conduite (valeur indicatives catalogue démo).`;

  const consumptionMaintenance: FicheEquipement["consumptionMaintenance"] = {
    fr: `${cons} Entretien : révisions périodiques (filtres, huile, freins) ; coût annuel indicatif lié au segment et au réseau ${brandFr}. Prévoir pneumatiques et batterie 12V selon usage climat Maroc.`,
    ar: `${fuel === "ELECTRIC" ? "الاستهلاك يُقاس بـ kWh/100 كم حسب WLTP (راجع الوكيل)." : `استهلاك تقريبي مذكور أعلاه.`} الصيانة: فلاتر وزيت وفرامل دورية؛ تكلفة سنوية تقديرية حسب الشبكة وقطع الغيار. احسب الإطارات وبطارية 12 فولت مع مناخ المغرب.`,
  };

  const electric: FicheEquipement["electric"] =
    fuel === "ELECTRIC"
      ? {
          batteryKwh: Math.round(48 + h(idx, 3) * 8 + tier * 4),
          chargeTimeHoursWallbox: Math.round(6 + h(idx, 4) * 0.7),
          chargeTimeMinutesDcFast: 25 + h(idx, 5) * 6,
          chargerTypes: "Type 2 (AC monophasé / triphasé) — prise CCS Combo 2 (DC rapide)",
          motorPowerKw: Math.round(120 + h(idx, 1) * 18 + tier * 8),
        }
      : undefined;

  return ficheEquipementBlockSchema.parse({
    androidAuto,
    bluetooth,
    gps,
    panoramicRoof,
    electricSeats,
    keylessEntry,
    lighting,
    electric,
    commercial,
    consumptionMaintenance,
  });
}
