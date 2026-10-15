import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Parallax } from "@/components/motion/Parallax";
import { PremiumSearch, type SearchBrand, type SearchModel } from "@/components/search/PremiumSearch";
import { VehicleImage } from "@/components/vehicle/VehicleImage";
import { IconArrowRight } from "@/components/ui/icons";
import { container, focusRing } from "@/components/ui/styles";
import { formatPriceDh, type VehicleCardData } from "@/lib/showcase";

export function AutomotiveHero({
  vehicle,
  brands,
  models,
  stats,
}: {
  vehicle: VehicleCardData | null;
  brands: SearchBrand[];
  models: SearchModel[];
  stats: { vehicles: number; brands: number; reviews: number };
}) {
  const t = useTranslations("ui");
  const locale = useLocale();
  const nf = locale === "ar" ? "ar-MA" : "fr-FR";

  return (
    <section className="relative isolate flex min-h-[80svh] flex-col justify-end overflow-hidden bg-ink md:min-h-[92svh]">
      <div className="absolute inset-0 -z-10">
        <Parallax range={22} className="absolute -inset-y-8 inset-x-0">
          <div className="relative h-full w-full scale-[1.04]">
            {vehicle?.coverUrl ? (
              <VehicleImage src={vehicle.coverUrl} alt={`${vehicle.brand} ${vehicle.model}`} sizes="100vw" priority />
            ) : (
              <div className="showroom-stage absolute inset-0" />
            )}
          </div>
        </Parallax>
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/70 to-ink/10 rtl:bg-gradient-to-l" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-ink/50" aria-hidden />
      </div>

      <div className={`${container} pb-10 pt-[calc(var(--header-h)+3rem)] sm:pb-14 lg:pb-16`}>
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">{t("heroEyebrow")}</p>
          <h1 className="mt-5 text-[42px] font-semibold leading-[0.98] tracking-[-0.04em] text-fg sm:text-6xl lg:text-[84px]">
            <span className="block">{t("heroTitleLine1")}</span>
            <span className="block text-fg/60">{t("heroTitleLine2")}</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-fg-muted sm:text-lg">{t("heroSubtitle")}</p>
          <div className="mt-8 max-w-2xl">
            <PremiumSearch brands={brands} models={models} />
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-8 border-t border-line pt-6 sm:flex-row sm:items-end sm:justify-between">
          <dl className="flex gap-8 sm:gap-12">
            {[
              { v: stats.vehicles, l: t("heroStatVehicles") },
              { v: stats.brands, l: t("heroStatBrands") },
              { v: stats.reviews, l: t("heroStatReviews") },
            ]
              .filter((s) => s.v > 0)
              .map((s) => (
                <div key={s.l}>
                  <dt className="sr-only">{s.l}</dt>
                  <dd className="text-2xl font-semibold tabular-nums tracking-[-0.02em] text-fg sm:text-3xl">{s.v.toLocaleString(nf)}</dd>
                  <dd className="mt-1 text-[11px] font-medium uppercase tracking-[0.18em] text-steel">{s.l}</dd>
                </div>
              ))}
          </dl>
          {vehicle ? (
            <Link
              href={`/cars/${vehicle.id}`}
              className={`group inline-flex items-center gap-4 self-start rounded-lg text-start sm:self-auto ${focusRing}`}
            >
              <span>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-steel">{vehicle.brand}</span>
                <span className="block text-sm font-semibold text-fg">
                  {vehicle.model}
                  {vehicle.price != null ? <span className="font-normal text-fg-muted"> · {formatPriceDh(vehicle.price, locale)}</span> : null}
                </span>
              </span>
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-line-strong text-fg transition group-hover:border-accent group-hover:text-accent">
                <IconArrowRight size={17} className="transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
              </span>
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
