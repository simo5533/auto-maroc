"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { FilterSelect } from "@/components/catalog/FilterSelect";
import {
  PRICE_OPTIONS,
  SORT_VALUES,
  applyPriceValue,
  buildCatalogQuery,
  currentPriceValue,
  priceRangeLabel,
  sortLabel,
  type CatalogFilterKey,
  type CatalogParams,
} from "@/components/catalog/filter-model";
import { IconChevronDown, IconClose } from "@/components/ui/icons";
import { btnPrimary, btnSecondary, focusRing } from "@/components/ui/styles";
import {
  BODY_VALUES,
  CONDITION_VALUES,
  FUEL_VALUES,
  GEARBOX_VALUES,
  USAGE_VALUES,
  bodyLabel,
  conditionLabel,
  fuelLabel,
  gearboxLabel,
  usageLabel,
} from "@/lib/vehicle-labels";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details open className="group border-b border-line py-1 last:border-b-0">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between text-sm font-semibold text-fg [&::-webkit-details-marker]:hidden">
        {title}
        <IconChevronDown size={16} className="text-steel transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="pb-5 pt-1">{children}</div>
    </details>
  );
}

function Chips({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? "" : o.value)}
            className={`min-h-11 rounded-[10px] border px-4 text-[13px] font-medium transition ${focusRing} ${
              on ? "border-accent bg-accent/10 text-fg" : "border-line bg-white/[0.02] text-fg-muted hover:border-line-strong hover:text-fg"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Filtres complets : bottom sheet sur mobile (poignée glissable), panneau latéral sur desktop. Monté uniquement quand ouvert. */
export function FilterSheet({
  onClose,
  initial,
  brands,
  years,
  onApply,
}: {
  onClose: () => void;
  initial: CatalogParams;
  brands: { filterKey: string; label: string }[];
  years: number[];
  onApply: (p: CatalogParams) => void;
}) {
  const t = useTranslations("ui");
  const tc = useTranslations("catalog");
  const tn = useTranslations("nav");
  const locale = useLocale();
  const [draft, setDraft] = useState<CatalogParams>(initial);
  const [count, setCount] = useState<number | null>(null);
  const [dragY, setDragY] = useState(0);
  const dragStart = useRef<number | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  useEffect(() => {
    const ctrl = new AbortController();
    const id = window.setTimeout(() => {
      fetch(`/api/catalog/count${buildCatalogQuery(draft)}`, { signal: ctrl.signal })
        .then((r) => r.json() as Promise<{ count: number | null }>)
        .then((d) => setCount(d.count))
        .catch(() => {});
    }, 220);
    return () => {
      ctrl.abort();
      window.clearTimeout(id);
    };
  }, [draft]);

  const set = (k: CatalogFilterKey) => (v: string) => setDraft((d) => ({ ...d, [k]: v || undefined }));

  function onHandleDown(e: ReactPointerEvent<HTMLDivElement>) {
    dragStart.current = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onHandleMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (dragStart.current == null) return;
    setDragY(Math.max(0, e.clientY - dragStart.current));
  }
  function onHandleUp() {
    if (dragY > 110) onClose();
    dragStart.current = null;
    setDragY(0);
  }

  return createPortal(
    <div className="fixed inset-0 z-[60]">
      <button type="button" aria-label={t("filtersTitle")} tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-sheet-title"
        tabIndex={-1}
        style={dragY ? { transform: `translateY(${dragY}px)` } : undefined}
        className="sheet-in absolute inset-x-0 bottom-0 flex max-h-[90svh] flex-col rounded-t-[16px] border border-line-strong bg-graphite shadow-2xl outline-none sm:inset-y-0 sm:end-0 sm:start-auto sm:max-h-none sm:w-[440px] sm:rounded-none sm:rounded-s-[16px]"
      >
        <div
          className="flex touch-none justify-center pb-1 pt-3 sm:hidden"
          onPointerDown={onHandleDown}
          onPointerMove={onHandleMove}
          onPointerUp={onHandleUp}
          onPointerCancel={onHandleUp}
          aria-hidden
        >
          <span className="h-1 w-10 rounded-full bg-white/20" />
        </div>
        <div className="flex items-center justify-between border-b border-line px-5 py-3 sm:py-5">
          <h2 id="filter-sheet-title" className="text-lg font-semibold text-fg">
            {t("filtersTitle")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={tn("close")}
            className={`flex h-11 w-11 items-center justify-center rounded-full text-fg-muted transition hover:bg-white/[0.06] hover:text-fg ${focusRing}`}
          >
            <IconClose size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5">
          <Section title={t("sortLabel")}>
            <Chips
              value={draft.sort && draft.sort !== "brand" ? draft.sort : ""}
              onChange={(v) => setDraft((d) => ({ ...d, sort: v || undefined }))}
              options={SORT_VALUES.filter((s) => s !== "brand").map((s) => ({ value: s, label: sortLabel(t, s) }))}
            />
          </Section>
          <Section title={t("filterBrand")}>
            <FilterSelect
              label={t("filterBrand")}
              value={draft.brand ?? ""}
              onChange={set("brand")}
              placeholder={t("anyBrand")}
              options={brands.map((b) => ({ value: b.filterKey, label: b.label }))}
            />
          </Section>
          <Section title={t("filterPrice")}>
            <Chips
              value={currentPriceValue(draft)}
              onChange={(v) => setDraft((d) => applyPriceValue(d, v))}
              options={PRICE_OPTIONS.map((o) => ({ value: o.value, label: priceRangeLabel(t, o.min, o.max, locale) }))}
            />
          </Section>
          <Section title={t("filterBody")}>
            <Chips value={draft.body ?? ""} onChange={set("body")} options={BODY_VALUES.map((v) => ({ value: v, label: bodyLabel(tc, v) }))} />
          </Section>
          <Section title={t("filterFuel")}>
            <Chips value={draft.fuel ?? ""} onChange={set("fuel")} options={FUEL_VALUES.map((v) => ({ value: v, label: fuelLabel(tc, v) }))} />
          </Section>
          <Section title={t("filterGearbox")}>
            <Chips
              value={draft.transmission ?? ""}
              onChange={set("transmission")}
              options={GEARBOX_VALUES.map((v) => ({ value: v, label: gearboxLabel(tc, v) }))}
            />
          </Section>
          <Section title={t("filterYear")}>
            <FilterSelect
              label={t("filterYear")}
              value={draft.year ?? ""}
              onChange={set("year")}
              placeholder={t("any")}
              options={years.map((y) => ({ value: String(y), label: String(y) }))}
            />
          </Section>
          <Section title={t("filterCondition")}>
            <Chips
              value={draft.condition ?? ""}
              onChange={set("condition")}
              options={CONDITION_VALUES.map((v) => ({ value: v, label: conditionLabel(t, v) }))}
            />
          </Section>
          <Section title={t("filterUsage")}>
            <Chips value={draft.usage ?? ""} onChange={set("usage")} options={USAGE_VALUES.map((v) => ({ value: v, label: usageLabel(t, v) }))} />
          </Section>
        </div>

        <div className="grid grid-cols-[auto_1fr] gap-3 border-t border-line bg-graphite px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
          <button type="button" onClick={() => setDraft({ q: draft.q, sort: draft.sort })} className={`${btnSecondary} uppercase tracking-[0.08em]`}>
            {t("reset")}
          </button>
          <button
            type="button"
            onClick={() => onApply(draft)}
            disabled={count === 0}
            className={`${btnPrimary} uppercase tracking-[0.08em] disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {count == null ? t("showResultsPending") : t("showResults", { n: count })}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
