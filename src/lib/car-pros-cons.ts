import type { BodyType, FuelType, Transmission } from "@prisma/client";

/**
 * Catalogues d'avantages et d'inconvénients indicatifs par voiture.
 *
 * Utilisé par :
 *  - la fiche voiture (`src/app/[locale]/cars/[id]/page.tsx`) pour la section
 *    « Problèmes populaires signalés » (combine avis + cons).
 *  - la page de comparaison (`/api/compare` -> `CompareClient`) pour afficher
 *    les ✓ avantages / ✗ inconvénients propres à chaque véhicule.
 *
 * Sélection déterministe par `car.id` : une même voiture renvoie toujours les
 * mêmes points (pas d'aléa au refresh), tandis que deux voitures du même
 * segment auront des sélections différentes.
 */

export type CarLike = {
  id: string;
  fuel: FuelType;
  transmission: Transmission;
  bodyType: BodyType;
  priceNewEst: number;
  year: number;
  brandFr: string | null;
  brandAr: string;
  reliabilityScore?: number | null;
  resaleScore?: number | null;
  comfortScore?: number | null;
  consumptionL100?: number | null;
  maintenanceCostEst?: number | null;
};

type Def = {
  id: string;
  fr: string;
  ar: string;
  applies: (c: CarLike, currentYear: number) => boolean;
};

