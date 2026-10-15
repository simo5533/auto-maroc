import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { VehicleImage } from "@/components/vehicle/VehicleImage";
import { IconArrowRight, IconCalendar, IconFuel, IconGearbox, IconImage } from "@/components/ui/icons";
import { focusRing } from "@/components/ui/styles";
import { formatPriceDh, type VehicleCardData } from "@/lib/showcase";
import { bodyLabel, fuelLabel, gearboxLabel } from "@/lib/vehicle-labels";

const CARD_SIZES = "(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw";

export function VehicleCard({ car, priority = false }: { car: VehicleCardData; priority?: boolean }) {
  const t = useTranslations("ui");
  const tc = useTranslations("catalog");
  const locale = useLocale();
  const title = `${car.brand} ${car.model}`;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[14px] border border-line bg-graphite transition duration-[220ms] ease-out hover:-translate-y-1 hover:border-line-strong motion-scale">
      <div className="showroom-stage relative aspect-[16/10] overflow-hidden">
        <div className="absolute inset-0 transition-transform duration-[220ms] ease-out group-hover:scale-[1.035] motion-scale">
          <VehicleImage src={car.coverUrl} alt={title} sizes={CARD_SIZES} priority={priority} placeholderLabel={t("noImage")} />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/45 to-transparent" aria-hidden />
        <span className="glass absolute start-3 top-3 rounded-md border border-line px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-fg">
          {bodyLabel(tc, car.bodyType)}
        </span>
        {car.photoCount > 1 ? (
          <span className="glass absolute end-3 top-3 inline-flex items-center gap-1 rounded-md border border-line px-2 py-1 text-[11px] font-medium text-fg-muted">
            <IconImage size={13} />
            {car.photoCount}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-center gap-2">
          {car.logoUrl ? (
            <Image src={car.logoUrl} alt="" width={16} height={16} unoptimized className="h-4 w-4 rounded-sm object-contain opacity-80" />
          ) : null}
          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.2em] text-fg-muted">{car.brand}</p>
        </div>
        <h3 className="mt-2 text-xl font-semibold leading-tight tracking-[-0.015em] text-fg">
          <Link href={`/cars/${car.id}`} className={`rounded after:absolute after:inset-0 after:content-[''] ${focusRing}`}>
            {car.model}
          </Link>
        </h3>
        <p className="mt-1 line-clamp-1 text-sm text-steel" title={car.version}>
          {car.version}
        </p>

        <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-[13px] text-fg-muted">
          <li className="inline-flex items-center gap-1.5">
            <IconCalendar size={15} className="text-steel" />
            {car.year}
          </li>
          <li className="inline-flex items-center gap-1.5">
            <IconGearbox size={15} className="text-steel" />
            {gearboxLabel(tc, car.transmission)}
          </li>
          <li className="inline-flex items-center gap-1.5">
            <IconFuel size={15} className="text-steel" />
            {fuelLabel(tc, car.fuel)}
          </li>
        </ul>

        <div className="mt-auto flex items-end justify-between gap-4 border-t border-line pt-5">
          {car.price != null ? (
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-steel">{t("fromPrice")}</p>
              <p className="mt-1 truncate text-lg font-semibold tabular-nums tracking-[-0.01em] text-fg">
                {formatPriceDh(car.price, locale)}
              </p>
            </div>
          ) : (
            <span />
          )}
          <span className="inline-flex shrink-0 items-center gap-1.5 text-[13px] font-semibold text-fg-muted transition-colors group-hover:text-accent">
            {t("discover")}
            <IconArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
          </span>
        </div>
      </div>
    </article>
  );
}
