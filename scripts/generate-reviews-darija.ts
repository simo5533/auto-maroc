/**
 * Génère des avis synthétiques en darija marocaine (script arabe) et les
 * répartit sur les voitures existantes de la base.
 *
 * Les avis sont marqués reviewOrigin = IMPORT, sourceName = "avis_darija_genere"
 * et status = APPROVED. Idempotent via --clean (supprime le lot précédent).
 *
 * Usage :
 *   npm run reviews:generate-darija
 *   npm run reviews:generate-darija -- --count=10000
 *   npm run reviews:generate-darija -- --clean
 *   npm run reviews:generate-darija -- --dry-run
 */
import { PrismaClient, ReviewOrigin, ReviewStatus } from "@prisma/client";
import { loadEnvFiles } from "./lib/load-env";

loadEnvFiles();
const prisma = new PrismaClient();

const SOURCE_NAME = "avis_darija_genere";

function parseArgs(argv: string[]) {
  let count = 10000;
  let clean = false;
  let dryRun = false;
  for (const a of argv.slice(2)) {
    if (a === "--clean") clean = true;
    else if (a === "--dry-run") dryRun = true;
    else if (a.startsWith("--count=")) count = Math.max(1, Number(a.slice("--count=".length)) || 0);
  }
  return { count, clean, dryRun };
}

/** RNG déterministe (mulberry32) pour un lot reproductible. */
function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const cities = [
  "الدار البيضاء",
  "الرباط",
  "مراكش",
  "فاس",
  "طنجة",
  "أكادير",
  "مكناس",
  "وجدة",
  "القنيطرة",
  "تطوان",
  "سلا",
  "المحمدية",
  "بني ملال",
  "الناظور",
  "خريبكة",
  "الجديدة",
  "سطات",
  "برشيد",
  "تازة",
  "العرائش",
  "سيدي قاسم",
  "الصويرة",
  "ورزازات",
  "الحسيمة",
];

const maleNames = [
  "محمد",
  "أحمد",
  "يوسف",
  "رشيد",
  "كريم",
  "عبد الله",
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
];

