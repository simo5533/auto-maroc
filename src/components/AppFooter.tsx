"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function AppFooter() {
  const t = useTranslations("footer");
  const legal = useTranslations("legal");

  return (
    <footer className="mt-auto border-t border-zinc-200/90 bg-zinc-50/95">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <p className="text-sm font-bold text-zinc-900">Auto Maroc</p>
            <p className="text-sm leading-relaxed text-zinc-600">{t("tagline")}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{t("explore")}</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/catalog" className="text-zinc-700 hover:text-emerald-700">
                  {t("catalog")}
                </Link>
              </li>
              <li>
                <Link href="/compare" className="text-zinc-700 hover:text-emerald-700">
                  {t("compare")}
                </Link>
              </li>
              <li>
                <Link href="/reviews" className="text-zinc-700 hover:text-emerald-700">
                  {t("reviews")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{t("services")}</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/assistant" className="text-zinc-700 hover:text-emerald-700">
                  {t("assistant")}
                </Link>
              </li>
              <li>
                <Link href="/diagnostic-photo" className="text-zinc-700 hover:text-emerald-700">
                  {t("photo")}
                </Link>
              </li>
              <li>
                <Link href="/obd2" className="text-zinc-700 hover:text-emerald-700">
                  {t("obd2")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{t("account")}</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/account" className="text-zinc-700 hover:text-emerald-700">
                  {t("myAccount")}
                </Link>
              </li>
              <li>
                <Link href="/auth/sign-in" className="text-zinc-700 hover:text-emerald-700">
                  {t("signIn")}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-center text-xs leading-relaxed text-amber-950">
          {legal("short")}
        </div>
        <p className="mt-6 text-center text-xs text-zinc-500">{t("rights", { year: new Date().getFullYear() })}</p>
      </div>
    </footer>
  );
}