const NEGATIVE_CATALOG: Def[] = [
  {
    id: "diesel-noise",
    applies: (c) => c.fuel === "DIESEL",
    fr: "Vibrations et niveau sonore moteur plus marqués qu'un équivalent essence à froid",
    ar: "اهتزاز وضجيج المحرك أعلى من ما يقابله في البنزين، خاصةً على البارد",
  },
  {
    id: "diesel-injection",
    applies: (c) => c.fuel === "DIESEL",
    fr: "Coût d'entretien injecteurs / FAP / vanne EGR à surveiller sur kilométrage élevé",
    ar: "تكلفة صيانة البخاخات وفلتر الجزيئات وصمام EGR ترتفع مع الكيلومترات العالية",
  },
  {
    id: "petrol-tax",
    applies: (c) => c.fuel === "PETROL" && c.priceNewEst >= 200_000,
    fr: "Vignette / fiscalité parfois plus élevée selon la puissance fiscale du moteur essence",
    ar: "الرسوم والضرائب على محركات البنزين القوية قد ترتفع حسب القوة الجبائية",
  },
  {
    id: "hybrid-battery",
    applies: (c) => c.fuel === "HYBRID",
    fr: "Batterie hybride : remplacement coûteux après ~8–10 ans selon usage",
    ar: "بطارية الهجين: استبدالها مكلف بعد حوالي 8 إلى 10 سنوات حسب الاستعمال",
  },
  {
    id: "hybrid-specialist",
    applies: (c) => c.fuel === "HYBRID",
    fr: "Réparation hybride spécialisée moins répandue hors grandes villes (Casa, Rabat)",
    ar: "ورشات تصليح الهجين متخصصة وأقل انتشارًا خارج المدن الكبرى (الدار البيضاء، الرباط)",
  },
  {
    id: "ev-range",
    applies: (c) => c.fuel === "ELECTRIC",
    fr: "Autonomie réelle réduite par climatisation, autoroute et chaleur estivale",
    ar: "المدى الفعلي ينخفض مع المكيف والسرعات العالية وحرارة الصيف",
  },
  {
    id: "ev-charging",
    applies: (c) => c.fuel === "ELECTRIC",
    fr: "Maillage charge rapide DC encore inégal hors axes Casa–Rabat–Tanger–Marrakech",
    ar: "محطات الشحن السريع DC ما زالت متفاوتة خارج محور الدار البيضاء–الرباط–طنجة–مراكش",
  },
  {
    id: "ev-resale",
    applies: (c) => c.fuel === "ELECTRIC",
    fr: "Décote et revente plus incertaines (état batterie, marché VO en construction)",
    ar: "إعادة البيع والاستهلاك أقل وضوحًا (حالة البطارية وسوق المستعمل في طور النمو)",
  },
  {
    id: "city-trunk",
    applies: (c) => c.bodyType === "CITY_CAR",
    fr: "Coffre et habitabilité arrière limités pour les longs trajets en famille",
    ar: "الصندوق والمقاعد الخلفية محدودة في الرحلات العائلية الطويلة",
  },
  {
    id: "low-clearance",
    applies: (c) => c.bodyType === "CITY_CAR" || c.bodyType === "SEDAN",
    fr: "Garde au sol modeste : prudence avec les dos d'âne mal calibrés et bordures",
    ar: "ارتفاع الأرضية محدود: احذر من المطبات المرتفعة والأرصفة",
  },
  {
    id: "suv-consumption",
    applies: (c) => c.bodyType === "SUV" && c.fuel !== "ELECTRIC",
    fr: "Consommation et coût de pneumatiques plus élevés vs berline équivalente",
    ar: "استهلاك الوقود وتكلفة الإطارات أعلى مقارنةً بسيدان من نفس الفئة",
  },
  {
    id: "big-body-medina",
    applies: (c) => c.bodyType === "SUV" || c.bodyType === "PICKUP" || c.bodyType === "FAMILY",
    fr: "Manœuvres difficiles dans les ruelles d'anciennes médinas et parkings étroits",
    ar: "المناورات صعبة في أزقة المدن العتيقة ومواقف السيارات الضيقة",
  },
  {
    id: "family-image",
    applies: (c) => c.bodyType === "FAMILY",
    fr: "Image moins valorisante à la revente face aux SUV équivalents",
    ar: "الصورة أقل جاذبية عند إعادة البيع مقارنة بسيارات SUV المكافئة",
  },
  {
    id: "commercial-finish",
    applies: (c) => c.bodyType === "COMMERCIAL",
    fr: "Insonorisation et finition intérieure orientées usage utilitaire",
    ar: "العزل الصوتي والتشطيب الداخلي موجَّهان للاستعمال المهني",
  },
  {
    id: "pickup-empty",
    applies: (c) => c.bodyType === "PICKUP",
    fr: "Châssis ferme à vide : confort en retrait sans charge à l'arrière",
    ar: "الهيكل قاسٍ بدون حمولة: راحة أقل عندما يكون الصندوق فارغًا",
  },
  {
    id: "auto-repair",
    applies: (c) => c.transmission === "AUTOMATIC",
    fr: "Réparation boîte automatique plus coûteuse hors garantie qu'une boîte manuelle",
    ar: "إصلاح علبة السرعات الأوتوماتيكية أغلى من اليدوية خارج الضمان",
  },
  {
    id: "manual-traffic",
    applies: (c) => c.transmission === "MANUAL",
    fr: "Boîte manuelle fatigante dans les embouteillages denses (Casablanca, Rabat)",
    ar: "علبة السرعات اليدوية متعبة في الازدحام الكثيف (الدار البيضاء، الرباط)",
  },
  {
    id: "entry-equipment",
    applies: (c) => c.priceNewEst < 180_000,
    fr: "Équipements de sécurité et de confort en retrait sur les finitions d'entrée de gamme",
    ar: "تجهيزات السلامة والراحة محدودة في الفئات الأساسية",
  },
  {
    id: "entry-materials",
    applies: (c) => c.priceNewEst < 150_000,
    fr: "Plastiques durs et insonorisation basique perceptibles sur autoroute",
    ar: "بلاستيك صلب وعزل صوتي محدود يلاحظان على الطريق السريع",
  },
  {
    id: "premium-cost",
    applies: (c) => c.priceNewEst >= 450_000,
    fr: "Coût d'entretien et pièces premium élevés hors garantie constructeur",
    ar: "تكلفة الصيانة وقطع الغيار للفئة العالية مرتفعة خارج الضمان",
  },
  {
    id: "premium-network",
    applies: (c) => c.priceNewEst >= 450_000,
    fr: "Réseau de concessionnaires et ateliers agréés concentré sur les grandes villes",
    ar: "شبكة الوكلاء والورشات المعتمدة مركّزة في المدن الكبرى",
  },
  {
    id: "older-adas",
    applies: (c, year) => year - c.year >= 5,
    fr: "Aides à la conduite (ADAS) parfois en retrait par rapport à un millésime récent",
    ar: "مساعدات القيادة (ADAS) أحيانًا أقل تطورًا مقارنة بالموديلات الحديثة",
  },
  {
    id: "older-infotainment",
    applies: (c, year) => year - c.year >= 6,
    fr: "Multimédia daté : CarPlay/Android Auto parfois absents ou uniquement filaires",
    ar: "نظام المعلومات والترفيه قديم: CarPlay/Android Auto قد يكونان غائبين أو سلكيين فقط",
  },
  {
    id: "new-depreciation",
    applies: (c, year) => year - c.year <= 1,
    fr: "Décote initiale marquée durant les 24 premiers mois après l'immatriculation",
    ar: "انخفاض القيمة ملحوظ خلال أول 24 شهرًا من التسجيل",
  },
  {
    id: "brand-premium-service",
    applies: (c) =>
      /\b(bmw|mercedes|audi|porsche|volvo|jaguar|land\s?rover|lexus|infiniti|maserati|genesis)\b/i.test(
        c.brandFr ?? "",
      ),
    fr: "Coût horaire main-d'œuvre concession premium plus élevé qu'un généraliste",
    ar: "تكلفة ساعة العمل لدى وكلاء الفئة الفاخرة أعلى من الوكلاء العاديين",
  },
  {
    id: "brand-chinese-resale",
    applies: (c) =>
      /\b(byd|mg|chery|geely|haval|dongfeng|jetour|omoda|jaecoo|gac|baic|leapmotor|chana)\b/i.test(
        c.brandFr ?? "",
      ),
    fr: "Cote de revente encore en construction au Maroc — à anticiper sur 3 à 5 ans",
    ar: "قيمة إعادة البيع ما زالت في طور البناء بالمغرب — يُنصح بالتفكير فيها على 3 إلى 5 سنوات",
  },
  {
    id: "brand-french-electronics",
    applies: (c) => /\b(renault|peugeot|citro[eë]n|ds|dacia)\b/i.test(c.brandFr ?? ""),
    fr: "Petits soucis électroniques (capteurs, multimédia) signalés sur certaines générations",
    ar: "بعض المشاكل الإلكترونية الصغيرة (الحساسات، نظام الترفيه) تُذكر في بعض الأجيال",
  },
];

