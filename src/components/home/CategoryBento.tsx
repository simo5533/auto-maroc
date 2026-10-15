import { useTranslations } from "next-intl";
import type { BodyType, FuelType } from "@prisma/client";
import { Link } from "@/i18n/navigation";
import { VehicleImage } from "@/components/vehicle/VehicleImage";
import { IconArrowRight } from "@/components/ui/icons";
import { focusRing } from "@/components/ui/styles";
import type { CategorySummary } from "@/lib/showcase";
import { bodyLabel, fuelLabel } from "@/lib/vehicle-labels";

type Tile = { key: string; href: string; label: string; count: number; cover: string | null; layout: string };

/** Bento : grandes tuiles (SUV, électrique / hybride) et petites tuiles, uniquement pour les catégories existantes. */
export function CategoryBento({ summary }: { summary: CategorySummary }) {
  const t = useTranslations("ui");
  const tc = useTranslations("catalog");

  const body = (b: BodyType, layout: string): Tile => ({
    key: b,
    href: `/catalog?body=${b}`,
    label: bodyLabel(tc, b),
    count: summary.bodyCounts[b] ?? 0,
    cover: summary.bodyCovers[b] ?? null,
    layout,
  });
  const fuel = (f: FuelType, layout: string): Tile => ({
    key: f,
    href: `/catalog?fuel=${f}`,
    label: fuelLabel(tc, f),
    count: summary.fuelCounts[f] ?? 0,
    cover: summary.fuelCovers[f] ?? null,
    layout,
  });

  const tiles = [
    body("SUV", "lg:col-span-2 lg:row-span-2"),
    body("CITY_CAR", ""),
    body("SEDAN", ""),
    fuel("HYBRID", ""),
    fuel("ELECTRIC", ""),
    body("PICKUP", ""),
    body("COMMERCIAL", ""),
  ]
    .filter((tile) => tile.count > 0)
    .slice(0, 7);

  return (
    <ul className="grid auto-rows-[220px] grid-cols-1 gap-3 sm:grid-cols-2 lg:auto-rows-[240px] lg:grid-cols-4">
      {tiles.map((tile) => (
        <li key={tile.key} className={tile.layout}>
          <Link
            href={tile.href}
            className={`group relative isolate flex h-full flex-col justify-end overflow-hidden rounded-[14px] border border-line bg-graphite p-6 transition duration-200 hover:border-line-strong ${focusRing}`}
          >
            <div className="absolute inset-0 -z-10 transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-scale">
              <VehicleImage src={tile.cover} alt="" sizes="(max-width: 1023px) 50vw, 25vw" />
            </div>
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/55 to-ink/10" aria-hidden />
            <p className="text-2xl font-semibold tracking-[-0.02em] text-fg">{tile.label}</p>
            <p className="mt-1 flex items-center justify-between text-sm text-fg-muted">
              <span>{t("brandVehicles", { n: tile.count })}</span>
              <IconArrowRight size={17} className="text-fg transition-transform duration-200 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
