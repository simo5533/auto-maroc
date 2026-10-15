import { useLocale, useTranslations } from "next-intl";
import { formatPriceDh } from "@/lib/showcase";

/** Prix neuf estimé ; rien n'est affiché si le prix est absent (jamais « 0 DH »). */
export function PriceBlock({ price, size = "lg" }: { price: number | null; size?: "lg" | "sm" }) {
  const t = useTranslations("ui");
  const locale = useLocale();
  if (price == null) return null;
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-steel">{t("priceNew")}</p>
      <p
        className={`mt-1 font-semibold tabular-nums tracking-[-0.02em] text-fg ${size === "lg" ? "text-3xl sm:text-[34px]" : "text-lg"}`}
      >
        {formatPriceDh(price, locale)}
      </p>
    </div>
  );
}
