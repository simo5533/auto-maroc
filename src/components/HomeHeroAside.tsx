"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const BRAND_SLUGS = [
  "renault",
  "dacia",
  "peugeot",
  "toyota",
  "citroen",
  "bmw",
  "volkswagen",
  "hyundai",
  "ford",
  "nissan",
] as const;

function AiRobotFigure({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="home-robot-face" x1="40" y1="30" x2="88" y2="98" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ecfdf5" />
          <stop offset="1" stopColor="#a7f3d0" />
        </linearGradient>
        <filter id="home-robot-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* antennes */}
      <line x1="50" y1="32" x2="48" y2="12" stroke="rgba(255,255,255,0.55)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="70" y1="32" x2="72" y2="12" stroke="rgba(255,255,255,0.55)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="46" cy="10" r="3" fill="#6ee7b7" className="motion-safe:animate-pulse" />
      <circle cx="74" cy="10" r="3" fill="#6ee7b7" className="motion-safe:animate-pulse" style={{ animationDelay: "0.35s" }} />
      {/* corps */}
      <rect x="34" y="32" width="52" height="56" rx="14" fill="url(#home-robot-face)" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
      {/* yeux */}
      <circle cx="52" cy="58" r="6" fill="#047857" filter="url(#home-robot-glow)" className="motion-safe:animate-home-blink" />
      <circle cx="68" cy="58" r="6" fill="#047857" filter="url(#home-robot-glow)" className="motion-safe:animate-home-blink motion-safe:[animation-delay:0.08s]" />
      <circle cx="53" cy="57" r="2" fill="#ecfdf5" opacity="0.9" />
      <circle cx="69" cy="57" r="2" fill="#ecfdf5" opacity="0.9" />
      {/* bouche LED */}
      <rect x="48" y="74" width="24" height="4" rx="2" fill="rgba(6,95,70,0.85)" className="motion-safe:animate-pulse" />
      {/* base */}
      <ellipse cx="60" cy="118" rx="28" ry="10" fill="rgba(255,255,255,0.12)" />
      <path
        d="M44 88 L44 108 Q60 118 76 108 L76 88"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="2"
        fill="none"
      />
      <rect x="46" y="96" width="28" height="18" rx="6" fill="rgba(255,255,255,0.14)" stroke="rgba(255,255,255,0.2)" />
    </svg>
  );
}

export function HomeHeroAside() {
  const t = useTranslations("home");

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-5 lg:max-w-none lg:items-end">
      <div className="relative flex w-full flex-col items-center rounded-2xl border border-white/15 bg-white/5 p-5 shadow-lg backdrop-blur-sm sm:flex-row sm:items-stretch sm:gap-4 sm:p-4">
        <div className="motion-safe:animate-home-float">
          <AiRobotFigure className="h-32 w-28 shrink-0 sm:h-36 sm:w-32" />
        </div>
        <div className="mt-3 flex min-w-0 flex-1 flex-col justify-center text-center sm:mt-0 sm:text-start">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200/90">{t("aiBadge")}</p>
          <p className="mt-2 text-sm leading-relaxed text-emerald-50/95">{t("aiHint")}</p>
          <Link
            href="/assistant"
            className="mt-3 inline-flex items-center justify-center gap-2 self-center rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20 sm:self-start"
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_2px_rgba(110,231,183,0.6)] motion-safe:animate-pulse" aria-hidden />
            {t("aiCta")}
          </Link>
        </div>
      </div>

      <div className="w-full">
        <p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-[0.25em] text-emerald-200/70 lg:text-end">
          {t("brandsLabel")}
        </p>
        <div
          className="relative overflow-hidden rounded-xl border border-white/10 bg-black/15 py-3 [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]"
          aria-label={t("brandsMarqueeAria")}
        >
          <div className="motion-safe:animate-home-marquee flex w-max gap-10 motion-reduce:animate-none">
            {[0, 1].map((dup) => (
              <div key={dup} className="flex shrink-0 items-center gap-10 pe-4">
                {BRAND_SLUGS.map((slug) => (
                  <Image
                    key={`${dup}-${slug}`}
                    src={`https://cdn.simpleicons.org/${slug}/ffffff`}
                    width={36}
                    height={36}
                    alt=""
                    className="h-9 w-9 opacity-90 transition duration-300 hover:scale-110 hover:opacity-100"
                    loading="lazy"
                    unoptimized
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
