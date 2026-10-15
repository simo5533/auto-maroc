"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { focusRing } from "@/components/ui/styles";

const linkClass = `inline-flex min-h-9 items-center text-sm text-fg-muted transition hover:text-fg ${focusRing} rounded`;

export function AppFooter() {
  const t = useTranslations("footer");
  const nav = useTranslations("nav");
  const legal = useTranslations("legal");

  return (
    <footer className="mt-auto border-t border-line bg-ink">
      <div className="mx-auto w-full max-w-[1440px] px-5 pb-10 pt-16 sm:px-8 lg:px-12 lg:pt-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
          <div className="max-w-sm space-y-4">
            <p className="text-2xl font-semibold tracking-[-0.02em] text-fg">Auto Maroc</p>
            <p className="text-sm leading-relaxed text-fg-muted">{t("tagline")}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-steel">{t("explore")}</p>
            <ul className="mt-4 space-y-1">
              <li>
                <Link href="/catalog" className={linkClass}>
                  {t("catalog")}
                </Link>
              </li>
              <li>
                <Link href="/fiches-techniques" className={linkClass}>
                  {nav("fiches")}
                </Link>
              </li>
              <li>
                <Link href="/compare" className={linkClass}>
                  {t("compare")}
                </Link>
              </li>
              <li>
                <Link href="/reviews" className={linkClass}>
                  {t("reviews")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-steel">{t("services")}</p>
            <ul className="mt-4 space-y-1">
              <li>
                <Link href="/assistant" className={linkClass}>
                  {t("assistant")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-steel">{t("account")}</p>
            <ul className="mt-4 space-y-1">
              <li>
                <Link href="/account" className={linkClass}>
                  {t("myAccount")}
                </Link>
              </li>
              <li>
                <Link href="/auth/sign-in" className={linkClass}>
                  {t("signIn")}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-16 flex flex-col gap-4 border-t border-line pt-8 text-xs leading-relaxed text-steel sm:flex-row sm:items-start sm:justify-between">
          <p className="max-w-2xl">{legal("short")}</p>
          <p className="shrink-0">{t("rights", { year: new Date().getFullYear() })}</p>
        </div>
      </div>
    </footer>
  );
}
