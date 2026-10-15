import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ReviewOrigin } from "@prisma/client";
import { derivePopularIssues } from "@/lib/car-pros-cons";
import { isDatabaseConfigured } from "@/lib/db-ready";
import { prisma } from "@/lib/prisma";
import { DatabaseRequiredMessage } from "@/components/DatabaseRequiredMessage";
import { getDisplayCarImageUrls } from "@/lib/car-images";
import { resolveExteriorColors } from "@/lib/exterior-color";
import { resolveBrandLogoUrl } from "@/lib/brand-assets";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ScoreGauge } from "@/components/ScoreGauge";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { IconArrowRight, IconChevronRight, IconExternal } from "@/components/ui/icons";
import { btnPrimary, btnSecondary, container, eyebrow, focusRing } from "@/components/ui/styles";
import { parseFicheEquipement } from "@/lib/car-fiche-equipment";
import { CarEquipmentSheet } from "@/components/CarEquipmentSheet";
import { officialModelShowroomUrl } from "@/lib/brand-model-official-links";
import { parseProductStory } from "@/lib/car-product-story";
import { buildProductStoryPayload } from "@/lib/car-product-story-build";
import { CarProductStory } from "@/components/CarProductStory";
import { CarAiChat } from "@/components/CarAiChat";
import { isOpenAiConfigured } from "@/lib/openai-env";
import { Car3DViewer } from "@/components/Car3DViewer";
import { buildCarCriteriaRatings, type CarCriterionId } from "@/lib/car-criteria-ratings";
import { CarCriteriaStars } from "@/components/CarCriteriaStars";
import { Reveal } from "@/components/motion/Reveal";
import { BrandLogo } from "@/components/vehicle/BrandLogo";
import { PriceBlock } from "@/components/vehicle/PriceBlock";
import { SpecsGrid, type EssentialSpec } from "@/components/vehicle/SpecsGrid";
import { StickyCTA } from "@/components/vehicle/StickyCTA";
import { VehicleCard } from "@/components/vehicle/VehicleCard";
import { VehicleGallery } from "@/components/vehicle/VehicleGallery";
import { formatPriceDh, getSimilarVehicles, kwToHp, positivePrice } from "@/lib/showcase";
import { bodyLabel, conditionLabel, fuelLabel, gearboxLabel } from "@/lib/vehicle-labels";
import {
  carSpecComfort,
  carSpecDimensions,
  carSpecEngine,
  carSpecPartsAvailability,
  carSpecSafety,
} from "@/lib/car-specs-locale";
import {
  carBrandLabel,
  carModelLabel,
  carVersionLabel,
  pickLocaleText,
  reviewComment,
  reviewDisplayLabel,
} from "@/lib/locale-text";
import { findApprovedReviewsForCar } from "@/lib/car-model-reviews";

export const dynamic = "force-dynamic";

function reviewOriginLabel(
  origin: ReviewOrigin,
  t: (key: string) => string,
): string | null {
  switch (origin) {
    case ReviewOrigin.CATALOG_DEMO:
      return t("reviewOriginCatalog");
    case ReviewOrigin.IMPORT:
      return t("reviewOriginImport");
    case ReviewOrigin.USER:
      return t("reviewOriginUser");
    default:
      return null;
  }
}

function reviewToneKind(globalNote: number | null): "positive" | "critical" | "mixed" {
  if (globalNote == null) return "mixed";
  if (globalNote >= 4) return "positive";
  if (globalNote <= 2) return "critical";
  return "mixed";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  if (!isDatabaseConfigured()) return {};
  try {
    const car = await prisma.car.findUnique({
      where: { id },
      select: {
        id: true,
        brandAr: true,
        brandFr: true,
        modelAr: true,
        modelFr: true,
        versionAr: true,
        versionFr: true,
        year: true,
        descriptionAr: true,
        descriptionFr: true,
        imageUrl: true,
        imageUrls: true,
      },
    });
    if (!car) return {};
    const name = `${carBrandLabel(car, locale)} ${carModelLabel(car, locale)} ${car.year}`;
    const description = pickLocaleText(locale, car.descriptionAr, car.descriptionFr).slice(0, 160);
    const cover = getDisplayCarImageUrls(car)[0];
    return {
      title: `${name} — ${carVersionLabel(car, locale)} | Auto Maroc`,
      description: description || undefined,
      openGraph: cover ? { images: [{ url: cover }] } : undefined,
    };
  } catch {
    return {};
  }
}

