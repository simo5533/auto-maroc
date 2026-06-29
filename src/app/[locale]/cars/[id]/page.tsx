import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ReviewOrigin } from "@prisma/client";
import { derivePopularIssues } from "@/lib/car-pros-cons";
import Image from "next/image";
import { isDatabaseConfigured } from "@/lib/db-ready";
import { prisma } from "@/lib/prisma";
import { DatabaseRequiredMessage } from "@/components/DatabaseRequiredMessage";
import { ensureRealVehicleImages } from "@/lib/vehicle-images-resolve";
import { resolveExteriorColors } from "@/lib/exterior-color";
import { resolveBrandLogoUrl } from "@/lib/brand-assets";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ScoreGauge } from "@/components/ScoreGauge";
import { btnPrimary, btnSecondary } from "@/components/ui/styles";
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

function reviewToneKind(globalNote: number | null): "positive" | "critical" | "mixed" {
  if (globalNote == null) return "mixed";
  if (globalNote >= 4) return "positive";
  if (globalNote <= 2) return "critical";
  return "mixed";
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
  const [carBase, t, tc] = await Promise.all([
    prisma.car.findUnique({
      where: { id },
      include: {
        specs: true,
      },
    }),
    getTranslations("car"),
    getTranslations("common"),
  ]);
  if (!carBase) notFound();

  /** Toutes les fiches « même modèle + même année » (plusieurs versions / motorisations). */
  const siblingCarIds = await prisma.car.findMany({
    where: {
      year: carBase.year,
      brandAr: carBase.brandAr,
      modelAr: carBase.modelAr,
    },
    select: { id: true },
  });

  const modelYearReviews = await prisma.review.findMany({
    where: {
      carId: { in: siblingCarIds.map((r) => r.id) },
      status: "APPROVED",
      NOT: { reviewOrigin: ReviewOrigin.CATALOG_DEMO },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const car = { ...carBase, reviews: modelYearReviews };

  const title =
    locale === "ar"
      ? `${car.brandAr} ${car.modelAr} — ${car.versionAr}`
      : `${car.brandFr ?? car.brandAr} ${car.modelFr ?? car.modelAr}`;

  const images = await ensureRealVehicleImages(prisma, car);
  const logoUrl = resolveBrandLogoUrl(car.brandFr, car.brandLogoUrl);
  const fiche = car.specs ? parseFicheEquipement(car.specs.ficheEquipement) : null;
  const officialModelPageUrl = officialModelShowroomUrl(car.brandFr, car.modelFr);
  const exterior = resolveExteriorColors(car);
  const descriptionBase =
    locale === "ar" ? car.descriptionAr : car.descriptionFr ?? car.descriptionAr;
  const descriptionWithColor = `${descriptionBase}\n\n${t("exteriorColorInDescription", {
    color: locale === "ar" ? exterior.ar : exterior.fr,
  })}`;

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

  const viewer3dExterior = car.specs?.viewer3dExteriorUrl?.trim() || null;
  const viewer3dInterior = car.specs?.viewer3dInteriorUrl?.trim() || null;
  const hasViewer3d = Boolean(viewer3dExterior || viewer3dInterior);

  return (
    <article className="space-y-8">
      <PageHeader
        eyebrow={car.year.toString()}
        title={title}
        description={descriptionWithColor}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href={`/compare?a=${car.id}`} className={btnPrimary}>
              {tc("compareLink")}
            </Link>
            <Link href="/catalog" className={btnSecondary}>
              {tc("backCatalog")}
            </Link>
            {hasViewer3d ? (
              <a href="#visite-3d" className={btnSecondary}>
                {t("viewer3dJumpLink")}
              </a>
            ) : null}
          </div>
        }
      />

      {(logoUrl || car.officialUrl) && (
        <div className="flex flex-wrap items-center gap-5 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          {logoUrl ? (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl ring-1 ring-zinc-200">
              <Image src={logoUrl} alt="" width={64} height={64} className="object-contain p-1" unoptimized />
            </div>
          ) : null}
          {car.officialUrl ? (
            <a
              href={car.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-emerald-700 underline-offset-2 hover:underline"
            >
              {t("officialLink")}
            </a>
          ) : null}
        </div>
      )}

      {images.length > 0 ? (
        <Card padding="p-4 sm:p-5">
          <h2 className="text-lg font-bold text-zinc-900">{t("photos")}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {images.map((src, i) => (
              <div
                key={`${src}-${i}`}
                className={`relative overflow-hidden rounded-2xl bg-zinc-100 ring-1 ring-zinc-200 ${i === 0 ? "sm:col-span-2 sm:row-span-2 min-h-[300px]" : "aspect-video min-h-[160px]"}`}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  unoptimized
                  className="object-cover"
                  sizes={i === 0 ? "(max-width:768px) 100vw, 50vw" : "(max-width:768px) 50vw, 25vw"}
                />
              </div>
            ))}
          </div>
        </Card>
      ) : null}

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

      {officialModelPageUrl ? (
        <Card padding="p-5 sm:p-6">
          <p className="text-base leading-relaxed text-zinc-700">{t("officialModelGalleryIntro")}</p>
          <a
            href={officialModelPageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex flex-wrap items-center gap-2 font-semibold text-emerald-700 underline-offset-2 hover:underline"
          >
            {t("officialModelGalleryCta")}
          </a>
          <p className="mt-3 text-sm text-zinc-500">{t("officialModelGalleryHint")}</p>
        </Card>
      ) : null}

      {(car.highlightsAr || car.highlightsFr) && (
        <Card padding="p-5 sm:p-6">
          <h2 className="text-lg font-bold text-zinc-900">{t("highlights")}</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-zinc-800">
            {locale === "ar" ? car.highlightsAr ?? "" : car.highlightsFr ?? car.highlightsAr ?? ""}
          </p>
        </Card>
      )}

      <Card padding="p-6 sm:p-8 md:p-10">
        <CarProductStory story={productStory} locale={locale} />
      </Card>

      {fiche ? <CarEquipmentSheet fiche={fiche} locale={locale} /> : null}

      <Card padding="p-5 sm:p-6 md:p-8">
        <CarAiChat
          carId={car.id}
          locale={locale === "ar" ? "ar" : "fr"}
          vehicleLabel={title}
          openAiEnabled={isOpenAiConfigured()}
        />
      </Card>

      <div id="notes-criteres" className="scroll-mt-24">
        <Card padding="p-5 sm:p-6 md:p-8">
          <CarCriteriaStars title={t("criteriaTitle")} hint={t("criteriaHint")} rows={criteriaRows} />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          <Card>
            <h2 className="text-xl font-bold text-zinc-900 sm:text-2xl">{t("specs")}</h2>
            <dl className="mt-4 grid gap-4 text-base sm:grid-cols-2">
              <div className="rounded-xl bg-zinc-50 p-4 ring-1 ring-zinc-100">
                <dt className="text-sm font-medium uppercase tracking-wide text-zinc-500">Fuel</dt>
                <dd className="mt-1 font-semibold text-zinc-900">{car.fuel}</dd>
              </div>
              <div className="rounded-xl bg-zinc-50 p-4 ring-1 ring-zinc-100">
                <dt className="text-sm font-medium uppercase tracking-wide text-zinc-500">Transmission</dt>
                <dd className="mt-1 font-semibold text-zinc-900">{car.transmission}</dd>
              </div>
              {car.specs?.engineAr && (
                <div className="rounded-xl bg-zinc-50 p-4 ring-1 ring-zinc-100 sm:col-span-2">
                  <dt className="text-sm font-medium uppercase tracking-wide text-zinc-500">Motorisation</dt>
                  <dd className="mt-1 font-semibold text-zinc-900">
                    {locale === "ar" ? car.specs.engineAr : car.specs.engineFr ?? car.specs.engineAr}
                  </dd>
                </div>
              )}
              {car.specs?.consumptionL100 != null && (
                <div className="rounded-xl bg-zinc-50 p-4 ring-1 ring-zinc-100">
                  <dt className="text-sm font-medium uppercase tracking-wide text-zinc-500">Consommation</dt>
                  <dd className="mt-1 font-semibold text-zinc-900">{car.specs.consumptionL100} L/100 km</dd>
                </div>
              )}
              {car.specs?.dimensionsAr && (
                <div className="rounded-xl bg-zinc-50 p-4 ring-1 ring-zinc-100">
                  <dt className="text-sm font-medium uppercase tracking-wide text-zinc-500">Dimensions</dt>
                  <dd className="mt-1 font-semibold text-zinc-900">{car.specs.dimensionsAr}</dd>
                </div>
              )}
              {car.specs?.seats != null && (
                <div className="rounded-xl bg-zinc-50 p-4 ring-1 ring-zinc-100">
                  <dt className="text-sm font-medium uppercase tracking-wide text-zinc-500">Places</dt>
                  <dd className="mt-1 font-semibold text-zinc-900">{car.specs.seats}</dd>
                </div>
              )}
              {car.specs?.trunkL != null && (
                <div className="rounded-xl bg-zinc-50 p-4 ring-1 ring-zinc-100">
                  <dt className="text-sm font-medium uppercase tracking-wide text-zinc-500">Coffre</dt>
                  <dd className="mt-1 font-semibold text-zinc-900">{car.specs.trunkL} L</dd>
                </div>
              )}
              {car.specs?.co2Gkm != null && (
                <div className="rounded-xl bg-zinc-50 p-4 ring-1 ring-zinc-100">
                  <dt className="text-sm font-medium uppercase tracking-wide text-zinc-500">{t("co2")}</dt>
                  <dd className="mt-1 font-semibold text-zinc-900">{car.specs.co2Gkm} g/km</dd>
                </div>
              )}
              {car.specs?.torqueNm != null && (
                <div className="rounded-xl bg-zinc-50 p-4 ring-1 ring-zinc-100">
                  <dt className="text-sm font-medium uppercase tracking-wide text-zinc-500">{t("torque")}</dt>
                  <dd className="mt-1 font-semibold text-zinc-900">{car.specs.torqueNm} N·m</dd>
                </div>
              )}
              {car.specs?.groundClearanceMm != null && (
                <div className="rounded-xl bg-zinc-50 p-4 ring-1 ring-zinc-100">
                  <dt className="text-sm font-medium uppercase tracking-wide text-zinc-500">{t("groundClearance")}</dt>
                  <dd className="mt-1 font-semibold text-zinc-900">{car.specs.groundClearanceMm} mm</dd>
                </div>
              )}
              {car.specs?.maintenanceCostEst != null && (
                <div className="rounded-xl bg-zinc-50 p-4 ring-1 ring-zinc-100 sm:col-span-2">
                  <dt className="text-sm font-medium uppercase tracking-wide text-zinc-500">{t("maintenance")}</dt>
                  <dd className="mt-1 font-semibold text-zinc-900">{car.specs.maintenanceCostEst.toLocaleString()} MAD / an</dd>
                </div>
              )}
              {car.specs?.partsAvailabilityAr && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium uppercase tracking-wide text-zinc-500">{t("parts")}</dt>
                  <dd className="mt-2 rounded-xl bg-emerald-50/80 p-4 text-base text-zinc-800 ring-1 ring-emerald-100">
                    {car.specs.partsAvailabilityAr}
                  </dd>
                </div>
              )}
              {(car.specs?.safetyAr || car.specs?.comfortAr) && (
                <div className="sm:col-span-2 space-y-3 rounded-xl bg-zinc-50 p-4 ring-1 ring-zinc-100">
                  {car.specs.safetyAr ? (
                    <div>
                      <dt className="text-sm font-medium uppercase tracking-wide text-zinc-500">Sécurité</dt>
                      <dd className="mt-1 text-base text-zinc-800">{car.specs.safetyAr}</dd>
                    </div>
                  ) : null}
                  {car.specs.comfortAr ? (
                    <div>
                      <dt className="text-sm font-medium uppercase tracking-wide text-zinc-500">Confort</dt>
                      <dd className="mt-1 text-base text-zinc-800">{car.specs.comfortAr}</dd>
                    </div>
                  ) : null}
                </div>
              )}
            </dl>
          </Card>

          <Card>
            <h2 className="text-lg font-bold text-zinc-900">{t("popularIssuesTitle")}</h2>
            <p className="mt-2 text-xs text-zinc-500">{t("popularIssuesHint")}</p>
            <ul className="mt-4 space-y-2">
              {popularIssues.map((issue, i) => (
                <li key={`${issue}-${i}`} className="rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2 text-sm text-zinc-900">
                  {issue}
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <h2 className="text-lg font-bold text-zinc-900">{t("reviews")}</h2>
            {siblingCarIds.length > 1 ? (
              <p className="mt-2 text-xs text-zinc-500">{t("reviewsSameModelYearHint")}</p>
            ) : null}
            {car.reviews.length === 0 ? (
              <div className="mt-4 space-y-3 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/80 p-4 text-sm leading-relaxed text-zinc-700">
                <p>{t("reviewsEmpty")}</p>
                <p className="text-zinc-600">{t("reviewsEmptyCta")}</p>
              </div>
            ) : (
              <ul className="mt-4 space-y-4">
                {car.reviews.map((r) => {
                  const tone = reviewToneKind(r.globalNote);
                  const toneClass =
                    tone === "positive"
                      ? "border-emerald-200 bg-emerald-50/70"
                      : tone === "critical"
                        ? "border-rose-200 bg-rose-50/80"
                        : "border-amber-200 bg-amber-50/70";
                  const toneLabel =
                    tone === "positive" ? t("reviewTonePositive") : tone === "critical" ? t("reviewToneCritical") : t("reviewToneMixed");
                  return (
                    <li key={r.id} className={`rounded-2xl border p-4 ${toneClass}`}>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={tone === "positive" ? "success" : tone === "critical" ? "warning" : "neutral"}>
                          {toneLabel}
                        </Badge>
                        {r.globalNote != null && (
                          <span className="text-xs font-semibold text-zinc-700">
                            {t("globalNote")} : {r.globalNote}/5
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-xs font-semibold text-zinc-800">{r.displayLabel}</p>
                      {(r.sourceName || r.sourceUrl) && (
                        <p className="mt-1 text-xs text-zinc-500">
                          {t("reviewSource")}{" "}
                          {r.sourceName}
                          {r.sourceUrl ? (
                            <>
                              {" "}
                              <a
                                href={r.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-emerald-700 underline-offset-2 hover:underline"
                              >
                                {t("reviewSourceLink")}
                              </a>
                            </>
                          ) : null}
                        </p>
                      )}
                      <p className="mt-2 text-sm leading-relaxed text-zinc-900">
                        {locale === "ar" ? r.commentAr : r.commentFr ?? r.commentAr}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        <aside className="space-y-4">
          <Card className="text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{t("scores")}</p>
            <div className="mt-4 flex justify-center">
              <ScoreGauge value={overallCriteriaPct} />
            </div>
            <p className="mt-3 text-xs leading-relaxed text-zinc-500">
              <a href="#notes-criteres" className="font-semibold text-emerald-700 underline-offset-2 hover:underline">
                {t("criteriaTitle")}
              </a>
            </p>
            <div className="mt-4 rounded-lg bg-zinc-50 p-3 text-left text-xs ring-1 ring-zinc-100">
              <p className="text-zinc-500">{t("priceNewEstAside")}</p>
              <p className="mt-1 font-bold tabular-nums text-zinc-900">{car.priceNewEst.toLocaleString()} MAD</p>
            </div>
          </Card>
          <div className="flex flex-wrap gap-2">
            <Badge tone="success">{car.conditionDefault}</Badge>
            <Badge tone="neutral">{car.bodyType}</Badge>
          </div>
        </aside>
      </div>
    </article>
  );
}
