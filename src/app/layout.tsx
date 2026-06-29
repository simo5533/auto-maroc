import type { ReactNode } from "react";
import { headers } from "next/headers";
import { Noto_Sans_Arabic } from "next/font/google";
import { routing } from "@/i18n/routing";
import "./globals.css";

const notoArabic = Noto_Sans_Arabic({
  subsets: ["arabic", "latin"],
  variable: "--font-arabic",
  display: "swap",
});

/** En-tête injecté par le middleware next-intl (voir node_modules/next-intl/.../constants.js). */
const NEXT_INTL_LOCALE_HEADER = "x-next-intl-locale";

export default async function RootLayout({ children }: { children: ReactNode }) {
  const h = await headers();
  const raw = h.get(NEXT_INTL_LOCALE_HEADER) ?? routing.defaultLocale;
  const locale = raw === "ar" || raw === "fr" ? raw : routing.defaultLocale;
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body className={`${notoArabic.variable} min-h-screen font-sans antialiased text-zinc-900`}>{children}</body>
    </html>
  );
}