const POSITIVE_CATALOG: Def[] = [
  {
    id: "ev-silence",
    applies: (c) => c.fuel === "ELECTRIC",
    fr: "Silence de fonctionnement et accélérations linéaires en ville",
    ar: "هدوء التشغيل وتسارع متناسق داخل المدينة",
  },
  {
    id: "ev-tco",
    applies: (c) => c.fuel === "ELECTRIC",
    fr: "Coût d'usage au km plus faible (électricité vs carburant) sur trajets quotidiens",
    ar: "تكلفة الاستعمال لكل كيلومتر أقل (الكهرباء مقابل الوقود) في التنقلات اليومية",
  },
  {
    id: "diesel-torque",
    applies: (c) => c.fuel === "DIESEL",
    fr: "Couple généreux à bas régime, idéal autoroute et trajets chargés",
    ar: "عزم دوران قوي عند الدورات المنخفضة، مناسب للطريق السريع والحمولة",
  },
  {
    id: "diesel-range",
    applies: (c) => c.fuel === "DIESEL",
    fr: "Grande autonomie par plein, intéressante pour les longs trajets Casa–Sud",
    ar: "مدى كبير في كل تعبئة، مناسب للرحلات الطويلة من الدار البيضاء نحو الجنوب",
  },
  {
    id: "hybrid-urban",
    applies: (c) => c.fuel === "HYBRID",
    fr: "Consommation maîtrisée en ville grâce au mode électrique partiel",
    ar: "استهلاك منخفض داخل المدينة بفضل الوضع الكهربائي الجزئي",
  },
  {
    id: "petrol-simple",
    applies: (c) => c.fuel === "PETROL",
    fr: "Mécanique simple, entretien plus accessible sur tout le territoire",
    ar: "ميكانيكا بسيطة وصيانة متاحة عبر التراب الوطني",
  },
  {
    id: "city-park",
    applies: (c) => c.bodyType === "CITY_CAR",
    fr: "Gabarit compact : créneaux et parkings urbains très faciles",
    ar: "حجم صغير: الركن والمواقف الحضرية سهلة جدًا",
  },
  {
    id: "city-fuel",
    applies: (c) => c.bodyType === "CITY_CAR",
    fr: "Consommation contenue, idéal pour les trajets domicile–travail",
    ar: "استهلاك محدود ومناسب للتنقل بين البيت والعمل",
  },
  {
    id: "sedan-highway",
    applies: (c) => c.bodyType === "SEDAN",
    fr: "Confort autoroutier et tenue de route stable sur longues distances",
    ar: "راحة على الطريق السريع وثبات على المسافات الطويلة",
  },
  {
    id: "suv-clearance",
    applies: (c) => c.bodyType === "SUV" || c.bodyType === "PICKUP",
    fr: "Garde au sol surélevée : à l'aise sur dos d'âne et pistes",
    ar: "ارتفاع أرضية أعلى: مريح على المطبات والمسالك",
  },
  {
    id: "suv-position",
    applies: (c) => c.bodyType === "SUV",
    fr: "Position de conduite haute, meilleure visibilité dans la circulation",
    ar: "وضعية قيادة مرتفعة ورؤية أفضل في الازدحام",
  },
  {
    id: "family-space",
    applies: (c) => c.bodyType === "FAMILY",
    fr: "Volume de chargement et modularité pratiques pour la famille",
    ar: "حجم تخزين كبير وتعدد استعمالات مناسب للعائلة",
  },
  {
    id: "commercial-utility",
    applies: (c) => c.bodyType === "COMMERCIAL",
    fr: "Volume utile et accès cargo conçus pour usage professionnel quotidien",
    ar: "حجم نافع ومدخل للحمولة مصمم للاستعمال المهني اليومي",
  },
  {
    id: "pickup-versatile",
    applies: (c) => c.bodyType === "PICKUP",
    fr: "Polyvalence transport / loisirs : benne ouverte et capacité de remorquage",
    ar: "تعدد الاستخدامات نقل/ترفيه: صندوق مفتوح وقدرة على القطر",
  },
  {
    id: "auto-comfort",
    applies: (c) => c.transmission === "AUTOMATIC",
    fr: "Confort de conduite supérieur dans les bouchons (Casablanca, Rabat)",
    ar: "راحة قيادة أفضل في الازدحام (الدار البيضاء، الرباط)",
  },
  {
    id: "manual-cost",
    applies: (c) => c.transmission === "MANUAL",
    fr: "Prix d'achat et entretien boîte plus abordables que l'automatique",
    ar: "ثمن الشراء وصيانة العلبة أقل تكلفة مقارنة بالأوتوماتيكية",
  },
  {
    id: "entry-price",
    applies: (c) => c.priceNewEst < 180_000,
    fr: "Prix d'accès attractif, financement bancaire facilité au Maroc",
    ar: "ثمن في المتناول وتمويل بنكي ميسور بالمغرب",
  },
  {
    id: "premium-equip",
    applies: (c) => c.priceNewEst >= 450_000,
    fr: "Équipement et finition premium, matériaux nobles à bord",
    ar: "تجهيزات وتشطيب فاخر ومواد راقية داخل المقصورة",
  },
  {
    id: "premium-image",
    applies: (c) => c.priceNewEst >= 450_000,
    fr: "Image de marque et présence valorisantes sur le segment",
    ar: "صورة علامة قوية وحضور مميز ضمن الفئة",
  },
  {
    id: "recent-warranty",
    applies: (c, year) => year - c.year <= 2,
    fr: "Garantie constructeur encore active sur les premières années d'usage",
    ar: "ضمان الصانع لا يزال ساريًا في السنوات الأولى من الاستعمال",
  },
  {
    id: "recent-tech",
    applies: (c, year) => year - c.year <= 3,
    fr: "Multimédia et ADAS récents (CarPlay/Android Auto sans fil possibles)",
    ar: "تقنيات حديثة للمعلومات والترفيه ومساعدات القيادة (CarPlay/Android Auto لاسلكي ممكن)",
  },
  {
    id: "older-stable",
    applies: (c, year) => year - c.year >= 5,
    fr: "Génération bien rôdée : retours mécaniciens étoffés au Maroc",
    ar: "جيل معروف ومجرَّب: ملاحظات الميكانيكيين متوفرة بالمغرب",
  },
  {
    id: "brand-french-network",
    applies: (c) => /\b(renault|peugeot|citro[eë]n|ds|dacia)\b/i.test(c.brandFr ?? ""),
    fr: "Réseau d'entretien dense au Maroc (concessions et garages indépendants)",
    ar: "شبكة صيانة كثيفة بالمغرب (وكالات وميكانيكيون مستقلون)",
  },
  {
    id: "brand-japanese-reliab",
    applies: (c) =>
      /\b(toyota|honda|mazda|nissan|suzuki|mitsubishi|subaru|lexus)\b/i.test(c.brandFr ?? ""),
    fr: "Fiabilité historique reconnue, coût d'usage long terme prévisible",
    ar: "موثوقية تاريخية معروفة وتكلفة استعمال طويلة الأمد متوقعة",
  },
  {
    id: "brand-korean-warranty",
    applies: (c) => /\b(hyundai|kia|genesis|ssangyong)\b/i.test(c.brandFr ?? ""),
    fr: "Garantie constructeur étendue souvent proposée en gamme générale",
    ar: "ضمان صانع ممتد متوفر غالبًا في الفئات العامة",
  },
  {
    id: "brand-chinese-equip",
    applies: (c) =>
      /\b(byd|mg|chery|geely|haval|dongfeng|jetour|omoda|jaecoo|gac|baic|leapmotor)\b/i.test(
        c.brandFr ?? "",
      ),
    fr: "Niveau d'équipement élevé pour le prix face aux concurrents traditionnels",
    ar: "مستوى تجهيز عالٍ مقارنة بالسعر مقابل المنافسين التقليديين",
  },
  {
    id: "spec-reliability",
    applies: (c) => (c.reliabilityScore ?? 0) >= 80,
    fr: "Score de fiabilité élevé d'après les retours catalogue",
    ar: "تقييم موثوقية عالٍ حسب بيانات الكتالوج",
  },
  {
    id: "spec-resale",
    applies: (c) => (c.resaleScore ?? 0) >= 75,
    fr: "Bonne tenue à la cote sur le marché de l'occasion local",
    ar: "حفاظ جيد على القيمة في سوق المستعمل المحلي",
  },
  {
    id: "spec-comfort",
    applies: (c) => (c.comfortScore ?? 0) >= 80,
    fr: "Niveau de confort à bord salué par les utilisateurs",
    ar: "مستوى راحة داخل المقصورة يُشيد به المستخدمون",
  },
  {
    id: "spec-conso",
    applies: (c) => (c.consumptionL100 ?? 99) <= 5.5 && c.fuel !== "ELECTRIC",
    fr: "Consommation maîtrisée selon homologation indicative",
    ar: "استهلاك معقول حسب التقدير الإرشادي",
  },
  {
    id: "spec-maintenance",
    applies: (c) => (c.maintenanceCostEst ?? Number.POSITIVE_INFINITY) <= 4000,
    fr: "Coût d'entretien annuel estimé attractif sur le segment",
    ar: "تكلفة صيانة سنوية تقديرية جذابة ضمن الفئة",
  },
];

