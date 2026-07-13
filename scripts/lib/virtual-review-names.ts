/** Noms virtuels (pas de vrais utilisateurs) pour les avis importés. */

const MALE_AR = [
  "محمد",
  "أحمد",
  "يوسف",
  "رشيد",
  "كريم",
  "حمزة",
  "أنس",
  "مهدي",
  "سفيان",
  "بلال",
  "ياسين",
  "عثمان",
  "زكرياء",
  "عمر",
  "إلياس",
  "خالد",
  "نبيل",
  "طارق",
  "منير",
  "سعيد",
];

const FEMALE_AR = [
  "فاطمة",
  "خديجة",
  "سلمى",
  "هند",
  "أمينة",
  "نادية",
  "سارة",
  "إيمان",
  "زينب",
  "ليلى",
  "سعاد",
  "مريم",
  "حنان",
  "سناء",
  "غزلان",
  "أسماء",
];

const MALE_FR = [
  "Mohamed",
  "Ahmed",
  "Youssef",
  "Rachid",
  "Karim",
  "Hamza",
  "Anas",
  "Mehdi",
  "Sofiane",
  "Bilal",
  "Yassine",
  "Othmane",
  "Zakaria",
  "Omar",
  "Ilyas",
  "Khalid",
  "Nabil",
  "Tarik",
  "Mounir",
  "Said",
];

const FEMALE_FR = [
  "Fatima",
  "Khadija",
  "Salma",
  "Hind",
  "Amina",
  "Nadia",
  "Sara",
  "Imane",
  "Zineb",
  "Leila",
  "Souad",
  "Meriem",
  "Hanan",
  "Sanaa",
  "Ghizlane",
  "Asmae",
];

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function virtualOwnerNames(seed: string): { nameAr: string; nameFr: string } {
  const h = hashSeed(seed);
  const female = h % 5 === 0;
  const idx = h % (female ? FEMALE_AR.length : MALE_AR.length);
  if (female) {
    return { nameAr: FEMALE_AR[idx]!, nameFr: FEMALE_FR[idx]! };
  }
  return { nameAr: MALE_AR[idx]!, nameFr: MALE_FR[idx]! };
}

const CITY_AR: Record<string, string> = {
  "béni mellal": "بني ملال",
  "beni mellal": "بني ملال",
  khouribga: "خريبكة",
  casablanca: "الدار البيضاء",
  rabat: "الرباط",
  marrakech: "مراكش",
  fès: "فاس",
  fes: "فاس",
  tanger: "طنجة",
  agadir: "أكادير",
  meknès: "مكناس",
  meknes: "مكناس",
  oujda: "وجدة",
  "el jadida": "الجديدة",
  tétouan: "تطوان",
  tetouan: "تطوان",
  salé: "سلا",
  sale: "سلا",
  mohammedia: "المحمدية",
  "laâyoune": "العيون",
  laayoune: "العيون",
  nador: "الناظور",
  settat: "سطات",
  berrechid: "برشيد",
  taza: "تازة",
  "al hoceima": "الحسيمة",
  "sidi kacem": "سيدي قاسم",
  essaouira: "الصويرة",
  ouarzazate: "ورزازات",
  "al hoceïma": "الحسيمة",
};

const SERVICE_AR: Record<string, string> = {
  "comparaison modèle": "مقارنة موديل",
  "achat neuf": "شراء جديد",
  "achat occasion": "شراء مستعمل",
  "usage ville": "استعمال مدينة",
  "usage famille": "استعمال عائلي",
  taxi: "طاكسي",
  "usage professionnel": "استعمال مهني",
  "long trajet": "طريق طويلة",
};

export function cityLabelAr(cityFr: string): string {
  const key = cityFr
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return CITY_AR[key] ?? cityFr;
}

export function serviceLabelAr(serviceFr: string): string {
  const key = serviceFr.trim().toLowerCase();
  return SERVICE_AR[key] ?? serviceFr;
}

export function buildDisplayLabels(input: {
  seed: string;
  cityFr: string;
  serviceFr: string;
}): { displayLabel: string; displayLabelFr: string } {
  const { nameFr } = virtualOwnerNames(input.seed);
  // Mode darija = alphabet latin (franco-arabe), pas le script arabe.
  const latin = `${nameFr} — ${input.cityFr} — ${input.serviceFr}`.slice(0, 200);
  return {
    displayLabel: latin,
    displayLabelFr: latin,
  };
}
