"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { AppFooter } from "@/components/AppFooter";
import { IconClose, IconMenu, IconUser } from "@/components/ui/icons";
import { focusRing } from "@/components/ui/styles";

type NavItem = { href: string; label: string };

function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="0.5" y="0.5" width="39" height="39" rx="10" className="fill-carbon stroke-white/15" />
      <path
        d="M9 25c2.6-6.4 6.8-10.5 12.4-10.5 4.1 0 7.1 2 8.4 5.3M11 28h18"
        className="stroke-accent"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Pages qui gèrent elles-mêmes leur mise en page pleine largeur. */
function isFullBleedRoute(pathname: string): boolean {
  return pathname === "/" || pathname === "/catalog" || pathname.startsWith("/cars/");
}

export function Shell({
  locale,
  children,
}: {
  locale: string;
  children: React.ReactNode;
}) {
  const t = useTranslations("nav");
  const tu = useTranslations("ui");
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const other = locale === "ar" ? "fr" : "ar";

  const nav: NavItem[] = [
    { href: "/catalog", label: t("catalog") },
    { href: "/fiches-techniques", label: t("fiches") },
    { href: "/compare", label: t("compare") },
    { href: "/reviews", label: t("reviews") },
    { href: "/assistant", label: t("assistant") },
  ];

  const isHome = pathname === "/";
  const fullBleed = isFullBleedRoute(pathname);
  const transparent = isHome && !scrolled && !mobileOpen;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setMobileOpen(false);
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#contenu"
        className="sr-only z-[60] rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink focus:not-sr-only focus:fixed focus:start-4 focus:top-4"
      >
        {tu("skipToContent")}
      </a>

      <header
        className={`fixed inset-x-0 top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-[250ms] ${
          transparent ? "border-b border-transparent bg-transparent" : "glass border-b border-line"
        }`}
      >
        <div className="mx-auto flex h-[var(--header-h)] w-full max-w-[1440px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
          <Link href="/" className={`flex min-w-0 items-center gap-3 rounded-lg ${focusRing}`}>
            <LogoMark />
            <span className="truncate text-[15px] font-semibold tracking-[-0.01em] text-fg">Auto Maroc</span>
          </Link>

          <nav className="hidden lg:block" aria-label="Main">
            <ul className="flex items-center gap-1">
              {nav.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`relative inline-flex min-h-11 items-center rounded-lg px-3.5 text-[13px] font-medium transition-colors ${focusRing} ${
                        active ? "text-fg" : "text-fg-muted hover:text-fg"
                      }`}
                    >
                      {item.label}
                      <span
                        aria-hidden
                        className={`absolute inset-x-3.5 bottom-1.5 h-px origin-center bg-accent transition-transform duration-200 ${
                          active ? "scale-x-100" : "scale-x-0"
                        }`}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => router.replace(pathname, { locale: other })}
              className={`hidden min-h-11 rounded-lg px-3 text-[13px] font-medium text-fg-muted transition hover:text-fg sm:inline-flex sm:items-center ${focusRing}`}
            >
              {t("switchLang")}
            </button>
            <Link
              href="/account"
              aria-label={t("account")}
              className={`hidden h-11 w-11 items-center justify-center rounded-lg text-fg-muted transition hover:bg-white/[0.05] hover:text-fg sm:inline-flex ${focusRing}`}
            >
              <IconUser size={19} />
            </Link>
            <Link
              href="/auth/sign-in"
              className={`hidden min-h-10 items-center rounded-[10px] border border-line-strong px-4 text-[13px] font-semibold text-fg transition hover:border-white/35 lg:inline-flex ${focusRing}`}
            >
              {t("signIn")}
            </Link>
            <button
              type="button"
              aria-expanded={mobileOpen}
              aria-controls="mobile-drawer"
              onClick={() => setMobileOpen((v) => !v)}
              className={`inline-flex h-11 w-11 items-center justify-center rounded-lg text-fg transition hover:bg-white/[0.06] lg:hidden ${focusRing}`}
            >
              <span className="sr-only">{mobileOpen ? t("close") : t("menu")}</span>
              {mobileOpen ? <IconClose size={22} /> : <IconMenu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div id="mobile-drawer" className="glass fixed inset-x-0 bottom-0 top-[var(--header-h)] z-30 overflow-y-auto border-t border-line lg:hidden">
          <nav aria-label="Mobile" className="mx-auto max-w-[1440px] px-5 py-6 sm:px-8">
            <ul className="divide-y divide-white/[0.06]">
              {[{ href: "/", label: t("home") }, ...nav].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(item.href) && item.href !== "/" ? "page" : undefined}
                    className={`flex min-h-14 items-center text-2xl font-semibold tracking-[-0.02em] ${focusRing} ${
                      pathname === item.href ? "text-accent" : "text-fg"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-8 grid gap-3">
              <Link
                href="/auth/sign-in"
                className={`inline-flex min-h-12 items-center justify-center rounded-[10px] bg-accent text-sm font-semibold text-accent-ink ${focusRing}`}
              >
                {t("signIn")}
              </Link>
              <div className="flex items-center justify-between gap-3 text-sm">
                <Link href="/account" className={`min-h-11 inline-flex items-center text-fg-muted hover:text-fg ${focusRing}`}>
                  {t("account")}
                </Link>
                <Link href="/admin" className={`min-h-11 inline-flex items-center text-fg-muted hover:text-fg ${focusRing}`}>
                  {t("admin")}
                </Link>
                <button
                  type="button"
                  onClick={() => router.replace(pathname, { locale: other })}
                  className={`min-h-11 text-fg-muted hover:text-fg ${focusRing}`}
                >
                  {t("switchLang")}
                </button>
              </div>
            </div>
          </nav>
        </div>
      )}

      <main
        id="contenu"
        className={
          fullBleed
            ? `relative flex-1 ${isHome ? "" : "pt-[var(--header-h)]"}`
            : "relative mx-auto w-full max-w-6xl flex-1 px-5 pb-20 pt-[calc(var(--header-h)+2.5rem)] sm:px-8"
        }
      >
        {children}
      </main>

      <AppFooter />
    </div>
  );
}
