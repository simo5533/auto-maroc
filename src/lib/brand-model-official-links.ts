import { officialBrandUrl } from "@/lib/brand-assets";

/**
 * Slug pour chemins type « /models/clio » sur les sites constructeurs.
 * Les sites varient (langue, pays) : ces URLs sont des points d’entrée indicatifs vers la fiche / galerie modèle.
 */
export function slugifyModelForOemUrl(modelFr: string): string {
  return modelFr
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[.'’]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function bmwPath(slug: string): string {
  const s = slug.startsWith("bmw-") ? slug : `bmw-${slug}`;
  return `https://www.bmw.com/en/all-models/${s}.html`;
}

/**
 * Lien vitrine / galerie « modèle » sur le site du constructeur.
 * Ne télécharge pas les images automatiquement (droits, robots, structure HTML variables).
 */
export function officialModelShowroomUrl(
  brandFr: string | null | undefined,
  modelFr: string | null | undefined,
): string | null {
  if (!brandFr?.trim() || !modelFr?.trim()) return null;
  const slug = slugifyModelForOemUrl(modelFr);
  if (!slug) return null;

  switch (brandFr) {
    case "Alfa Romeo":
      return `https://www.alfaromeo.com/${slug}`;
    case "Tesla": {
      const compact = modelFr.toLowerCase().replace(/[\s._-]+/g, "");
      if (/^model/i.test(compact)) return `https://www.tesla.com/${compact}`;
      return `https://www.tesla.com/${slug.replace(/-/g, "")}`;
    }
    case "Dacia":
      return `https://www.dacia.com/gamme/dacia-${slug}.html`;
    case "Renault":
      return `https://www.renault.com/en/cars/${slug}/`;
    case "Peugeot":
      return `https://www.peugeot.com/en/cars/${slug}.html`;
    case "Citroen":
      return `https://www.citroen.com/en/cars/${slug}.html`;
    case "DS":
      return `https://www.dsautomobiles.com/en/models/${slug}.html`;
    case "Opel":
      return `https://www.opel.com/en/cars/${slug}.html`;
    case "Fiat":
      return `https://www.fiat.com/en/gamma/${slug}.html`;
    case "Jeep":
      return `https://www.jeep.com/${slug}.html`;
    case "Volkswagen":
      return `https://www.volkswagen.com/en/models/${slug}.html`;
    case "Audi":
      return `https://www.audi.com/en/models/${slug}/`;
    case "Skoda":
      return `https://www.skoda-auto.com/en/models/${slug}`;
    case "Seat":
      return `https://www.seat.com/en/models/${slug}.html`;
    case "Cupra":
      return `https://www.cupraofficial.com/en/cars/${slug}.html`;
    case "BMW":
      return bmwPath(slug);
    case "Mini":
      return `https://www.mini.com/en_MS/models/${slug}.html`;
    case "Mercedes": {
      const b = officialBrandUrl("Mercedes") ?? "https://www.mercedes-benz.com";
      return `${b.replace(/\/$/, "")}/models/${slug}.html`;
    }
    case "Toyota":
      return `https://www.toyota.com/models/${slug}`;
    case "Lexus":
      return `https://www.lexus.com/models/${slug}`;
    case "Honda":
      return `https://automobiles.honda.com/${slug}`;
    case "Nissan": {
      const b = officialBrandUrl("Nissan") ?? "https://www.nissan-global.com";
      return `${b.replace(/\/$/, "")}/vehicles/${slug}.html`;
    }
    case "Mazda":
      return `https://www.mazdausa.com/vehicles/${slug}`;
    case "Mitsubishi":
      return `https://www.mitsubishicars.com/models/${slug}`;
    case "Subaru":
      return `https://www.subaru.com/vehicles/${slug}.html`;
    case "Suzuki":
      return `https://www.globalsuzuki.com/global/automobile/${slug}.html`;
    case "Hyundai":
      return `https://www.hyundai.com/worldwide/en/cars/${slug}`;
    case "Kia":
      return `https://www.kia.com/us/en/cars/${slug}`;
    case "Ford":
      return `https://www.ford.com/cars/${slug}/`;
    case "Chevrolet":
      return `https://www.chevrolet.com/vehicles/${slug}`;
    case "Volvo":
      return `https://www.volvocars.com/us/cars/${slug}/`;
    case "Land Rover":
      return `https://www.landrover.com/vehicles/${slug}/index.html`;
    case "Porsche":
      return `https://www.porsche.com/international/models/${slug}/`;
    case "Ferrari":
      return `https://www.ferrari.com/en-en/auto/${slug}`;
    case "Lamborghini":
      return `https://www.lamborghini.com/en-en/models/${slug}`;
    case "Bentley":
      return `https://www.bentleymotors.com/en/models/${slug}`;
    case "Rolls-Royce":
      return `https://www.rolls-roycemotorcars.com/en_US/models/${slug}.html`;
    case "BYD": {
      const b = officialBrandUrl("BYD") ?? "https://www.byd.com";
      return `${b.replace(/\/$/, "")}/models/${slug}`;
    }
    case "Chery":
      return `https://www.cheryinternational.com/models/${slug}`;
    case "MG":
      return `https://www.mgmotor.com/en/vehicles/${slug}`;
    case "Haval":
      return `https://www.haval-global.com/models/${slug}`;
    case "Geely":
      return `https://www.geely.com/models/${slug}`;
    case "GWM":
    case "Great Wall":
      return `https://www.gwm-global.com/models/${slug}`;
    case "Changan":
      return `https://www.changan.com.cn/en/models/${slug}`;
    case "Tata":
      return `https://www.tatamotors.com/passenger-vehicles/${slug}`;
    case "Isuzu":
      return `https://www.isuzu.com/en/products/${slug}/`;
    case "ARO":
      return "https://www.aro.ro/";
    case "Lada":
      return `https://www.lada.ru/en/cars/${slug}`;
    default: {
      const base = officialBrandUrl(brandFr);
      if (!base) return null;
      return `${base.replace(/\/$/, "")}/models/${slug}`;
    }
  }
}
