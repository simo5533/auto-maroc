import type { BodyType, FuelType } from "@prisma/client";
import type { ProductStory } from "@/lib/car-product-story";

export type ProductStoryInput = {
  brandFr: string;
  brandAr: string;
  modelFr: string;
  modelAr: string;
  bodyType: BodyType;
  fuel: FuelType;
  versionFr: string;
  versionAr: string;
  year: number;
  co2Gkm?: number | null;
  consumptionL100?: number | null;
};

function bodyLabelFr(body: BodyType): string {
  const m: Record<BodyType, string> = {
    CITY_CAR: "citadine",
    SEDAN: "berline",
    SUV: "SUV",
    FAMILY: "break / monospace familial",
    COMMERCIAL: "véhicule utilitaire léger",
    PICKUP: "pick-up",
  };
  return m[body];
}

function fuelPhraseFr(fuel: FuelType): string {
  if (fuel === "ELECTRIC") return "motorisation entièrement électrique";
  if (fuel === "HYBRID") return "motorisation hybride (non rechargeable ou rechargeable selon millésime)";
  if (fuel === "DIESEL") return "motorisation diesel";
  return "motorisation essence";
}

/** Contenu indicatif long — à croiser avec la fiche constructeur et l’homologation Maroc. */
export function buildProductStoryPayload(p: ProductStoryInput): ProductStory {
  const label = `${p.brandFr} ${p.modelFr}`;
  const seg = bodyLabelFr(p.bodyType);
  const motor = fuelPhraseFr(p.fuel);

  const sections: ProductStory["sections"] = [
    {
      id: "ext-front",
      category: "design_exterior",
      titleFr: `Signature avant et calandre — ${label}`,
      titleAr: `الواجهة الأمامية والشبكة — ${p.brandAr} ${p.modelAr}`,
      bodyFr: `La face avant du véhicule affirme l’identité visuelle ${p.brandFr}. Les proportions du bouclier et de la calandre renforcent la présence sur la route tout en optimisant le flux d’air vers le groupe motopropulseur ${motor}. Les inserts chromés ou laques (selon finition) soulignent la ligne sans alourdir le dessin. Les projecteurs — LED ou halogène selon niveau de série — assurent une bonne signature lumineuse de jour comme de nuit ; les éléments verticaux ou « daylight » évoluent selon la génération et le pays d’homologation.\n\nCes descriptions sont **indicatives** pour le catalogue démo Auto Maroc : largeur exacte de la voie lumineuse, technologie matricielle ou laser, et options pack sport restent à confirmer sur la fiche constructeur ${p.brandFr} pour la finition « ${p.versionFr} » et l’année ${p.year}.`,
      bodyAr: `تُبرز الواجهة الأمامية هوية ${p.brandAr}. شبكة التهوية وخط الصدام يعزّزان الحضور على الطريق مع تحسين تدفق الهواء نحو مجموعة الدفع (${motor}). الإطارات الكروم أو الطلاء (حسب الفئة) تُبرز الشكل دون إثقاله. المصابيح — LED أو هالوجين حسب التجهيز — توفّر إضاءة جيدة نهارًا وليلًا.\n\nهذا النص **إرشادي** في كتالوج Auto Maroc؛ يُرجى التحقق من الوكيل للنسخة « ${p.versionAr} » وسنة ${p.year}.`,
    },
    {
      id: "ext-lighting",
      category: "design_exterior",
      titleFr: `Feux et visibilité — ${label}`,
      titleAr: `الإضاءة والرؤية — ${p.modelAr}`,
      bodyFr: `À l’arrière, les feux adoptent une signature graphique reconnaissable ; les technologies à LED dominent sur les récentes générations pour une consommation réduite et une durée de vie prolongée. Les clignotants dynamiques ou séquentiels peuvent être proposés selon finition. Les antibrouillards et feux de recul complètent la sécurité en marche arrière et par temps difficile.\n\nLes réglages d’assistance à la route (feux de route automatiques, anti-éblouissement adaptatif) dépendent du pack options — toujours vérifier le bon de commande distributeur au Maroc.`,
      bodyAr: `في الخلف، مصابيح الإضاءة الخلفية بهوية واضحة؛ تقنية LED شائعة في الأجيال الحديثة. يمكن أن تشمل إشارات ديناميكية حسب الفئة. أضواء الضباب والرجوع تدعم السلامة.\n\nالميزات المتقدمة (تشغيل تلقائي للطريق، منع الوهج) تعتمد على حزمة الخيارات — يُؤكد عند الوكيل.`,
    },
    {
      id: "ext-silhouette",
      category: "design_exterior",
      titleFr: `Silhouette, aérodynamique et segments ${seg}`,
      titleAr: `الشكل الجانبي والديناميكا الهوائية`,
      bodyFr: `Le profil du véhicule — segment ${seg} — combine habitabilité et coefficient de traînée maîtrisé pour limiter la consommation sur autoroute. Les jantes alliage (16″ à 20″ selon catalogue) participent au style et au confort : plus le diamètre augmente, plus les pneumatiques peuvent être bas profil sur versions sportives. Les passages de roues et les bas de caisse peuvent intégrer des protections plastique noir pour un usage quotidien.\n\nHauteur de caisse et angle d’attaque : utiles pour les dos d’âne et les parkings en sous-sol ; valeurs exactes dans la notice constructeur.`,
      bodyAr: `يُجمع الشكل بين مقصورة مريحة ومقاومة هواء معقولة لتقليل الاستهلاك على الطريق السريع. العجلات المعدنية تختلف بالقطر حسب الفئة. ارتفاع الأرضية وزوايا الدخول— تفاصيل في دليل الصيانة.`,
    },
    {
      id: "int-cockpit",
      category: "design_interior",
      titleFr: `Habitacle, tableau de bord et ergonomie`,
      titleAr: `المقصورة ولوحة العدادات`,
      bodyFr: `L’intérieur est structuré autour du conducteur : instrumentation lisible, rangements dans la console centrale et accoudoir. Les diffuseurs d’air peuvent être réglés directement ou via l’écran central selon génération de climatisation automatique bi-zone ou tri-zone. Les matériaux — tissu, simili cuir, cuir véritable — varient fortement selon finition « ${p.versionFr} ».\n\nLes versions haut de gamme peuvent proposer sièges électriques à mémoire, volant chauffant ou toit panoramique ; disponibilité au Maroc selon importateur.`,
      bodyAr: `تُنظَّم المقصورة حول السائق: عدادات واضحة، تخزين في الكونسول. مزدوج أو ثلاثي المناطق للتكييف حسب الجيل. المواد (قماش، جلد صناعي، جلد طبيعي) تختلف حسب « ${p.versionAr} ».`,
    },
    {
      id: "int-seats",
      category: "design_interior",
      titleFr: `Sièges, sellerie et ambiance à bord`,
      titleAr: `المقاعد والجلد والجو داخل السيارة`,
      bodyFr: `Les sièges avant offrent un maintien latéral adapté au segment ; les réglages lombaires et la hauteur de coussin facilitent les longs trajets. La sellerie bi-ton ou contrastée peut être disponible sur les séries sportives ou Design. Les sièges AR divisibles ou coulissants (break / SUV) optimisent le volume coffre.\n\nIsofix / top tether pour sièges enfants : présents sur la majorité des places latérales AR — confirmer selon millésime.`,
      bodyAr: `المقاعد الأمامية تدعم الجسم جانبيًا؛ ضبط قطني وارتفاع للراحة في المسافات الطويلة. الخلفية القابلة للطي تزيد من الحمولة. تثبيت Isofix حسب الجيل.`,
    },
    {
      id: "tech-infotainment",
      category: "technology",
      titleFr: `Système d’infodivertissement et connectivité`,
      titleAr: `نظام المعلومات والترفيه والربط`,
      bodyFr: `L’écran central tactile regroupe navigation (si cartographie installée), médias, téléphonie Bluetooth et paramètres véhicule. Apple CarPlay et Android Auto sont fréquents en filaire ou sans fil selon année modèle. Les mises à jour logicielles OTA peuvent exister sur les plateformes récentes ; sinon, mise à jour chez l’atelier.\n\nQualité audio : chaîne standard ou Hi-Fi / marque premium en option. Commandes au volant et reconnaissance vocale limitée selon langue et connectivité réseau.`,
      bodyAr: `الشاشة المركزية تجمع الملاحة والوسائط والهاتف عبر البلوتوث. Apple CarPlay و Android Auto شائعان. التحديثات قد تكون عن بُعد أو في الوكيل. جودة الصوت تعتمد على الفئة.`,
    },
    {
      id: "tech-app",
      category: "technology",
      titleFr: `Application mobile et services connectés`,
      titleAr: `تطبيق الهاتف والخدمات المتصلة`,
      bodyFr: `De nombreux constructeurs proposent une application pour consulter l’état du véhicule (autonomie, pression des pneus), planifier une révision ou localiser le véhicule. La disponibilité et les fonctions exactes pour ${label} dépendent du marché et du compte utilisateur — création souvent liée au numéro de châssis.\n\nDonnées cellulaires / eSIM : certaines fonctions nécessitent un abonnement ou une carte SIM embarquée.`,
      bodyAr: `تطبيقات الشركات تسمح أحيانًا بمراجعة الحالة وتخطيط الصيانة. التوفر يعتمد على السوق والحساب. بعض الوظائف تحتاج اشتراكًا أو شريحة.`,
    },
    {
      id: "assist-drive",
      category: "assistance",
      titleFr: `Aides à la conduite et régulateur`,
      titleAr: `مساعدات القيادة والمنظم`,
      bodyFr: `Les systèmes ADAS courants incluent régulateur / limiteur de vitesse adaptatif, alerte de franchissement de ligne, détection d’angle mort et freinage d’urgence avec détection piétons/cyclistes — selon niveau de série et calibrage local. Le maintien de trajectoire et le « stop & go » en embouteillage sont souvent liés à une caméra pare-brise et radar avant.\n\n**Important** : ces aides ne remplacent pas l’attention du conducteur ; vitesses maximales d’activation et conditions météo sont décrites dans le manuel.`,
      bodyAr: `أنظمة المساعدة قد تشمل منظم السرعة التكيفي، تنبيه الخروج عن المسار، النقطة العمياء، والفرملة الاستعجالية. يعتمد التجهيز على الفئة.\n\n**هذه الأنظمة لا تحل محل انتباه السائق.**`,
    },
    {
      id: "assist-park",
      category: "assistance",
      titleFr: `Aide au stationnement et caméras`,
      titleAr: `مساعدة الركن والكاميرات`,
      bodyFr: `Les capteurs ultrasons AR / AV et la caméra de recul facilitent les manœuvres. Les vues à 360° ou « 3D » combinent plusieurs caméras ; la netteté des objectifs en climat poussiéreux (routes désertiques, littoral) impacte la lisibilité — un nettoyage régulier est recommandé.\n\nLes lignes de guidage dynamiques aident au guidage mais ne couvrent pas tous les angles morts en ville dense.`,
      bodyAr: `أجهزة الاستشعار والكاميرا الخلفية تسهّل المناورة. كاميرات 360° موجودة في الفئات العليا. النظافة مهمة في الغبار.`,
    },
  ];

  const cons =
    p.consumptionL100 != null
      ? `${p.consumptionL100} l/100 km (mixte indicatif catalogue)`
      : p.fuel === "ELECTRIC"
        ? "consommation électrique exprimée en kWh/100 km sur la fiche constructeur"
        : "valeur à confirmer selon homologation WLTP";

  const co2Line =
    p.co2Gkm != null
      ? `émissions de CO₂ en cycle mixte WLTP indicatif : environ ${p.co2Gkm} g/km`
      : `émissions de CO₂ : à confirmer sur la vignette CO₂ du véhicule neuf ou la documentation importateur`;

  const environmentFr = `Consommation et émissions — ${label} (${p.versionFr}).\n\n${p.fuel === "ELECTRIC" ? "Pour un véhicule électrique, l’autonomie et la consommation en kWh/100 km varient selon le profil de conduite, la température et l’usage climatique — fréquent au Maroc." : `Consommation de carburant indicatif en cycle mixte : ${cons}. ${co2Line}.`}\n\nLes valeurs WLTP / NEDC sont des références de laboratoire ; la consommation réelle dépend du style de conduite, de la charge à bord, du relief et du trafic. Pour les motorisations essence, l’usage d’une essence conforme aux spécifications constructeur (indice d’octane) préserve les performances et le moteur ; votre distributeur ${p.brandFr} ou importateur local peut préciser les carburants autorisés au Maroc.\n\nDocumentation environnementale : les valeurs officielles des véhicules neufs sont disponibles auprès des autorités compétentes dans votre pays ; au sein de l’Union européenne, le « Guide CO2 » et bases équivalentes servent de référence pour comparer les modèles neufs. Auto Maroc affiche des données **indicatives** pour la décision d’achat — contractuelles uniquement sur le bon de commande et la homologation locale.`;

  const environmentAr = `الاستهلاك والانبعاثات — ${p.brandAr} ${p.modelAr} (${p.versionAr}).\n\n${p.fuel === "ELECTRIC" ? "للسيارة الكهربائية، تختلف المدى واستهلاك الكيلوواط ساعة لكل 100 كم حسب القيادة والحرارة والتكييف." : `استهلاك وقود إرشادي: ${cons}. ${p.co2Gkm != null ? `ثاني أكسيد الكربون تقريبًا ${p.co2Gkm} غ/كم (إرشادي).` : "قيم CO₂ من الوثائق الرسمية."}`}\n\nالقيم المعملية تختلف عن الواقع حسب الطريق والحمولة. استخدم وقودًا مطابقًا لمواصفات الصانع.\n\nالبيانات هنا **إرشادية**؛ المرجع النهائي هو الوكيل والترخيص المحلي.`;

  const disclaimerFr = `Location / financement / leasing : toute simulation affichée sur des sites constructeurs étrangers ne s’applique pas automatiquement au Maroc (dirham, fiscalité, durée, kilométrage). Tarifs TTC/TVA, frais d’immatriculation et décotes résiduelles sont communiqués par votre concessionnaire ou banque partenaire.\n\nAuto Maroc est une aide à la décision : les textes longs du catalogue sont générés à titre **indicatif** et rédigés pour illustrer le niveau d’information attendu sur une fiche moderne ; ils ne reproduisent pas une brochure officielle ${p.brandFr} et peuvent contenir des généralisations du segment ${seg}.`;

  const disclaimerAr = `التمويل أو الإيجار: أي عرض على مواقع أجنبية لا ينطبق تلقائيًا على المغرب (العملة، الضرائب، الكيلومتراج). الأسعار النهائية من الوكيل أو البنك.\n\nAuto Maroc للمساعدة فقط؛ النصوص الطويلة **إرشادية** وليست نشرة رسمية من ${p.brandAr}.`;

  const faq: ProductStory["faq"] = [
    {
      qFr: `Depuis quand existe la gamme ${p.modelFr} chez ${p.brandFr} ?`,
      qAr: `متى ظهرت عائلة ${p.modelAr} لدى ${p.brandAr}؟`,
      aFr: `Les premières générations et années de lancement varient selon les marchés. Pour une chronologie précise (millésimes, restylages), consultez la documentation historique ${p.brandFr} ou une encyclopédie automobile. Notre catalogue indique l’année modèle ${p.year} pour la fiche démo.`,
      aAr: `تختلف الأجيال حسب السوق. للتواريخ الدقيقة راجع أرشيف الصانع. الكتالوج يستخدم سنة ${p.year} كمرجع.`,
    },
    {
      qFr: `Quelle puissance pour ${label} — finition ${p.versionFr} ?`,
      qAr: `ما قدرة ${p.modelAr} للنسخة ${p.versionAr}؟`,
      aFr: `La puissance kW/ch dépend du moteur exact et du pays d’homologation. Les valeurs du catalogue Auto Maroc sont **indicatives** ; le certificat de conformité et la carte grise après immatriculation font foi.`,
      aAr: `القدرة تعتمد على المحرك الدقيق. القيم هنا إرشادية؛ الوثائق الرسمية بعد التسجيل هي المرجع.`,
    },
    {
      qFr: `${label} existe-t-elle en version entièrement électrique ?`,
      qAr: `هل يوجد نسخة كهرباء بالكامل من ${p.modelAr}؟`,
      aFr:
        p.fuel === "ELECTRIC"
          ? `Cette fiche catalogue correspond à une variante ${motor}. D’autres motorisations peuvent exister sur le même modèle (hybride, essence) selon pays.`
          : `Selon le marché et l’année, une variante EV ou hybride rechargeable peut être proposée ou non. Vérifiez la gamme actuelle auprès de l’importateur au Maroc.`,
      aAr:
        p.fuel === "ELECTRIC"
          ? `هذه البطاقة لنسخة كهربائية؛ قد تتوفر نسخ أخرى في السوق.`
          : `قد تتوفر نسخ كهربائية أو هجينة حسب السنة والسوق — اسأل الوكيل.`,
    },
    {
      qFr: `Quels niveaux de finition ou modèles sont disponibles pour ${p.modelFr} ?`,
      qAr: `ما الفئات المتاحة لـ ${p.modelAr}؟`,
      aFr: `Les appellations (Essential, Sport, M Sport, Pack Business, etc.) changent selon l’année et le distributeur. Notre entrée « ${p.versionFr} » illustre une motorisation type ; la liste complète des packs et options est disponible chez le concessionnaire.`,
      aAr: `تسميات الفئات تتغير حسب السنة. النسخة « ${p.versionAr} » مثال؛ القائمة الكاملة من الوكيل.`,
    },
    {
      qFr: `Où est fabriquée ${label} ?`,
      qAr: `أين تُصنع ${p.modelAr}؟`,
      aFr: `Les sites de production sont multiples pour une même famille de modèles (usines en Europe, Amérique du Nord, Asie ou Afrique selon groupe et plateforme). Le pays d’origine figurant sur l’étiquette du véhicule importé au Maroc est indiqué sur les documents douaniers et la plaque constructeur.`,
      aAr: `مصانع متعددة حسب المنصة. بلد المنشأ يظهر في الوثائق الجمركية ولاصقة الهيكل.`,
    },
  ];

  return {
    sections,
    faq,
    environmentFr,
    environmentAr,
    disclaimerFr,
    disclaimerAr,
  };
}
