import type { RefBody } from "./catalog-reference-brands";

export type CatalogFuel = "PETROL" | "DIESEL" | "HYBRID" | "ELECTRIC";

export type VersionDef = { versionFr: string; versionAr: string; fuel: CatalogFuel };

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Véhicules 100 % ou quasi électriques : pas de variante diesel fictive. */
export function isEvOnlyCatalog(brandFr: string, modelFr: string): boolean {
  if (brandFr === "Tesla") return true;
  const m = modelFr.trim();
  if (/^model\s+[3sxy]/i.test(m) || m === "Cybertruck") return true;
  if (m === "ID.4") return true;
  if (m === "Zoe") return true;
  if (m === "EQ1" || m === "EV5" || m === "EV6") return true;
  if (m === "e-tron") return true;
  if (m === "Taycan") return true;
  if (brandFr === "Mercedes" && /^EQ[A-Z]/i.test(m)) return true;
  if (/^i[457]$/i.test(m) || m === "iX") return true;
  if (m === "EX30") return true;
  if (brandFr === "Cupra" && m === "Born") return true;
  if (brandFr === "BYD") return true;
  return false;
}

function dieselUnlikely(modelFr: string, body: RefBody): boolean {
  if (/911|718|Roma|F8|SF90|Huracan|Revuelto|Continental|Flying Spur|Ghost|Phantom|MX-5|Z4/i.test(modelFr)) return true;
  if (body === "CITY_CAR" && /108|Aygo|C1|Alto|i10|Picanto|Spark|EQ1/i.test(modelFr)) return true;
  return false;
}

function hybridLikely(brandFr: string, modelFr: string, body: RefBody): boolean {
  if (/Prius|Corolla|Yaris|Camry|RAV4|C-HR|3008|2008|5008|Kuga|Tucson|Sportage|Outlander|X-Trail|CR-V|HR-V|Captur|Clio|Eclipse/i.test(modelFr)) return true;
  if (body === "SUV" && /NX|RX|LX|XC\d|Defender|Discovery|Touareg|Tiguan|T-Roc/i.test(modelFr)) return true;
  if (brandFr === "Toyota" && body !== "PICKUP" && !/Hilux|Land Cruiser|Prado|Fortuner/i.test(modelFr) && hashStr(modelFr) % 3 === 0)
    return true;
  return false;
}

function petrolVersionLabel(brandFr: string, modelFr: string, body: RefBody): string {
  const h = hashStr(`${brandFr}|${modelFr}`) % 7;
  if (body === "PICKUP") return ["2.4 MPI", "2.7 Essence", "3.5 V6"][h % 3];
  if (body === "COMMERCIAL") return ["1.5 BlueHDi 100", "2.0 TDI 122", "1.6 HDi 90"][h % 3];
  const labels = [
    "PureTech / TSI 110–130 ch",
    "TCe / EcoBoost 100–125 ch",
    "1.6 MPI / 1.5 NA 110 ch",
    "2.0 Skyactiv-G 150 ch",
    "1.2 T / 1.0 T 115 ch",
    "2.5 NA 180 ch",
    "1.4 T-Jet / 1.4 Turbo 140 ch",
  ];
  return labels[h];
}

function dieselVersionLabel(brandFr: string, body: RefBody): string {
  const h = hashStr(brandFr + body) % 5;
  const labels = [
    "BlueHDi / dCi 1.5 — 115 ch",
    "2.0 TDI 150 ch",
    "1.6 dCi 130 ch",
    "2.2 D 150 ch",
    "1.5 CRDi 115 ch",
  ];
  return body === "PICKUP" ? ["2.4 D-4D", "2.2 D", "3.0 dCi V6"][h % 3] : labels[h];
}

