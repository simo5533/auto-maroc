import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { AutomotiveHero } from "@/components/home/AutomotiveHero";
import { BrandExplorer } from "@/components/home/BrandExplorer";
import { CategoryBento } from "@/components/home/CategoryBento";
import { EditorialBanner } from "@/components/home/EditorialBanner";
import { FeaturedVehicle } from "@/components/home/FeaturedVehicle";
import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { IconArrowRight } from "@/components/ui/icons";
import { btnPrimary, btnSecondary, container } from "@/components/ui/styles";
import { VehicleCard } from "@/components/vehicle/VehicleCard";
import {
  getBrandSummaries,
  getCategorySummary,
  getFeaturedVehicles,
  getLatestVehicles,
  getSearchIndex,
  type BrandSummary,
  type CategorySummary,
  type SearchIndexEntry,
  type VehicleCardData,
} from "@/lib/showcase";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const loc = locale === "ar" ? "ar" : "fr";
  const t = await getTranslations("ui");

  let featured: VehicleCardData[] = [];
  let latest: VehicleCardData[] = [];
  let brands: BrandSummary[] = [];
  let categories: CategorySummary | null = null;
  let searchIndex: SearchIndexEntry[] = [];
  let reviews = 0;
  try {
    [featured, brands, categories, searchIndex, reviews] = await Promise.all([
      getFeaturedVehicles(loc, 5),
      getBrandSummaries(loc),
      getCategorySummary(loc),
      getSearchIndex(loc),
      prisma.review.count({ where: { status: "APPROVED" } }),
    ]);
    latest = await getLatestVehicles(loc, 6, new Set(featured.map((f) => f.id)));
  } catch {
    /* build ou démarrage sans base : la page reste affichable */
  }

  const [hero, ...rest] = featured;
  const main = rest[0] ?? hero;
  const secondary = rest.slice(1, 4);
  const electrified = (categories?.fuelCounts.ELECTRIC ?? 0) + (categories?.fuelCounts.HYBRID ?? 0);
  const electricCover = categories?.fuelCovers.ELECTRIC ?? categories?.fuelCovers.HYBRID ?? null;

  const why = [
    { title: t("why1Title"), body: t("why1Body") },
    { title: t("why2Title"), body: t("why2Body") },
    { title: t("why3Title"), body: t("why3Body") },
    { title: t("why4Title"), body: t("why4Body") },
  ];

  return (
    <>
      <AutomotiveHero
        vehicle={hero ?? null}
        brands={brands.slice(0, 10)}
        models={searchIndex}
        stats={{ vehicles: categories?.total ?? 0, brands: brands.length, reviews }}
      />

      <div className="space-y-24 py-20 sm:space-y-32 sm:py-28">
        {main ? (
          <section className={container} aria-labelledby="featured-title">
            <Reveal>
              <SectionHeading
                id="featured-title"
                eyebrow={t("featuredEyebrow")}
                title={t("featuredTitle")}
                action={
                  <Link href="/catalog" className={btnSecondary}>
                    {t("seeCatalog")}
                    <IconArrowRight size={16} className="rtl:rotate-180" />
                  </Link>
                }
              />
            </Reveal>
            <Reveal className="mt-10" delay={80}>
              <FeaturedVehicle car={main} />
            </Reveal>
            {secondary.length > 0 ? (
              <ul className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3 xl:gap-6">
                {secondary.map((car, i) => (
                  <Reveal as="li" key={car.id} delay={i * 70}>
                    <VehicleCard car={car} />
                  </Reveal>
                ))}
              </ul>
            ) : null}
          </section>
        ) : null}

        {brands.length > 0 ? (
          <section className={container} aria-labelledby="brands-title">
            <Reveal>
              <SectionHeading
                id="brands-title"
                eyebrow={t("brandsEyebrow")}
                title={t("brandsTitle")}
                action={
                  <Link href="/catalog" className={btnSecondary}>
                    {t("brandsAll")}
                    <IconArrowRight size={16} className="rtl:rotate-180" />
                  </Link>
                }
              />
            </Reveal>
            <Reveal className="mt-10" delay={80}>
              <BrandExplorer brands={brands.slice(0, 12)} />
            </Reveal>
          </section>
        ) : null}

        {latest.length > 0 ? (
          <section className={container} aria-labelledby="latest-title">
            <Reveal>
              <SectionHeading id="latest-title" eyebrow={t("latestEyebrow")} title={t("latestTitle")} />
            </Reveal>
            <ul className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3 xl:gap-6">
              {latest.map((car, i) => (
                <Reveal as="li" key={car.id} delay={(i % 3) * 70}>
                  <VehicleCard car={car} />
                </Reveal>
              ))}
            </ul>
          </section>
        ) : null}

        {electrified > 0 ? (
          <div className={container}>
            <Reveal>
              <EditorialBanner
                lines={[t("editorialElectricLine1"), t("editorialElectricLine2"), t("editorialElectricLine3")]}
                body={t("editorialElectricBody", { n: electrified })}
                imageUrl={electricCover}
                imageAlt=""
                action={
                  <Link href="/catalog?fuel=ELECTRIC" className={btnPrimary}>
                    {t("editorialElectricCta")}
                    <IconArrowRight size={16} className="rtl:rotate-180" />
                  </Link>
                }
              />
            </Reveal>
          </div>
        ) : null}

        {categories && categories.total > 0 ? (
          <section className={container} aria-labelledby="categories-title">
            <Reveal>
              <SectionHeading id="categories-title" eyebrow={t("categoriesEyebrow")} title={t("categoriesTitle")} />
            </Reveal>
            <Reveal className="mt-10" delay={80}>
              <CategoryBento summary={categories} />
            </Reveal>
          </section>
        ) : null}

        <section className={container} aria-labelledby="why-title">
          <Reveal>
            <SectionHeading id="why-title" eyebrow={t("whyEyebrow")} title={t("whyTitle")} />
          </Reveal>
          <ol className="mt-12 grid gap-px overflow-hidden rounded-[14px] border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {why.map((w, i) => (
              <Reveal as="li" key={w.title} delay={i * 70} className="bg-ink p-7 sm:p-8">
                <span className="text-sm font-semibold tabular-nums text-accent">0{i + 1}</span>
                <h3 className="mt-8 text-lg font-semibold tracking-[-0.01em] text-fg">{w.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted">{w.body}</p>
              </Reveal>
            ))}
          </ol>
        </section>

        <section className={container}>
          <Reveal className="flex flex-col items-start justify-between gap-8 rounded-[14px] border border-line bg-graphite p-8 sm:p-12 lg:flex-row lg:items-center">
            <div className="max-w-xl">
              <h2 className="text-balance text-3xl font-semibold tracking-[-0.03em] text-fg sm:text-4xl">{t("ctaTitle")}</h2>
              <p className="mt-3 text-base leading-relaxed text-fg-muted">{t("ctaBody")}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/assistant" className={btnPrimary}>
                {t("ctaAssistant")}
                <IconArrowRight size={16} className="rtl:rotate-180" />
              </Link>
              <Link href="/compare" className={btnSecondary}>
                {t("compareCta")}
              </Link>
            </div>
          </Reveal>
        </section>
      </div>
    </>
  );
}
