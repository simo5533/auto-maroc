import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { focusRing } from "@/components/ui/styles";
import type { BrandSummary } from "@/lib/showcase";

export function BrandCard({ brand }: { brand: BrandSummary }) {
  const t = useTranslations("ui");
  return (
    <Link
      href={`/catalog?brand=${encodeURIComponent(brand.filterKey)}`}
      className={`group flex min-h-[132px] flex-col justify-between rounded-[12px] border border-line bg-graphite p-5 transition duration-200 hover:border-line-strong hover:bg-carbon ${focusRing}`}
    >
      <span className="flex h-9 w-9 items-center justify-center">
        {brand.logoUrl ? (
          <Image
            src={brand.logoUrl}
            alt=""
            width={32}
            height={32}
            unoptimized
            className="h-8 w-8 rounded object-contain opacity-80 grayscale transition duration-200 group-hover:scale-110 group-hover:opacity-100 group-hover:grayscale-0 motion-scale"
          />
        ) : (
          <span className="text-lg font-semibold text-steel">{brand.label.slice(0, 1)}</span>
        )}
      </span>
      <span>
        <span className="block truncate text-[15px] font-semibold text-fg">{brand.label}</span>
        <span className="mt-0.5 block text-xs text-steel transition-colors group-hover:text-fg-muted">
          {t("brandModels", { n: brand.modelCount })} · {t("brandVehicles", { n: brand.vehicleCount })}
        </span>
      </span>
    </Link>
  );
}

export function BrandExplorer({ brands }: { brands: BrandSummary[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {brands.map((b) => (
        <li key={b.filterKey}>
          <BrandCard brand={b} />
        </li>
      ))}
    </ul>
  );
}