/* Catalogues pros/cons et `derivePopularIssues` : voir `@/lib/car-pros-cons`. */

export default async function CarDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  if (!isDatabaseConfigured()) {
    return <DatabaseRequiredMessage />;
  }

  const { locale, id } = await params;
  const loc = locale === "ar" ? "ar" : "fr";
  const [carBase, t, tc, tu, tcat] = await Promise.all([
    prisma.car.findUnique({
      where: { id },
      include: {
        specs: true,
      },
    }),
    getTranslations("car"),
    getTranslations("common"),
    getTranslations("ui"),
    getTranslations("catalog"),
  ]);
  if (!carBase) notFound();

  const [{ reviews: modelYearReviews, scope: reviewScope, siblingCarIds }, similar] = await Promise.all([
    findApprovedReviewsForCar(carBase),
    getSimilarVehicles(carBase, loc, 3).catch(() => []),
  ]);

  const car = { ...carBase, reviews: modelYearReviews };

  const brand = carBrandLabel(car, locale);
  const model = carModelLabel(car, locale);
  const version = carVersionLabel(car, locale);
  const title = locale === "ar" ? `${brand} ${model} — ${version}` : `${brand} ${model}`;
  const price = positivePrice(car.priceNewEst);

  const images = getDisplayCarImageUrls(car);
  const logoUrl = resolveBrandLogoUrl(car.brandFr, car.brandLogoUrl);
  const fiche = car.specs ? parseFicheEquipement(car.specs.ficheEquipement) : null;
  const officialModelPageUrl = officialModelShowroomUrl(car.brandFr, car.modelFr);
  const exterior = resolveExteriorColors(car);
  const descriptionBase = pickLocaleText(locale, car.descriptionAr, car.descriptionFr);
  const descriptionWithColor = `${descriptionBase}\n\n${t("exteriorColorInDescription", {
    color: locale === "ar" ? exterior.ar : exterior.fr,
  })}`;
  const highlights = pickLocaleText(locale, car.highlightsAr, car.highlightsFr);

  const productStory =
    parseProductStory(car.specs?.productStory) ??
    buildProductStoryPayload({
      brandFr: car.brandFr ?? "—",
      brandAr: car.brandAr,
      modelFr: car.modelFr ?? "—",
      modelAr: car.modelAr,
      bodyType: car.bodyType,
      fuel: car.fuel,
      versionFr: car.versionFr ?? car.versionAr,
      versionAr: car.versionAr,
      year: car.year,
      co2Gkm: car.specs?.co2Gkm ?? null,
      consumptionL100: car.specs?.consumptionL100 ?? null,
    });
  const popularIssues = derivePopularIssues(
    car.reviews,
    {
      id: car.id,
      fuel: car.fuel,
      transmission: car.transmission,
      bodyType: car.bodyType,
      priceNewEst: car.priceNewEst,
      year: car.year,
      brandFr: car.brandFr,
      brandAr: car.brandAr,
    },
    locale,
  );

  const criteriaRatings = buildCarCriteriaRatings({
    specs: car.specs,
    fuel: car.fuel,
    priceNewEst: car.priceNewEst,
    reviews: car.reviews,
  });
  const criteriaLabelKey: Record<CarCriterionId, "criteriaComfort" | "criteriaConsumption" | "criteriaReliability" | "criteriaResale" | "criteriaMaintenance" | "criteriaOverall"> = {
    comfort: "criteriaComfort",
    consumption: "criteriaConsumption",
    reliability: "criteriaReliability",
    resale: "criteriaResale",
    maintenance: "criteriaMaintenance",
    overall: "criteriaOverall",
  };
  const criteriaRows = criteriaRatings.map((row) => ({
    ...row,
    label: t(criteriaLabelKey[row.id]),
  }));
  const overallCriteriaPct = criteriaRatings.find((r) => r.id === "overall")?.percentage ?? 72;

  const specEngine = carSpecEngine(car.specs, locale);
  const specDimensions = carSpecDimensions(car.specs, locale);
  const specParts = carSpecPartsAvailability(car.specs, locale);
  const specSafety = carSpecSafety(car.specs, locale);
  const specComfort = carSpecComfort(car.specs, locale);
  const specWarranty = car.specs ? pickLocaleText(locale, car.specs.warrantyAr, car.specs.warrantyFr) : "";

  const viewer3dExterior = car.specs?.viewer3dExteriorUrl?.trim() || null;
  const viewer3dInterior = car.specs?.viewer3dInteriorUrl?.trim() || null;
  const hasViewer3d = Boolean(viewer3dExterior || viewer3dInterior);
  const officialHref = car.officialUrl || officialModelPageUrl;

  const nf = loc === "ar" ? "ar-MA" : "fr-FR";
  const num = (n: number) => n.toLocaleString(nf);
  const s = car.specs;
  const powerHp = kwToHp(s?.realPowerKw);
  const essentials: EssentialSpec[] = [
    powerHp != null ? { key: "power", label: tu("powerLabel"), value: num(powerHp), unit: tu("powerUnit") } : null,
    s?.torqueNm != null && s.torqueNm > 0 ? { key: "torque", label: tu("torqueLabel"), value: num(s.torqueNm), unit: "N·m" } : null,
    s?.consumptionL100 != null && s.consumptionL100 > 0
      ? { key: "consumption", label: tu("consumptionLabel"), value: num(s.consumptionL100), unit: "L/100 km" }
      : null,
    s?.co2Gkm != null && s.co2Gkm > 0 ? { key: "co2", label: tu("co2Label"), value: num(s.co2Gkm), unit: "g/km" } : null,
    s?.seats != null && s.seats > 0 ? { key: "seats", label: tu("seatsLabel"), value: num(s.seats) } : null,
    s?.trunkL != null && s.trunkL > 0 ? { key: "trunk", label: tu("trunkLabel"), value: num(s.trunkL), unit: "L" } : null,
    s?.fiscalPower != null && s.fiscalPower > 0 ? { key: "fiscal", label: tu("fiscalLabel"), value: num(s.fiscalPower), unit: tu("fiscalUnit") } : null,
  ].filter((x): x is EssentialSpec => x != null);

  const fullSpecs: { key: string; label: string; value: string; wide?: boolean }[] = [
    { key: "version", label: tu("versionLabel"), value: version },
    { key: "year", label: tu("yearLabel"), value: String(car.year) },
    { key: "fuel", label: tu("fuelLabel"), value: fuelLabel(tcat, car.fuel) },
    { key: "gearbox", label: tu("gearboxLabel"), value: gearboxLabel(tcat, car.transmission) },
    { key: "body", label: tu("bodyLabel"), value: bodyLabel(tcat, car.bodyType) },
    specEngine ? { key: "engine", label: tu("engineLabel"), value: specEngine, wide: true } : null,
    specDimensions ? { key: "dimensions", label: tu("dimensionsLabel"), value: specDimensions } : null,
    s?.groundClearanceMm != null && s.groundClearanceMm > 0
      ? { key: "clearance", label: tu("groundClearanceLabel"), value: `${num(s.groundClearanceMm)} mm` }
      : null,
    s?.maintenanceCostEst != null && s.maintenanceCostEst > 0
      ? { key: "maintenance", label: tu("maintenanceLabel"), value: `${num(s.maintenanceCostEst)} MAD / an` }
      : null,
    specWarranty ? { key: "warranty", label: tu("warrantyLabel"), value: specWarranty } : null,
    specSafety ? { key: "safety", label: tu("safetyLabel"), value: specSafety, wide: true } : null,
    specComfort ? { key: "comfort", label: tu("comfortLabel"), value: specComfort, wide: true } : null,
    specParts ? { key: "parts", label: t("parts"), value: specParts, wide: true } : null,
  ].filter((x): x is { key: string; label: string; value: string; wide?: boolean } => x != null);

  const chips = [fuelLabel(tcat, car.fuel), gearboxLabel(tcat, car.transmission), bodyLabel(tcat, car.bodyType)];

  return (
    <article className="pb-28 lg:pb-24">
      <nav aria-label="Breadcrumb" className={`${container} pt-6`}>
        <ol className="flex flex-wrap items-center gap-1.5 text-[13px] text-steel">
          <li>
            <Link href="/catalog" className={`rounded hover:text-fg ${focusRing}`}>
              {tu("breadcrumbCatalog")}
            </Link>
          </li>
          <li aria-hidden>
            <IconChevronRight size={13} className="rtl:rotate-180" />
          </li>
          <li>
            <Link href={`/catalog?brand=${encodeURIComponent(car.brandFr?.trim() || car.brandAr.trim())}`} className={`rounded hover:text-fg ${focusRing}`}>
              {brand}
            </Link>
          </li>
          <li aria-hidden>
            <IconChevronRight size={13} className="rtl:rotate-180" />
          </li>
          <li aria-current="page" className="text-fg-muted">
            {model}
          </li>
        </ol>
      </nav>

      <section className={`${container} mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.65fr)_minmax(340px,1fr)] lg:gap-10`}>
        <div className="min-w-0">
          <VehicleGallery images={images} alt={`${brand} ${model} ${car.year}`} />
        </div>

        <aside className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
          <div className="rounded-[16px] border border-line bg-graphite p-6 sm:p-8">
            <div className="flex items-center gap-2.5">
              <BrandLogo src={logoUrl} size={24} />
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-fg-muted">{brand}</p>
            </div>
            <h1 className="mt-4 text-4xl font-semibold leading-[1.02] tracking-[-0.035em] text-fg sm:text-5xl">{model}</h1>
            <p className="mt-3 text-sm leading-relaxed text-steel">
              {version} · {car.year}
            </p>

            <ul className="mt-6 flex flex-wrap gap-2">
              {chips.map((c) => (
                <li key={c} className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-fg-muted">
                  {c}
                </li>
              ))}
              <li className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-fg-muted">
                {conditionLabel(tu, car.conditionDefault)}
              </li>
            </ul>

            {price != null ? (
              <div className="mt-8 border-t border-line pt-6">
                <PriceBlock price={price} />
              </div>
            ) : null}

            <div className="mt-8 grid gap-3">
              <Link href={`/compare?a=${car.id}`} className={`${btnPrimary} w-full`}>
                {tc("compareLink")}
                <IconArrowRight size={16} className="rtl:rotate-180" />
              </Link>
              <div className="grid grid-cols-2 gap-3">
                <Link href="/catalog" className={`${btnSecondary} w-full`}>
                  {tu("breadcrumbCatalog")}
                </Link>
                {hasViewer3d ? (
                  <a href="#visite-3d" className={`${btnSecondary} w-full`}>
                    {tu("view3d")}
                  </a>
                ) : officialHref ? (
                  <a href={officialHref} target="_blank" rel="noopener noreferrer" className={`${btnSecondary} w-full`}>
                    {tu("officialSite")}
                    <IconExternal size={14} />
                  </a>
                ) : null}
              </div>
            </div>

            <a
              href="#notes-criteres"
              className={`mt-6 flex items-center justify-between gap-4 rounded-[12px] border border-line p-4 transition hover:border-line-strong ${focusRing}`}
            >
              <span>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-steel">{t("scores")}</span>
                <span className="mt-1 block text-sm font-medium text-fg">{t("criteriaTitle")}</span>
              </span>
              <span className="shrink-0 scale-[0.6] origin-right rtl:origin-left">
                <ScoreGauge value={overallCriteriaPct} />
              </span>
            </a>
          </div>
        </aside>
      </section>

      <div className={`${container} mt-20 space-y-20 sm:mt-28 sm:space-y-28`}>
        {essentials.length > 0 ? (
          <section aria-labelledby="essentials-title">
            <Reveal>
              <SectionHeading id="essentials-title" eyebrow={tu("essentialsEyebrow")} title={tu("essentialsTitle")} />
            </Reveal>
            <Reveal className="mt-10" delay={80}>
              <SpecsGrid specs={essentials} />
            </Reveal>
          </section>
        ) : null}

        <section className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-16" aria-labelledby="description-title">
          <Reveal>
            <p className={eyebrow}>{tu("detailsEyebrow")}</p>
            <h2 id="description-title" className="text-balance mt-3 text-3xl font-semibold leading-[1.05] tracking-[-0.03em] text-fg sm:text-4xl">
              {tu("descriptionTitle")}
            </h2>
            {officialHref ? (
              <a
                href={officialHref}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent underline-offset-4 hover:underline ${focusRing}`}
              >
                {tu("officialSite")}
                <IconExternal size={14} />
              </a>
            ) : null}
          </Reveal>
          <Reveal delay={80} className="space-y-6">
            <p className="whitespace-pre-line text-base leading-[1.75] text-fg-muted sm:text-[17px]">{descriptionWithColor}</p>
            {highlights ? (
              <div className="rounded-[14px] border border-line bg-graphite p-6">
                <h3 className="text-sm font-semibold text-fg">{t("highlights")}</h3>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-fg-muted">{highlights}</p>
              </div>
            ) : null}
          </Reveal>
        </section>

        <section aria-labelledby="specs-title">
          <Reveal>
            <SectionHeading id="specs-title" eyebrow={t("specs")} title={tu("specsTitle")} />
          </Reveal>
          <Reveal delay={80}>
            <dl className="mt-10 grid border-t border-line sm:grid-cols-2 sm:gap-x-12">
              {fullSpecs.map((row) => (
                <div
                  key={row.key}
                  className={`grid gap-1 border-b border-line py-5 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-6 ${row.wide ? "sm:col-span-2 sm:grid-cols-[180px_minmax(0,1fr)]" : ""}`}
                >
                  <dt className="text-[13px] font-medium text-steel">{row.label}</dt>
                  <dd className="text-[15px] leading-relaxed text-fg">{row.value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </section>

        {hasViewer3d ? (
          <div id="visite-3d" className="scroll-mt-28">
            <Card padding="p-5 sm:p-6 md:p-8">
              <Car3DViewer
                exteriorUrl={viewer3dExterior}
                interiorUrl={viewer3dInterior}
                title={t("viewer3dTitle")}
                tabExterior={t("viewer3dExterior")}
                tabInterior={t("viewer3dInterior")}
                missingText={t("viewer3dMissing")}
              />
            </Card>
          </div>
        ) : null}

        <Card padding="p-6 sm:p-8 md:p-10">
          <CarProductStory story={productStory} locale={locale} />
        </Card>

        {fiche ? <CarEquipmentSheet fiche={fiche} locale={locale} /> : null}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div id="notes-criteres" className="scroll-mt-28">
            <Card padding="p-5 sm:p-6 md:p-8" className="h-full">
              <CarCriteriaStars title={t("criteriaTitle")} hint={t("criteriaHint")} rows={criteriaRows} />
            </Card>
          </div>
          <Card padding="p-5 sm:p-6 md:p-8" className="h-full">
            <h2 className="text-lg font-semibold text-fg">{t("popularIssuesTitle")}</h2>
            <p className="mt-2 text-xs text-steel">{t("popularIssuesHint")}</p>
            <ul className="mt-5 space-y-2">
              {popularIssues.map((issue, i) => (
                <li key={`${issue}-${i}`} className="rounded-[10px] border border-line bg-white/[0.02] px-4 py-3 text-sm text-fg-muted">
                  {issue}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <Card padding="p-5 sm:p-6 md:p-8">
          <CarAiChat
            carId={car.id}
            locale={loc}
            vehicleLabel={title}
            openAiEnabled={isOpenAiConfigured()}
          />
        </Card>

        <section aria-labelledby="reviews-title">
          <h2 id="reviews-title" className="text-3xl font-semibold tracking-[-0.03em] text-fg">
            {t("reviews")}
          </h2>
          {siblingCarIds.length > 1 ? <p className="mt-2 text-xs text-steel">{t("reviewsSameModelYearHint")}</p> : null}
          {reviewScope === "model-any-year" ? <p className="mt-2 text-xs text-accent">{t("reviewsOtherYearsHint")}</p> : null}
          {car.reviews.length === 0 ? (
            <div className="mt-6 space-y-3 rounded-[14px] border border-dashed border-line-strong bg-graphite p-6 text-sm leading-relaxed text-fg-muted">
              <p>{t("reviewsEmpty")}</p>
              <p className="text-steel">{t("reviewsEmptyCta")}</p>
            </div>
          ) : (
            <ul className="mt-6 grid gap-4 md:grid-cols-2">
              {car.reviews.map((r) => {
                const tone = reviewToneKind(r.globalNote);
                const toneLabel =
                  tone === "positive" ? t("reviewTonePositive") : tone === "critical" ? t("reviewToneCritical") : t("reviewToneMixed");
                const originLabel = reviewOriginLabel(r.reviewOrigin, t);
                return (
                  <li key={r.id} className="rounded-[14px] border border-line bg-graphite p-5 sm:p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={tone === "positive" ? "success" : tone === "critical" ? "warning" : "neutral"}>{toneLabel}</Badge>
                      {originLabel ? <Badge tone="neutral">{originLabel}</Badge> : null}
                      {r.globalNote != null && (
                        <span className="text-xs font-semibold tabular-nums text-fg-muted">
                          {t("globalNote")} : {r.globalNote}/5
                        </span>
                      )}
                    </div>
                    <p className="mt-4 text-[15px] leading-relaxed text-fg">{reviewComment(r, locale)}</p>
                    <p className="mt-4 text-xs font-semibold text-fg-muted">{reviewDisplayLabel(r, locale)}</p>
                    {(r.sourceName || r.sourceUrl) && (
                      <p className="mt-1 text-xs text-steel">
                        {t("reviewSource")} {r.sourceName}
                        {r.sourceUrl ? (
                          <>
                            {" "}
                            <a
                              href={r.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-accent underline-offset-2 hover:underline"
                            >
                              {t("reviewSourceLink")}
                            </a>
                          </>
                        ) : null}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {similar.length > 0 ? (
          <section aria-labelledby="similar-title">
            <Reveal>
              <SectionHeading id="similar-title" eyebrow={tu("similarEyebrow")} title={tu("similarTitle")} />
              <p className="mt-3 text-sm text-steel">{tu("similarHint")}</p>
            </Reveal>
            <ul className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 xl:gap-6">
              {similar.map((v, i) => (
                <Reveal as="li" key={v.id} delay={i * 70}>
                  <VehicleCard car={v} />
                </Reveal>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      <StickyCTA
        title={`${brand} ${model}`}
        info={
          price != null ? (
            <p className="text-base font-semibold tabular-nums text-fg">{formatPriceDh(price, locale)}</p>
          ) : (
            <p className="text-sm font-medium text-fg">{car.year}</p>
          )
        }
        action={
          <Link href={`/compare?a=${car.id}`} className={`${btnPrimary} px-5`}>
            {tc("compareLink")}
          </Link>
        }
      />
    </article>
  );
}