type ReviewIssueDef = {
  id: string;
  patterns: RegExp[];
  fr: string;
  ar: string;
};

const REVIEW_ISSUE_DEFS: ReviewIssueDef[] = [
  {
    id: "noise",
    patterns: [/bruit/i, /noise/i, /ضوضاء/i, /صوت/i],
    fr: "Bruits aérodynamiques ou d'habitacle sur route rapide",
    ar: "ضوضاء هوائية أو داخل المقصورة على السرعة",
  },
  {
    id: "suspension",
    patterns: [/suspension/i, /amortisseur/i, /مطبات/i, /تعليق/i],
    fr: "Confort/suspension perfectible sur routes dégradées",
    ar: "تعليق وراحة أقل على الطرق المتضررة",
  },
  {
    id: "brakes",
    patterns: [/frein/i, /plaquette/i, /brake/i, /فرامل/i],
    fr: "Usure des freins plus rapide en usage intensif",
    ar: "تآكل الفرامل أسرع مع الاستعمال المكثف",
  },
  {
    id: "parts",
    patterns: [/pi[eè]ce/i, /d[ée]lai/i, /stock/i, /قطع/i, /توفر/i],
    fr: "Délais ou coût des pièces selon la ville",
    ar: "تأخر أو تكلفة قطع الغيار حسب المدينة",
  },
  {
    id: "consumption",
    patterns: [/consommation/i, /conso/i, /fuel/i, /استهلاك/i],
    fr: "Consommation sensible en circulation urbaine dense",
    ar: "استهلاك الوقود يرتفع داخل المدينة المزدحمة",
  },
  {
    id: "space",
    patterns: [/place arrière/i, /coffre/i, /habitabilit/i, /خلف/i, /صندوق/i],
    fr: "Espace arrière/coffre à vérifier selon usage familial",
    ar: "المقاعد الخلفية أو الصندوق تحتاج تحقق حسب الاستعمال العائلي",
  },
];