/** Plusieurs motorisations par modèle (essence / diesel / hybride selon pertinence). */
export function expandMotorizations(brandFr: string, modelFr: string, body: RefBody): VersionDef[] {
  if (isEvOnlyCatalog(brandFr, modelFr)) {
    return [
      { versionFr: "Longue autonomie", versionAr: "بطارية كبرى", fuel: "ELECTRIC" },
      { versionFr: "Propulsion / propulsion intégrale", versionAr: "دفع خلفي أو رباعي", fuel: "ELECTRIC" },
    ];
  }

  if (/Ferrari|Lamborghini|Bentley|Rolls-Royce/i.test(brandFr)) {
    return [
      { versionFr: "V8 Biturbo (indicatif catalogue)", versionAr: "V8 توربو", fuel: "PETROL" },
      { versionFr: "Configuration haute performance", versionAr: "نسخة أداء", fuel: "PETROL" },
    ];
  }
  if (brandFr === "Porsche" && (modelFr === "911" || modelFr.includes("718"))) {
    return [
      { versionFr: "Flat-6 atmosphérique / S", versionAr: "بوكسر 6", fuel: "PETROL" },
      { versionFr: "Turbo / GTS (indicatif)", versionAr: "توربو", fuel: "PETROL" },
    ];
  }
  if (brandFr === "Porsche") {
    return [
      { versionFr: "Essence turbo V6/V8 (indicatif)", versionAr: "بنزين توربو", fuel: "PETROL" },
      { versionFr: "Diesel / TDI (si disponible selon millésime)", versionAr: "ديزل حسب التوفر", fuel: "DIESEL" },
    ];
  }

  const out: VersionDef[] = [
    { versionFr: petrolVersionLabel(brandFr, modelFr, body), versionAr: "نسخة بنزين", fuel: "PETROL" },
  ];

  if (!dieselUnlikely(modelFr, body)) {
    out.push({ versionFr: dieselVersionLabel(brandFr, body), versionAr: "نسخة ديزل", fuel: "DIESEL" });
  }

  if (hybridLikely(brandFr, modelFr, body) && out.length < 4) {
    out.push({ versionFr: "Hybride / e-HEV / rechargeable (indicatif)", versionAr: "هايبريد", fuel: "HYBRID" });
  }

  return out;
}

const TIER_BODY_BASE: Record<number, Record<RefBody, number>> = {
  0: { CITY_CAR: 118000, SEDAN: 132000, SUV: 172000, FAMILY: 142000, COMMERCIAL: 138000, PICKUP: 205000 },
  1: { CITY_CAR: 162000, SEDAN: 192000, SUV: 248000, FAMILY: 208000, COMMERCIAL: 168000, PICKUP: 258000 },
  2: { CITY_CAR: 198000, SEDAN: 232000, SUV: 305000, FAMILY: 268000, COMMERCIAL: 208000, PICKUP: 298000 },
  3: { CITY_CAR: 305000, SEDAN: 365000, SUV: 405000, FAMILY: 385000, COMMERCIAL: 328000, PICKUP: 365000 },
  4: { CITY_CAR: 580000, SEDAN: 1450000, SUV: 980000, FAMILY: 1650000, COMMERCIAL: 520000, PICKUP: 880000 },
};

export function indicativeBasePrice(tier: number, body: RefBody, brandFr: string, modelFr: string): number {
  const t = TIER_BODY_BASE[Math.min(4, Math.max(0, tier))] ?? TIER_BODY_BASE[1];
  const base = t[body] ?? t.SEDAN;
  const jitter = hashStr(`${brandFr}|${modelFr}`) % 22000;
  return base + jitter;
}

export function segmentLengthRangeBody(body: RefBody): string {
  switch (body) {
    case "CITY_CAR":
      return "3.95–4.15";
    case "SEDAN":
      return "4.55–4.90";
    case "SUV":
      return "4.35–4.95";
    case "PICKUP":
      return "5.25–5.50";
    case "COMMERCIAL":
      return "4.75–6.95";
    default:
      return "4.25–4.75";
  }
}

