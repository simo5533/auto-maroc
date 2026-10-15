"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { IconArrowRight, IconSearch } from "@/components/ui/icons";
import { focusRing } from "@/components/ui/styles";

export type SearchBrand = { filterKey: string; label: string; logoUrl: string | null; vehicleCount: number };
export type SearchModel = { brandKey: string; brand: string; model: string; query: string };

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, " ")
    .trim();
}

function modelHref(m: SearchModel): string {
  return `/catalog?brand=${encodeURIComponent(m.brandKey)}&q=${encodeURIComponent(m.query)}`;
}

export function PremiumSearch({
  brands,
  models,
  size = "hero",
}: {
  brands: SearchBrand[];
  models: SearchModel[];
  size?: "hero" | "compact";
}) {
  const t = useTranslations("ui");
  const router = useRouter();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const matches = useMemo(() => {
    const nq = normalize(q);
    if (!nq) return [];
    const terms = nq.split(" ");
    return models
      .filter((m) => {
        const hay = normalize(`${m.brand} ${m.model}`);
        return terms.every((term) => hay.includes(term));
      })
      .slice(0, 7);
  }, [q, models]);

  const popularModels = useMemo(() => {
    const top = new Set(brands.slice(0, 4).map((b) => b.filterKey));
    const seen = new Set<string>();
    return models
      .filter((m) => {
        if (!top.has(m.brandKey) || seen.has(m.brandKey)) return false;
        seen.add(m.brandKey);
        return true;
      })
      .slice(0, 4);
  }, [brands, models]);

  const options = q.trim() ? matches : popularModels;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function submit(e: FormEvent) {
    e.preventDefault();
    const chosen = active >= 0 ? options[active] : undefined;
    if (chosen) {
      router.push(modelHref(chosen));
      return;
    }
    const term = q.trim();
    router.push(term ? `/catalog?q=${encodeURIComponent(term)}` : "/catalog");
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, -1));
    } else if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    }
  }

  const hero = size === "hero";

  return (
    <div ref={rootRef} className="relative w-full">
      <form onSubmit={submit} role="search" className="relative">
        <label htmlFor={`${listId}-input`} className="sr-only">
          {t("searchLabel")}
        </label>
        <IconSearch
          size={hero ? 20 : 18}
          className={`pointer-events-none absolute top-1/2 z-10 -translate-y-1/2 text-fg-muted ${hero ? "start-5" : "start-4"}`}
        />
        <input
          id={`${listId}-input`}
          type="search"
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${listId}-list`}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-opt-${active}` : undefined}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={t("searchPlaceholder")}
          className={`glass w-full rounded-[12px] border border-line-strong text-fg placeholder:text-fg-muted/80 transition hover:border-white/25 focus:border-accent/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
            hero ? "h-16 ps-14 pe-36 text-base sm:h-[68px]" : "h-12 ps-11 pe-28 text-sm"
          }`}
        />
        <button
          type="submit"
          className={`absolute end-2 top-1/2 inline-flex -translate-y-1/2 items-center gap-2 rounded-[9px] bg-accent font-semibold text-accent-ink transition hover:bg-accent-hover ${focusRing} ${
            hero ? "h-12 px-5 text-sm sm:h-[52px]" : "h-9 px-4 text-[13px]"
          }`}
        >
          <span className="hidden sm:inline">{t("searchSubmit")}</span>
          <IconArrowRight size={16} className="rtl:rotate-180" />
        </button>
      </form>

      {open ? (
        <div className="glass absolute inset-x-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-[12px] border border-line-strong shadow-[0_24px_60px_-20px_rgba(0,0,0,0.8)]">
          {!q.trim() && brands.length > 0 ? (
            <div className="border-b border-line p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-steel">{t("searchPopularBrands")}</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {brands.slice(0, 8).map((b) => (
                  <li key={b.filterKey}>
                    <Link
                      href={`/catalog?brand=${encodeURIComponent(b.filterKey)}`}
                      onClick={() => setOpen(false)}
                      className={`inline-flex min-h-10 items-center gap-2 rounded-lg border border-line bg-white/[0.03] px-3 text-[13px] font-medium text-fg transition hover:border-line-strong hover:bg-white/[0.06] ${focusRing}`}
                    >
                      {b.logoUrl ? (
                        <Image src={b.logoUrl} alt="" width={16} height={16} unoptimized className="h-4 w-4 rounded-sm object-contain" />
                      ) : null}
                      {b.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="p-2">
            {options.length > 0 ? (
              <>
                <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-steel">{t("searchModels")}</p>
                <ul id={`${listId}-list`} role="listbox" aria-label={t("searchModels")}>
                  {options.map((m, i) => (
                    <li key={`${m.brandKey}-${m.model}`} id={`${listId}-opt-${i}`} role="option" aria-selected={i === active}>
                      <Link
                        href={modelHref(m)}
                        onClick={() => setOpen(false)}
                        onMouseEnter={() => setActive(i)}
                        className={`flex min-h-11 items-center justify-between gap-3 rounded-lg px-3 text-sm transition ${
                          i === active ? "bg-white/[0.07] text-fg" : "text-fg-muted hover:bg-white/[0.05] hover:text-fg"
                        }`}
                        tabIndex={-1}
                      >
                        <span className="truncate">
                          <span className="text-steel">{m.brand}</span> <span className="font-medium text-fg">{m.model}</span>
                        </span>
                        <IconArrowRight size={15} className="shrink-0 text-steel rtl:rotate-180" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : q.trim() ? (
              <p id={`${listId}-list`} role="listbox" aria-label={t("searchModels")} className="px-3 py-3 text-sm text-fg-muted">
                {t("searchNoResult")}
              </p>
            ) : null}
            {q.trim() ? (
              <Link
                href={`/catalog?q=${encodeURIComponent(q.trim())}`}
                onClick={() => setOpen(false)}
                className={`mt-1 flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-accent transition hover:bg-white/[0.05] ${focusRing}`}
              >
                <IconSearch size={15} />
                {t("searchSeeAll", { q: q.trim() })}
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
