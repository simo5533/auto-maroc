import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db-ready";
import { prisma } from "@/lib/prisma";
import { DatabaseRequiredMessage } from "@/components/DatabaseRequiredMessage";
import { Link } from "@/i18n/navigation";
import { LogoutButton } from "@/components/LogoutButton";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/Card";
import { btnPrimary } from "@/components/ui/styles";
import {
  carBrandLabel,
  carModelLabel,
  pickLocaleText,
  reviewComment,
} from "@/lib/locale-text";

function parseCarIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((id): id is string => typeof id === "string" && id.length > 0);
}

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  if (!isDatabaseConfigured()) {
    return <DatabaseRequiredMessage />;
  }

  const { locale } = await params;
  const t = await getTranslations("account");
  const session = await getSession();
  const user = session
    ? await prisma.user.findUnique({
        where: { id: session.sub },
        select: {
          email: true,
          role: true,
          comparisons: {
            orderBy: { createdAt: "desc" },
            take: 12,
            select: {
              id: true,
              createdAt: true,
              carIds: true,
              conclusionAr: true,
              conclusionFr: true,
            },
          },
          reviews: {
            orderBy: { createdAt: "desc" },
            take: 12,
            select: {
              id: true,
              status: true,
              globalNote: true,
              commentAr: true,
              commentFr: true,
              createdAt: true,
              car: {
                select: { id: true, brandAr: true, brandFr: true, modelAr: true, modelFr: true },
              },
            },
          },
        },
      })
    : null;

  const comparisonCarIds = [
    ...new Set((user?.comparisons ?? []).flatMap((c) => parseCarIds(c.carIds))),
  ];
  const comparisonCars =
    comparisonCarIds.length > 0
      ? await prisma.car.findMany({
          where: { id: { in: comparisonCarIds } },
          select: { id: true, brandAr: true, brandFr: true, modelAr: true, modelFr: true },
        })
      : [];
  const carById = new Map(comparisonCars.map((c) => [c.id, c]));

  return (
    <div className="space-y-8">
      <PageHeader title={t("title")} description={t("subtitle")} eyebrow={t("eyebrow")} />
      <Card className="max-w-lg" padding="p-6 sm:p-8">
        {user ? (
          <div className="space-y-4">
            <p className="text-sm text-zinc-600">
              {t("signedIn")}{" "}
              <span className="font-semibold text-zinc-900">{user.email}</span>
            </p>
            <p className="inline-flex rounded-lg bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-600">
              {user.role}
            </p>
            <LogoutButton />
          </div>
        ) : (
          <div className="space-y-4 text-center sm:text-start">
            <p className="text-sm text-zinc-600">{t("guest")}</p>
            <Link href="/auth/sign-in" className={`${btnPrimary} inline-flex`}>
              → {locale === "ar" ? "تسجيل الدخول / إنشاء حساب" : "Connexion / Inscription"}
            </Link>
          </div>
        )}
      </Card>

      {user ? (
        <section className="space-y-6">
          <h2 className="text-lg font-bold text-zinc-900">{t("historyTitle")}</h2>

          <Card padding="p-5 sm:p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-800">
              {t("comparisonsTitle")}
            </h3>
            {user.comparisons.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-600">{t("noComparisons")}</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {user.comparisons.map((cmp) => {
                  const ids = parseCarIds(cmp.carIds);
                  const labels = ids
                    .map((id) => {
                      const car = carById.get(id);
                      if (!car) return null;
                      return `${carBrandLabel(car, locale)} ${carModelLabel(car, locale)}`;
                    })
                    .filter(Boolean)
                    .join(" · ");
                  const conclusion = pickLocaleText(locale, cmp.conclusionAr, cmp.conclusionFr);
                  return (
                    <li key={cmp.id} className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 text-sm">
                      <p className="font-semibold text-zinc-900">{labels || `${ids.length} modèles`}</p>
                      {conclusion ? (
                        <p className="mt-2 leading-relaxed text-zinc-700">{conclusion}</p>
                      ) : null}
                      <p className="mt-2 text-xs text-zinc-500">
                        {cmp.createdAt.toLocaleDateString(locale === "ar" ? "ar-MA" : "fr-FR")}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
            <Link href="/compare" className="mt-4 inline-block text-sm font-semibold text-emerald-700 hover:underline">
              {t("compareAgain")} →
            </Link>
          </Card>

          <Card padding="p-5 sm:p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-800">{t("reviewsTitle")}</h3>
            {user.reviews.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-600">{t("noReviews")}</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {user.reviews.map((r) => (
                  <li key={r.id} className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 text-sm">
                    <p className="font-semibold text-zinc-900">
                      {carBrandLabel(r.car, locale)} {carModelLabel(r.car, locale)}
                      {r.globalNote != null ? ` · ${r.globalNote}/5` : ""}
                    </p>
                    <p className="mt-2 leading-relaxed text-zinc-700">{reviewComment(r, locale)}</p>
                    <p className="mt-2 text-xs text-zinc-500">
                      {r.status} · {r.createdAt.toLocaleDateString(locale === "ar" ? "ar-MA" : "fr-FR")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/reviews" className="mt-4 inline-block text-sm font-semibold text-emerald-700 hover:underline">
              {t("writeReview")} →
            </Link>
          </Card>
        </section>
      ) : null}
    </div>
  );
}
