/**
 * Domaines web constructeurs (pour favicon / logo léger).
 * L’ancienne API publique Clearbit (logo.clearbit.com) n’est plus fiable — on utilise le service
 * de favicons Google basé sur le domaine (pas de clé API).
 */
const BRAND_WEB_DOMAIN: Record<string, string> = {
  Dacia: "dacia.com",
  Renault: "renault.com",
  Peugeot: "peugeot.com",
  Citroen: "citroen.com",
  DS: "dsautomobiles.com",
  Hyundai: "hyundai.com",
  Kia: "kia.com",
  Toyota: "toyota.com",
  Nissan: "nissan.com",
  Ford: "ford.com",
  Volkswagen: "vw.com",
  Fiat: "fiat.com",
  Skoda: "skoda-auto.com",
  Seat: "seat.com",
  Cupra: "cupraofficial.com",
  Mercedes: "mercedes-benz.com",
  BMW: "bmw.com",
  Audi: "audi.com",
  Suzuki: "suzuki.com",
  MG: "mgmotor.com",
  Haval: "haval.com",
  Opel: "opel.com",
  Mazda: "mazda.com",
  Honda: "honda.com",
  Mitsubishi: "mitsubishi-motors.com",
  "Great Wall": "gwm-global.com",
  GWM: "gwm-global.com",
  Changan: "changan.com.cn",
  Geely: "geely.com",
  BYD: "byd.com",
  Subaru: "subaru.com",
  Mini: "mini.com",
  Tesla: "tesla.com",
  Volvo: "volvocars.com",
  Jeep: "jeep.com",
  Chevrolet: "chevrolet.com",
  Isuzu: "isuzu.com",
  "Alfa Romeo": "alfaromeo.com",
  "Land Rover": "landrover.com",
  Lexus: "lexus.com",
  Chery: "cheryglobal.com",
  Tata: "tatamotors.com",
  ARO: "aro.ro",
  Lada: "lada.ru",
  Ferrari: "ferrari.com",
  Lamborghini: "lamborghini.com",
  Bentley: "bentleymotors.com",
  "Rolls-Royce": "rolls-roycemotorcars.com",
  Porsche: "porsche.com",
};

/** Sites constructeurs (pages nationales / globales — à vérifier). */
const OFFICIAL_SITE: Record<string, string> = {
  Dacia: "https://www.dacia.ma",
  Renault: "https://www.renault.ma",
  Peugeot: "https://www.peugeot.ma",
  Citroen: "https://www.citroen.ma",
  DS: "https://www.dsautomobiles.ma",
  Hyundai: "https://www.hyundai.com/ma",
  Kia: "https://www.kia.com/ma",
  Toyota: "https://www.toyota.ma",
  Nissan: "https://www.nissan.ma",
  Ford: "https://www.ford.ma",
  Volkswagen: "https://www.volkswagen.ma",
  Fiat: "https://www.fiat.com",
  Skoda: "https://www.skoda.ma",
  Seat: "https://www.seat.com",
  Cupra: "https://www.cupraofficial.com",
  Mercedes: "https://www.mercedes-benz.ma",
  BMW: "https://www.bmw.ma",
  Audi: "https://www.audi.ma",
  Suzuki: "https://www.globalsuzuki.com",
  MG: "https://www.mgmotor.com",
  Haval: "https://www.haval.com",
  Opel: "https://www.opel.ma",
  Mazda: "https://www.mazda.com",
  Honda: "https://www.honda.com",
  Mitsubishi: "https://www.mitsubishi-motors.com",
  "Great Wall": "https://www.gwm-global.com",
  GWM: "https://www.gwm-global.com",
  Changan: "https://www.changan.com.cn",
  Geely: "https://www.geely.com",
  BYD: "https://www.byd.com",
  Subaru: "https://www.subaru.com",
  Mini: "https://www.mini.com",
  Tesla: "https://www.tesla.com",
  Volvo: "https://www.volvocars.com",
  Jeep: "https://www.jeep.com",
  Chevrolet: "https://www.chevrolet.com",
  Isuzu: "https://www.isuzu.com",
  "Alfa Romeo": "https://www.alfaromeo.com",
  "Land Rover": "https://www.landrover.com",
  Lexus: "https://www.lexus.com",
  Chery: "https://www.chery.com",
  Tata: "https://www.tatamotors.com",
  ARO: "https://www.aro.ro",
  Lada: "https://www.lada.ru",
  Ferrari: "https://www.ferrari.com",
  Lamborghini: "https://www.lamborghini.com",
  Bentley: "https://www.bentleymotors.com",
  "Rolls-Royce": "https://www.rolls-roycemotorcars.com",
  Porsche: "https://www.porsche.com",
};

const LEGACY_CLEARBIT_HOST = "logo.clearbit.com";

/**
 * URL d’icône marque (favicon du site constructeur, via Google s2 — domaine listé dans BRAND_WEB_DOMAIN).
 */
export function buildBrandLogoUrl(brandFr: string): string | null {
  const domain = BRAND_WEB_DOMAIN[brandFr];
  if (!domain) return null;
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
}

/**
 * URL à afficher : garde une URL personnalisée en base, sinon reconstruit ;
 * ignore les anciennes URL Clearbit encore stockées.
 */
export function resolveBrandLogoUrl(
  brandFr: string | null | undefined,
  storedLogoUrl: string | null | undefined,
): string | null {
  if (storedLogoUrl && !storedLogoUrl.toLowerCase().includes(LEGACY_CLEARBIT_HOST)) {
    return storedLogoUrl;
  }
  if (brandFr) {
    return buildBrandLogoUrl(brandFr);
  }
  return null;
}

/** @deprecated Utiliser buildBrandLogoUrl ou resolveBrandLogoUrl. */
export function clearbitLogoUrl(brandFr: string): string | null {
  return buildBrandLogoUrl(brandFr);
}

export function officialBrandUrl(brandFr: string): string | null {
  return OFFICIAL_SITE[brandFr] ?? null;
}
