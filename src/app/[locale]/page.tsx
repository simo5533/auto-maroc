import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { btnPrimary, btnSecondary } from "@/components/ui/styles";
import { HomeHeroAside } from "@/components/HomeHeroAside";
import { HomeBrandSpotlight } from "@/components/HomeBrandSpotlight";
import { isDatabaseConfigured } from "@/lib/db-ready";
import { getPopularBrandsForHome } from "@/lib/home-popular-brands";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const loc = locale === "ar" ? "ar" : "fr";
  const t = await getTranslations("home");
  let models = 0;
  let reviews = 0;
  let popularBrands: Awaited<ReturnType<typeof getPopularBrandsForHome>> = [];
  try {
    [models, reviews] = await Promise.all([
      prisma.car.count(),
      prisma.review.count({ where: { status: "APPROVED" } }),
    ]);
    if (isDatabaseConfigured()) {
      popularBrands = await getPopularBrandsForHome(10);
    }
  } catch {
    /* build ou démarrage sans DB */
  }

  const modules = ["modCatalog", "modReviews", "modCompare", "modPhoto", "modObd2", "modAi"] as const;

  return (
    <div className="space-y-14 sm:space-y-16">      <section className="relative overflow-hidden rounded-3xl border border-emerald-900/20 bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800 p-8 text-white shadow-2xl sm:p-12 lg:p-14">
        <div
          className="pointer-events-none absolute -end-24 -top-24 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-16 -start-16 h-56 w-56 rounded-full bg-teal-400/15 blur-3xl"
          aria-hidden
        />
        <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(260px,340px)] lg:items-center lg:gap-12">
          <div className="max-w-3xl space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/90">Auto Maroc</p>
            <h1 className="text-3xl font-bold leading-[1.15] tracking-tight sm:text-4xl lg:text-5xl">{t("heroTitle")}</h1>
            <p className="max-w-2xl text-base leading-relaxed text-emerald-100/95 sm:text-lg">{t("heroSubtitle")}</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/catalog" className={`${btnPrimary} !bg-white !text-emerald-900 hover:!bg-emerald-50`}>
                {t("ctaCatalog")}
              </Link>
              <Link href="/compare" className={`${btnSecondary} !border-white/30 !bg-white/10 !text-white hover:!bg-white/15`}>
                {t("ctaCompare")}
              </Link>
            </div>
          </div>
          <HomeHeroAside />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card className="text-center sm:text-start" padding="p-6">
          <p className="text-3xl font-bold tabular-nums text-emerald-700">{models}</p>
          <p className="mt-1 text-sm font-medium text-zinc-600">{t("statModels")}</p>
        </Card>
        <Card className="text-center sm:text-start" padding="p-6">
          <p className="text-3xl font-bold tabular-nums text-emerald-700">{reviews}</p>
          <p className="mt-1 text-sm font-medium text-zinc-600">{t("statReviews")}</p>
        </Card>
        <Card className="text-center sm:text-start" padding="p-6">
          <p className="text-3xl font-bold tabular-nums text-emerald-700">6</p>
          <p className="mt-1 text-sm font-medium text-zinc-600">{t("statModules")}</p>
        </Card>
      </section>

      <section className="space-y-6">
        <div className="max-w-2xl space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">{t("valuePropTitle")}</h2>
          <p className="text-sm text-zinc-600">{t("statTitle")}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-emerald-100/80 bg-gradient-to-b from-white to-emerald-50/40" padding="p-6">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/25">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" d="M12 21s-7-4.5-7-11a7 7 0 1114 0c0 6.5-7 11-7 11z" />
                <circle cx="12" cy="10" r="2" fill="currentColor" stroke="none" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-zinc-900">{t("valueLocal")}</p>
          </Card>
          <Card className="border-emerald-100/80 bg-gradient-to-b from-white to-emerald-50/40" padding="p-6">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/25">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" d="M4 6h16M4 12h10M4 18h7" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-zinc-900">{t("valueCompare")}</p>
          </Card>
          <Card className="border-emerald-100/80 bg-gradient-to-b from-white to-emerald-50/40" padding="p-6">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/25">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" d="M12 11c1.5 0 3-1 3-3s-1-3-3-3-3 1-3 3 1.5 3 3 3z" />
                <path strokeLinecap="round" d="M5 21v-1a7 7 0 0114 0v1" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-zinc-900">{t("valueTrust")}</p>
          </Card>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">{t("modulesTitle")}</h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((key) => (
            <li key={key}>
              <Card hover className="h-full" padding="p-6">
                <p className="text-sm leading-relaxed text-zinc-700">{t(key)}</p>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      {popularBrands.length > 0 ? (
        <HomeBrandSpotlight brands={popularBrands} locale={loc} />
      ) : null}
    </div>
  );
}
