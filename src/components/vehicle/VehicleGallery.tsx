"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { VehicleImage } from "@/components/vehicle/VehicleImage";
import { IconChevronLeft, IconChevronRight } from "@/components/ui/icons";
import { focusRing } from "@/components/ui/styles";

/** Galerie scène : swipe natif (scroll-snap), flèches, vignettes, compteur « 2 / 8 ». URLs affichées telles quelles. */
export function VehicleGallery({ images, alt }: { images: string[]; alt: string }) {
  const t = useTranslations("ui");
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [index, setIndex] = useState(0);
  const total = images.length;

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const w = track.clientWidth || 1;
        setIndex(Math.min(total - 1, Math.max(0, Math.round(Math.abs(track.scrollLeft) / w))));
      });
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      track.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [total]);

  const goTo = useCallback((i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rtl = getComputedStyle(track).direction === "rtl";
    track.scrollTo({ left: i * track.clientWidth * (rtl ? -1 : 1), behavior: reduce ? "auto" : "smooth" });
  }, []);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const rtl = document.documentElement.dir === "rtl";
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goTo(Math.min(total - 1, index + (rtl ? -1 : 1)));
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      goTo(Math.max(0, index + (rtl ? 1 : -1)));
    }
  }

  if (total === 0) {
    return (
      <div className="showroom-stage relative aspect-[16/10] overflow-hidden rounded-[14px] border border-line">
        <VehicleImage src={null} alt={alt} sizes="100vw" placeholderLabel={t("noImage")} />
      </div>
    );
  }

  const arrow = `absolute top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full glass border border-line-strong text-fg transition hover:border-white/30 disabled:pointer-events-none disabled:opacity-0 md:flex ${focusRing}`;

  return (
    <section aria-roledescription="carousel" aria-label={t("galleryLabel")} className="space-y-3">
      <div className="showroom-stage group relative overflow-hidden rounded-[14px] border border-line">
        <div
          ref={trackRef}
          tabIndex={0}
          onKeyDown={onKeyDown}
          className={`no-scrollbar flex aspect-[16/10] snap-x snap-mandatory overflow-x-auto overscroll-x-contain outline-none ${focusRing}`}
        >
          {images.map((src, i) => (
            <div
              key={`${src}-${i}`}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} / ${total}`}
              className="relative h-full w-full shrink-0 snap-start"
            >
              <VehicleImage src={src} alt={i === 0 ? alt : `${alt} — ${i + 1}`} sizes="(max-width: 1023px) 100vw, 62vw" priority={i === 0} />
            </div>
          ))}
        </div>

        {total > 1 ? (
          <>
            <button type="button" onClick={() => goTo(index - 1)} disabled={index === 0} aria-label={t("galleryPrev")} className={`${arrow} start-4`}>
              <IconChevronLeft size={20} className="rtl:rotate-180" />
            </button>
            <button type="button" onClick={() => goTo(index + 1)} disabled={index === total - 1} aria-label={t("galleryNext")} className={`${arrow} end-4`}>
              <IconChevronRight size={20} className="rtl:rotate-180" />
            </button>
            <p className="glass pointer-events-none absolute bottom-4 end-4 rounded-full border border-line px-3 py-1 text-xs font-semibold tabular-nums text-fg" aria-live="polite">
              {index + 1} / {total}
            </p>
          </>
        ) : null}
      </div>

      {total > 1 ? (
        <ul className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <li key={`thumb-${src}-${i}`} className="shrink-0">
              <button
                type="button"
                onClick={() => goTo(i)}
                aria-label={t("galleryThumb", { n: i + 1 })}
                aria-current={i === index ? "true" : undefined}
                className={`relative block h-16 w-24 overflow-hidden rounded-[10px] border transition sm:h-[72px] sm:w-28 ${focusRing} ${
                  i === index ? "border-accent opacity-100" : "border-line opacity-55 hover:opacity-90"
                }`}
              >
                <Image src={src} alt="" fill unoptimized sizes="112px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
