"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { AppFooter } from "@/components/AppFooter";
import { btnPrimary } from "@/components/ui/styles";

type NavItem = { href: string; label: string };

function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect width="40" height="40" rx="12" className="fill-emerald-600" />
      <path
        d="M10 24c2.5-6 6.5-10 12-10 4 0 7 2 8 5M12 27h16M14 20h2.5M23.5 20H26"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShellNavList({
  pathname,
  items,
  listClassName,
  variant,
  onNavigate,
}: {
  pathname: string;
  items: NavItem[];
  listClassName?: string;
  variant: "desktop" | "drawer";
  onNavigate?: () => void;
}) {
  return (
    <ul className={listClassName}>
      {items.map((item) => {
        const active = pathname === item.href;
        const base =
          variant === "desktop"
            ? `block rounded-full px-3 py-2 text-sm font-medium transition ${
                active ? "bg-white/15 text-white shadow-inner" : "text-emerald-100/90 hover:bg-white/10 hover:text-white"
              }`
            : `block rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active ? "bg-white/15 text-white" : "text-emerald-100 hover:bg-white/10"
              }`;
        return (
          <li key={item.href}>
            <Link href={item.href} className={base} onClick={onNavigate}>
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function Shell({
  locale,
  children,
}: {
  locale: string;
  children: React.ReactNode;
}) {
  const t = useTranslations("nav");
  const ts = useTranslations("shell");
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const other = locale === "ar" ? "fr" : "ar";
  const switchLabel = t("switchLang");

  const nav: NavItem[] = [
    { href: "/", label: t("home") },
    { href: "/catalog", label: t("catalog") },
    { href: "/fiches-techniques", label: t("fiches") },
    { href: "/compare", label: t("compare") },
    { href: "/reviews", label: t("reviews") },
    { href: "/assistant", label: t("assistant") },
    { href: "/account", label: t("account") },
  ];

  const closeMobile = () => setMobileOpen(false);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b border-emerald-950/20 bg-emerald-950 text-[11px] text-emerald-200/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-1.5 sm:px-6">
          <span className="tracking-wide">{ts("topbar")}</span>
          <button
            type="button"
            onClick={() => router.replace(pathname, { locale: other })}
            className="rounded-md px-2 py-0.5 font-medium text-emerald-50 hover:bg-white/10"
          >
            {switchLabel}
          </button>
        </div>
      </div>

      <header className="sticky top-0 z-30 border-b border-emerald-900/15 bg-emerald-950/95 text-emerald-50 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.45)] backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-3" onClick={closeMobile}>
            <LogoMark />
            <div className="min-w-0 leading-tight">
              <span className="block truncate text-base font-bold tracking-tight text-white sm:text-lg">Auto Maroc</span>
              <span className="hidden text-[11px] font-medium text-emerald-300/90 sm:block">{ts("tagline")}</span>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
            <ShellNavList pathname={pathname} items={nav} listClassName="flex flex-wrap items-center gap-1" variant="desktop" />
            <span className="mx-2 h-6 w-px bg-white/15" aria-hidden />
            <Link href="/admin" className="rounded-full px-3 py-2 text-sm font-medium text-emerald-200 hover:bg-white/10 hover:text-white">
              {t("admin")}
            </Link>
            <Link href="/auth/sign-in" className={`${btnPrimary} !py-2 !text-xs sm:!text-sm`}>
              {t("signIn")}
            </Link>
          </nav>

          <div className="flex items-center gap-2 lg:hidden">
            <Link href="/auth/sign-in" className={`${btnPrimary} !px-3 !py-2 !text-xs`} onClick={closeMobile}>
              {t("signIn")}
            </Link>
            <button
              type="button"
              aria-expanded={mobileOpen}
              aria-controls="mobile-drawer"
              onClick={() => setMobileOpen((v) => !v)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/5 text-white hover:bg-white/10"
            >
              <span className="sr-only">{mobileOpen ? t("close") : t("menu")}</span>
              {mobileOpen ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              aria-label={t("close")}
              onClick={closeMobile}
            />
            <div
              id="mobile-drawer"
              className="fixed inset-y-0 z-50 w-[min(100%,20rem)] border-e border-emerald-900/30 bg-emerald-950 p-4 shadow-2xl lg:hidden start-0"
            >
              <ShellNavList
                pathname={pathname}
                items={nav}
                listClassName="flex flex-col gap-1"
                variant="drawer"
                onNavigate={closeMobile}
              />
              <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
                <Link
                  href="/admin"
                  className="block rounded-xl px-3 py-2 text-sm text-emerald-100 hover:bg-white/10"
                  onClick={closeMobile}
                >
                  {t("admin")}
                </Link>
              </div>
            </div>
          </>
        )}
      </header>

      <main className="relative mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">{children}</main>

      <AppFooter />
    </div>
  );
}
