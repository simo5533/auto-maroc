import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { BrandLogo } from "@/components/vehicle/BrandLogo";
import { VehicleImage } from "@/components/vehicle/VehicleImage";
import { IconArrowRight, IconCalendar, IconFuel, IconGauge, IconGearbox } from "@/components/ui/icons";
import { btnPrimary } from "@/components/ui/styles";
import { formatPriceDh, type VehicleCardData } from "@/lib/showcase";
import { fuelLabel, gearboxLabel } from "@/lib/vehicle-labels";

/** Véhicule principal très large (image ~65 %) + panneau d'identité. */
export function FeaturedVehicle({ car }: { car: VehicleCardData }) {
  const t = useTranslations("ui");
  const tc = useTranslations("catalog");
  const locale = useLocale();

  const specs = [
    car.powerHp != null
      ? { icon: <IconGauge size={18} />, value: `${car.powerHp}`, unit: t("powerUnit"), label: t("powerLabel") }
      : { icon: <IconCalendar size={18} />, value: `${car.year}`, unit: "", label: t("yearLabel") },
    { icon: <IconGearbox size={18} />, value: gearboxLabel(tc, car.transmission), unit: "", label: t("gearboxLabel") },
    { icon: <IconFuel size={18} />, value: fuelLabel(tc, car.fuel), unit: "", label: t("fuelLabel") },
  ];

  return (
    <article className="group grid overflow-hidden rounded-[14px] border border-line bg-graphite lg:grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)]">
      <Link href={`/cars/${car.id}`} className="showroom-stage relative block aspect-[16/10] overflow-hidden lg:aspect-auto lg:min-h-[520px]" tabIndex={-1} aria-hidden>
        <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.035] motion-scale">
          <VehicleImage src={car.coverUrl} alt="" sizes="(max-width: 1023px) 100vw, 65vw" placeholderLabel={t("noImage")} />
        </div>
      </Link>
      <div className="flex flex-col justify-between gap-10 p-6 sm:p-10">
        <div>
          <div className="flex items-center gap-2.5">
            <BrandLogo src={car.logoUrl} size={22} />
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-fg-muted">{car.brand}</p>
          </div>
          <h3 className="mt-4 text-4xl font-semibold leading-none tracking-[-0.035em] text-fg sm:text-5xl">{car.model}</h3>
          <p className="mt-3 text-sm text-steel">
            {car.year} · {car.version}
          </p>
          {car.price != null ? (
            <div className="mt-8">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-steel">{t("priceNew")}</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums tracking-[-0.02em] text-fg">{formatPriceDh(car.price, locale)}</p>
            </div>
          ) : null}
        </div>

        <dl className="grid grid-cols-3 divide-x divide-white/[0.08] border-y border-line rtl:divide-x-reverse">
          {specs.map((s) => (
            <div key={s.label} className="px-3 py-5 first:ps-0">
              <dt className="flex items-center gap-1.5 text-steel">
                {s.icon}
                <span className="sr-only">{s.label}</span>
              </dt>
              <dd className="mt-3 text-[15px] font-semibold leading-tight text-fg">
                {s.value}
                {s.unit ? <span className="ms-1 text-xs font-medium text-fg-muted">{s.unit}</span> : null}
              </dd>
              <dd className="mt-1 text-[11px] uppercase tracking-[0.14em] text-steel" aria-hidden>
                {s.label}
              </dd>
            </div>
          ))}
        </dl>

        <Link href={`/cars/${car.id}`} className={`${btnPrimary} group/cta self-start`}>
          {t("viewVehicle")}
          <IconArrowRight size={16} className="transition-transform group-hover/cta:translate-x-1 rtl:rotate-180 rtl:group-hover/cta:-translate-x-1" />
        </Link>
      </div>
    </article>
  );
}