/** Paragraphe FR additionnel pour allonger la « grande fiche » (données indicatives). */
export function technicalHighlightsFr(
  brandFr: string,
  modelFr: string,
  body: RefBody,
  versionFr: string,
  fuel: CatalogFuel,
): string {
  const lr = segmentLengthRangeBody(body);
  const motor =
    fuel === "ELECTRIC"
      ? "motorisation 100 % électrique"
      : fuel === "DIESEL"
        ? "motorisation diesel"
        : fuel === "HYBRID"
          ? "motorisation hybride rechargeable ou non selon millésime"
          : "motorisation essence";
  return `Fiche technique indicative : ${motor}, finition « ${versionFr} », gabarit type segment ${body} (longueur d’ordre ${lr} m selon concurrents du segment). Consommations / CO₂ / équipements : varient fortement selon finition et année modèle — toujours recouper avec la fiche constructeur ${brandFr} et l’homologation locale.`;
}

export function technicalHighlightsAr(modelAr: string, body: RefBody, versionAr: string, fuel: CatalogFuel): string {
  const fuelAr =
    fuel === "ELECTRIC" ? "كهرباء" : fuel === "DIESEL" ? "ديزل" : fuel === "HYBRID" ? "هايبريد" : "بنزين";
  return `ملخص تقني إرشادي: ${fuelAr}، النسخة « ${versionAr} »، فئة الهيكل ${body} للمركبة ${modelAr}. الأبعاد والاستهلاك والتجهيزات تختلف حسب السنة والفئة — يُرجى التأكد من الوكيل أو المستورد.`;
}

export function usageTags(body: RefBody, modelFr: string): string[] {
  const m = modelFr.toLowerCase();
  const set = new Set<string>(["LONG_TRIP"]);
  if (body === "CITY_CAR" || body === "SEDAN") set.add("CITY");
  if (body === "SUV" || body === "FAMILY") set.add("FAMILY");
  if (body === "COMMERCIAL" || body === "PICKUP") set.add("PROFESSIONAL");
  if (/logan|corolla|sentra|sunny|accent|dokker|partner|berlingo/i.test(m)) set.add("TAXI");
  if (body === "CITY_CAR") set.add("STUDENT");
  return [...set].slice(0, 5);
}