function hashStringStable(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  }
  return h;
}

function shuffleByCarId<T>(items: T[], carId: string): T[] {
  return items
    .map((item, i) => ({ item, k: hashStringStable(`${carId}|${i}`) }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.item);
}

function pickFromCatalog(catalog: Def[], car: CarLike, locale: string, max: number): string[] {
  const currentYear = new Date().getFullYear();
  const applicable = catalog.filter((d) => d.applies(car, currentYear));
  const ordered = shuffleByCarId(applicable, car.id);
  const out: string[] = [];
  for (const d of ordered) {
    if (out.length >= max) break;
    const text = locale === "ar" ? d.ar : d.fr;
    if (!out.includes(text)) out.push(text);
  }
  return out;
}

export function derivePros(car: CarLike, locale: string, max = 5): string[] {
  return pickFromCatalog(POSITIVE_CATALOG, car, locale, max);
}

export function deriveCons(car: CarLike, locale: string, max = 5): string[] {
  return pickFromCatalog(NEGATIVE_CATALOG, car, locale, max);
}

export function derivePopularIssues(
  reviews: { globalNote: number | null; commentAr: string; commentFr: string | null }[],
  car: CarLike,
  locale: string,
  max = 6,
): string[] {
  const out: string[] = [];

  const scored = new Map<string, number>();
  for (const r of reviews) {
    const text = `${r.commentFr ?? ""}\n${r.commentAr}`;
    for (const def of REVIEW_ISSUE_DEFS) {
      if (def.patterns.some((p) => p.test(text))) {
        scored.set(
          def.id,
          (scored.get(def.id) ?? 0) + 1 + (r.globalNote != null && r.globalNote <= 2 ? 1 : 0),
        );
      }
    }
  }
  const fromReviews = REVIEW_ISSUE_DEFS.map((d) => ({ d, score: scored.get(d.id) ?? 0 }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => (locale === "ar" ? x.d.ar : x.d.fr));
  for (const item of fromReviews) {
    if (out.length >= max) break;
    if (!out.includes(item)) out.push(item);
  }

  for (const item of deriveCons(car, locale, max)) {
    if (out.length >= max) break;
    if (!out.includes(item)) out.push(item);
  }

  return out;
}
