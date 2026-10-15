import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { IconChevronLeft, IconChevronRight } from "@/components/ui/icons";
import { focusRing } from "@/components/ui/styles";

function pageWindow(page: number, total: number): (number | "gap")[] {
  const pages = new Set([1, total, page - 1, page, page + 1].filter((p) => p >= 1 && p <= total));
  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  for (const p of sorted) {
    const prev = out[out.length - 1];
    if (typeof prev === "number" && p - prev > 1) out.push("gap");
    out.push(p);
  }
  return out;
}

export function Pagination({ page, totalPages, hrefFor }: { page: number; totalPages: number; hrefFor: (p: number) => string }) {
  const t = useTranslations("ui");
  if (totalPages <= 1) return null;
  const item = `inline-flex h-11 min-w-11 items-center justify-center rounded-[10px] px-3 text-sm font-semibold transition ${focusRing}`;

  return (
    <nav aria-label={t("paginationLabel")} className="flex flex-col items-center gap-4">
      <ul className="flex items-center gap-1.5">
        <li>
          {page > 1 ? (
            <Link href={hrefFor(page - 1)} aria-label={t("paginationPrev")} className={`${item} border border-line text-fg hover:border-line-strong`}>
              <IconChevronLeft size={17} className="rtl:rotate-180" />
            </Link>
          ) : (
            <span className={`${item} border border-line text-steel/50`} aria-hidden>
              <IconChevronLeft size={17} className="rtl:rotate-180" />
            </span>
          )}
        </li>
        {pageWindow(page, totalPages).map((p, i) =>
          p === "gap" ? (
            <li key={`gap-${i}`} className="px-1 text-steel" aria-hidden>
              …
            </li>
          ) : (
            <li key={p}>
              <Link
                href={hrefFor(p)}
                aria-current={p === page ? "page" : undefined}
                className={`${item} tabular-nums ${p === page ? "bg-fg text-ink" : "text-fg-muted hover:bg-white/[0.06] hover:text-fg"}`}
              >
                {p}
              </Link>
            </li>
          ),
        )}
        <li>
          {page < totalPages ? (
            <Link href={hrefFor(page + 1)} aria-label={t("paginationNext")} className={`${item} border border-line text-fg hover:border-line-strong`}>
              <IconChevronRight size={17} className="rtl:rotate-180" />
            </Link>
          ) : (
            <span className={`${item} border border-line text-steel/50`} aria-hidden>
              <IconChevronRight size={17} className="rtl:rotate-180" />
            </span>
          )}
        </li>
      </ul>
      <p className="text-xs text-steel">{t("pageOf", { page, total: totalPages })}</p>
    </nav>
  );
}
