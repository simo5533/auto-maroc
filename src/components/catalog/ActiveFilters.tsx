import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { IconClose } from "@/components/ui/icons";
import { focusRing } from "@/components/ui/styles";

export type ActiveFilterChip = { key: string; label: string; href: string };

export function ActiveFilters({ chips, clearHref }: { chips: ActiveFilterChip[]; clearHref: string }) {
  const t = useTranslations("ui");
  if (chips.length === 0) return null;
  return (
    <ul className="flex flex-wrap items-center gap-2" aria-label={t("filtersTitle")}>
      {chips.map((c) => (
        <li key={c.key}>
          <Link
            href={c.href}
            scroll={false}
            aria-label={t("removeFilter", { label: c.label })}
            className={`group inline-flex min-h-9 items-center gap-2 rounded-full border border-line-strong bg-white/[0.04] ps-3.5 pe-2.5 text-[13px] font-medium text-fg transition hover:border-accent/60 ${focusRing}`}
          >
            {c.label}
            <IconClose size={13} className="text-steel transition group-hover:text-accent" />
          </Link>
        </li>
      ))}
      <li>
        <Link
          href={clearHref}
          scroll={false}
          className={`inline-flex min-h-9 items-center rounded-full px-3 text-[13px] font-semibold text-accent underline-offset-4 hover:underline ${focusRing}`}
        >
          {t("clearAll")}
        </Link>
      </li>
    </ul>
  );
}