export function buildRichSpecs(args: {
  idx: number;
  brandFr: string;
  modelFr: string;
  body: RefBody;
  fuel: CatalogFuel;
  versionFr: string;
  versionAr: string;
}): Record<string, unknown> {
  const { idx, brandFr, modelFr, body, fuel, versionFr, versionAr } = args;
  const kw = 55 + (idx % 11) * 12 + (fuel === "ELECTRIC" ? 35 : 0);
  const fiscal = Math.min(14, 4 + (idx % 8) + (body === "SUV" ? 1 : 0));
  const cons =
    fuel === "ELECTRIC"
      ? null
      : fuel === "DIESEL"
        ? 4.8 + (idx % 5) * 0.18
        : fuel === "HYBRID"
          ? 4.9 + (idx % 4) * 0.15
          : 6.2 + (idx % 6) * 0.14;
  const co2 =
    fuel === "ELECTRIC" ? undefined : fuel === "DIESEL" ? 118 + (idx % 35) : fuel === "HYBRID" ? 102 + (idx % 28) : 132 + (idx % 40);
  const torque = fuel === "ELECTRIC" ? 280 + (idx % 12) * 30 : 220 + (idx % 70) * 4;
  const trunk =
    body === "PICKUP"
      ? 0
      : body === "SUV"
        ? 410 + (idx % 8) * 22
        : body === "CITY_CAR"
          ? 280 + (idx % 5) * 18
          : body === "COMMERCIAL"
            ? 650 + (idx % 6) * 40
            : 460 + (idx % 7) * 25;
  const seats = body === "COMMERCIAL" && /Partner|Berlingo|Kangoo|Combo|Dokker/i.test(modelFr) ? 5 : 5;
  const lengthM =
    body === "CITY_CAR"
      ? "3.95–4.15"
      : body === "SEDAN"
        ? "4.55–4.85"
        : body === "SUV"
          ? "4.35–4.95"
          : body === "PICKUP"
            ? "5.25–5.45"
            : body === "COMMERCIAL"
              ? "4.75–6.95"
              : "4.25–4.75";

  const engineFr =
    fuel === "DIESEL"
      ? `Diesel — ${versionFr} (cylindrée / puissance indicatives catalogue démo).`
      : fuel === "HYBRID"
        ? `Hybride essence-électrique — ${versionFr}.`
        : fuel === "ELECTRIC"
          ? `100 % électrique — ${versionFr} (kW indicatifs).`
          : `Essence — ${versionFr} (turbo / atmo selon génération).`;

  const engineAr =
    fuel === "DIESEL"
      ? `ديزل — ${versionAr} (أرقام إرشادية للعرض فقط).`
      : fuel === "HYBRID"
        ? `هايبريد بنزين-كهرباء — ${versionAr}.`
        : fuel === "ELECTRIC"
          ? `كهرباء بالكامل — ${versionAr}.`
          : `بنزين — ${versionAr}.`;

  const dimsAr = `طول تقريبي ${lengthM} م، عرض وارتفاع وقاعدة العجلات حسب النسخة (إرشادي — راجع الوكيل).`;
  const bodyFr =
    body === "CITY_CAR"
      ? "citadine"
      : body === "SEDAN"
        ? "berline"
        : body === "SUV"
          ? "SUV"
          : body === "PICKUP"
            ? "pick-up"
            : body === "COMMERCIAL"
              ? "utilitaire"
              : "familiale";
  const dimsFr = `Longueur indicative env. ${lengthM} m — largeur, hauteur et empattement selon finition (indicatif, à confirmer chez le concessionnaire).`;
  const partsAr = idx % 3 === 0 ? "ممتازة في الدار البيضاء والرباط" : "جيدة في المدن الكبرى";
  const partsFr =
    idx % 3 === 0
      ? "Excellente disponibilité à Casablanca et Rabat"
      : "Bonne disponibilité dans les grandes villes";

  return {
    engineFr,
    engineAr,
    fiscalPower: fiscal,
    realPowerKw: kw,
    ...(cons != null ? { consumptionL100: Math.round(cons * 10) / 10 } : {}),
    dimensionsAr: dimsAr,
    dimensionsFr: dimsFr,
    seats,
    trunkL: trunk,
    safetyAr: `وسائد هوائية أمامية وجانبية حسب التجهيز، ABS، ESP، مساعدة فرملة. ملخص فئة ${body}.`,
    safetyFr: `Airbags avant/latéraux selon finition, ABS, ESP, aide au freinage. Synthèse segment ${bodyFr}.`,
    comfortAr: `مكيف يدوي أو أوتوماتيك، USB/بلوتوث، شاشة وسائط حسب الفئة، مقاعد قماش أو جلد جزئي.`,
    comfortFr: `Climatisation manuelle ou automatique, USB/Bluetooth, écran multimédia selon finition, sièges tissu ou cuir partiel.`,
    warrantyAr: `ضمان الوكيل أو المستورد حسب العلامة — يُؤكد عند الشراء.`,
    warrantyFr: `Garantie concessionnaire ou importateur selon la marque — à confirmer à l'achat.`,
    maintenanceCostEst: 2800 + (idx % 10) * 420,
    partsAvailabilityAr: partsAr,
    partsAvailabilityFr: partsFr,
    reliabilityScore: 70 + (idx % 22),
    resaleScore: 68 + (idx % 24),
    comfortScore: 66 + (idx % 26),
    globalScore: 72 + (idx % 20),
    ...(co2 != null ? { co2Gkm: co2 } : {}),
    torqueNm: torque,
    groundClearanceMm:
      body === "SUV" || body === "PICKUP"
        ? 175 + (idx % 8) * 10
        : body === "CITY_CAR"
          ? 118 + (idx % 5) * 8
          : 135 + (idx % 6) * 7,
  };
}