const femaleNames = [
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

const usageTypes = ["استعمال مدينة", "استعمال عائلي", "طاكسي", "استعمال مهني", "أسفار طويلة", "طالب"];

// Ouvertures selon la note.
const openersPositive = [
  "طونوبيل زوينة بزاف وراضي عليها",
  "الحمد لله شي ما كنشكي منو",
  "شريتها وما ندمتش، اختيار موفق",
  "من أحسن الطوموبيلات لي دقت عليها",
  "قيمتها فلوسها بلا مبالغة",
  "خدامة معايا مزيان وما خيباتنيش",
  "ننصح بيها بلا تردد للي باغي طونوبيل عملية",
  "راضي 100% على الشرا ديالها",
];

const openersMixed = [
  "طونوبيل لاباس عليها ولكن كاينة شي نقاط",
  "معقولة بحال بحال، فيها لخير وفيها لعيب",
  "ماشي خايبة ولكن ماشي هي لي كنت كنتسنى",
  "بين بين، كاين لي أحسن منها فنفس الثمن",
  "لاباس للاستعمال اليومي ولكن ماتنتظرش بزاف",
];

const openersNegative = [
  "بصراحة خيباتني شوية",
  "ما نصحش بيها بزاف على حساب تجربتي",
  "كثرو ليا فيها المشاكل ونمدت منها",
  "توقعت منها أحسن من هكا",
  "فلوس كثيرة ونتيجة ما كافياش",
];

// Phrases par thème (positives / négatives).
const consumptionPos = [
  "المازوط ديالها معقول وكتوفر فالطريق",
  "ما كتشربش بزاف د لماكينة، اقتصادية",
  "فالوطوروت كتعطيك استهلاك مزيان",
  "خفيفة على الجيب من ناحية الكاريان",
];
const consumptionNeg = [
  "كتشرب شوية بزاف د لماكينة فالمدينة",
  "الاستهلاك أكثر مما كنت كنتسنى",
];

const comfortPos = [
  "الراحة داخلها زوينة والسياج مريحين",
  "الكليما خدامة مزيان والصوت ديال المحرك خفيف",
  "فالطريق الطويلة كتحس بالراحة وما كتعياش",
  "السسبانسيون كيمتص لحفر ديال الطريق مزيان",
];
const comfortNeg = [
  "السسبانسيون قاسحة شوية فالطريق الخايبة",
  "كاين شي حس داخل الكابين فالسرعة الكبيرة",
];

const reliabilityPos = [
  "ما عطاتنيش مشاكل ميكانيكية، خدامة بحال الساعة",
  "الاعتمادية ديالها مزيانة والمحرك قوي",
  "من بعد كيلومترات بزاف مازالة صحيحة",
];
const reliabilityNeg = [
  "طلعو ليا شي مشاكل كهربائية بكري",
  "دخلت للميكانيسيان أكثر من مرة فالعام الأول",
];

const maintenancePos = [
  "الصيانة رخيصة وقطع الغيار كاينين فالمغرب",
  "الفيدانج والصيانة معقولين عند الميكانيسيان",
  "القطع متوفرة وما كتقلبش عليهم بزاف",
];
const maintenanceNeg = [
  "قطع الغيار غاليين وقلال شوية",
  "الصيانة كتكلف أكثر من المتوقع",
];

const pricePos = [
  "الثمن ديالها فالسوق مازال محافظ إلا بغيتي تبيعها",
  "القيمة ديالها ما كتهبطش بزاف، بيعة سهلة",
  "بالنسبة للثمن كتعطيك بزاف د لخير",
];
const priceNeg = [
  "القيمة ديالها كتهبط بسرعة فالسوق",
  "الثمن غالي شوية مقارنة مع لي كتعطيك",
];

const closingsPos = [
  "بشكل عام ننصح بيها.",
  "خيار مزيان للعائلة المغربية.",
  "طونوبيل عملية للاستعمال اليومي.",
  "غانعاود نشريها بلا شك.",
];
const closingsMixed = [
  "فكر مزيان قبل ما تشري.",
  "جربها قبل ما تقرر.",
  "مناسبة لشي ناس وماشي لآخرين.",
];
const closingsNeg = [
  "قلب على شي حاجة أخرى فنفس الثمن.",
  "ماشي الخيار لي كنقترح.",
];

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

function maybe(rng: () => number, p: number): boolean {
  return rng() < p;
}

/** Note globale pondérée (majorité 4-5, un peu de 3, minorité 1-2). */
function pickNote(rng: () => number): number {
  const r = rng();
  if (r < 0.45) return 5;
  if (r < 0.75) return 4;
  if (r < 0.9) return 3;
  if (r < 0.97) return 2;
  return 1;
}

function subNote(rng: () => number, base: number): number {
  const delta = Math.floor(rng() * 3) - 1; // -1..+1
  return Math.min(5, Math.max(1, base + delta));
}

function buildComment(rng: () => number, note: number): string {
  const positive = note >= 4;
  const mixed = note === 3;
  const opener = positive ? pick(rng, openersPositive) : mixed ? pick(rng, openersMixed) : pick(rng, openersNegative);

  const themes: string[][] = positive
    ? [consumptionPos, comfortPos, reliabilityPos, maintenancePos, pricePos]
    : mixed
      ? [
          maybe(rng, 0.5) ? consumptionPos : consumptionNeg,
          maybe(rng, 0.5) ? comfortPos : comfortNeg,
          maybe(rng, 0.5) ? reliabilityPos : reliabilityNeg,
          maybe(rng, 0.5) ? maintenancePos : maintenanceNeg,
          maybe(rng, 0.5) ? pricePos : priceNeg,
        ]
      : [consumptionNeg, comfortNeg, reliabilityNeg, maintenanceNeg, priceNeg];

  // 2 à 3 thèmes distincts.
  const idxs = [0, 1, 2, 3, 4];
  for (let i = idxs.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [idxs[i], idxs[j]] = [idxs[j]!, idxs[i]!];
  }
  const nThemes = maybe(rng, 0.5) ? 3 : 2;
  const sentences = idxs.slice(0, nThemes).map((k) => pick(rng, themes[k]!));

  const closing = positive ? pick(rng, closingsPos) : mixed ? pick(rng, closingsMixed) : pick(rng, closingsNeg);

  return `${opener}. ${sentences.join("، ")}. ${closing}`;
}

async function main() {
  const { count, clean, dryRun } = parseArgs(process.argv);
  console.log(`[gen-darija] count: ${count}`);
  console.log(`[gen-darija] clean: ${clean}`);
  console.log(`[gen-darija] dry-run: ${dryRun}`);

  if (clean && !dryRun) {
    const del = await prisma.review.deleteMany({ where: { sourceName: SOURCE_NAME } });
    console.log(`[gen-darija] ${del.count} avis précédents supprimés.`);
  }

  // En dry-run on prévisualise le contenu sans toucher la base.
  const cars = dryRun
    ? [{ id: "preview-car-id" }]
    : await prisma.car.findMany({ select: { id: true } });
  if (cars.length === 0) {
    console.error("[gen-darija] aucune voiture en base — lancez l'import du catalogue d'abord.");
    process.exit(1);
  }
  console.log(`[gen-darija] ${cars.length} voiture(s) cible(s).`);

  const rng = makeRng(20260708);

  type Row = {
    carId: string;
    displayLabel: string;
    city: string;
    usageMonths: number;
    mileageKm: number;
    globalNote: number;
    comfortNote: number;
    reliabilityNote: number;
    maintenanceNote: number;
    consumptionNote: number;
    resaleNote: number;
    commentAr: string;
  };

  const batch: Row[] = [];
  for (let i = 0; i < count; i++) {
    const car = cars[i % cars.length]!;
    const isFemale = maybe(rng, 0.35);
    const name = isFemale ? pick(rng, femaleNames) : pick(rng, maleNames);
    const city = pick(rng, cities);
    const usage = pick(rng, usageTypes);
    const note = pickNote(rng);
    const usageMonths = 3 + Math.floor(rng() * 72);
    const mileageKm = 3000 + Math.floor(rng() * 197000);

    batch.push({
      carId: car.id,
      displayLabel: `${name} — ${city} — ${usage}`.slice(0, 200),
      city,
      usageMonths,
      mileageKm,
      globalNote: note,
      comfortNote: subNote(rng, note),
      reliabilityNote: subNote(rng, note),
      maintenanceNote: subNote(rng, note),
      consumptionNote: subNote(rng, note),
      resaleNote: subNote(rng, note),
      commentAr: buildComment(rng, note).slice(0, 4000),
    });
  }

  console.log(`[gen-darija] ${batch.length} avis préparés. Exemples :`);
  for (const s of batch.slice(0, 3)) console.log(`  · [${s.globalNote}/5] ${s.displayLabel} :: ${s.commentAr}`);

  if (dryRun) {
    console.log("[gen-darija] dry-run — aucune écriture.");
    return;
  }

  const CHUNK = 500;
  let inserted = 0;
  for (let i = 0; i < batch.length; i += CHUNK) {
    const slice = batch.slice(i, i + CHUNK);
    await prisma.review.createMany({
      data: slice.map((b) => ({
        carId: b.carId,
        userId: null,
        displayLabel: b.displayLabel,
        city: b.city,
        usageMonths: b.usageMonths,
        mileageKm: b.mileageKm,
        consumptionNote: b.consumptionNote,
        comfortNote: b.comfortNote,
        reliabilityNote: b.reliabilityNote,
        maintenanceNote: b.maintenanceNote,
        resaleNote: b.resaleNote,
        globalNote: b.globalNote,
        commentAr: b.commentAr,
        commentFr: null,
        sourceName: SOURCE_NAME,
        sourceUrl: null,
        reviewOrigin: ReviewOrigin.IMPORT,
        verified: false,
        status: ReviewStatus.APPROVED,
      })),
    });
    inserted += slice.length;
    console.log(`[gen-darija] +${slice.length} (total ${inserted}/${batch.length})`);
  }

  console.log(`[gen-darija] terminé. ${inserted} avis darija créés.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
