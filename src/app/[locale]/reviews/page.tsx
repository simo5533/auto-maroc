import { getTranslations } from "next-intl/server";
import { isDatabaseConfigured } from "@/lib/db-ready";
import { prisma } from "@/lib/prisma";
import { DatabaseRequiredMessage } from "@/components/DatabaseRequiredMessage";
import { ReviewForm } from "@/components/ReviewForm";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/Card";

export default async function ReviewsPage({ params }: { params: Promise<{ locale: string }> }) {
  if (!isDatabaseConfigured()) {
    return <DatabaseRequiredMessage />;
  }

  const { locale } = await params;
  const t = await getTranslations("reviews");
  const reviews = await prisma.review.findMany({
    where: { status: "APPROVED" },
    include: { car: { select: { id: true, brandAr: true, modelAr: true, brandFr: true, modelFr: true } } },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  return (
    <div>
      <PageHeader title={t("title")} description={t("subtitle")} eyebrow={t("eyebrow")} />
      <ReviewForm locale={locale as "ar" | "fr"} />
      <ul className="space-y-4">
        {reviews.map((r) => (
          <li key={r.id}>
            <Card hover padding="p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                {locale === "ar"
                  ? `${r.car.brandAr} ${r.car.modelAr}`
                  : `${r.car.brandFr ?? r.car.brandAr} ${r.car.modelFr ?? r.car.modelAr}`}
              </p>
              <p className="mt-1 text-xs text-zinc-500">{r.displayLabel}</p>
              <p className="mt-3 text-sm leading-relaxed text-zinc-800">
                {locale === "ar" ? r.commentAr : r.commentFr ?? r.commentAr}
              </p>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
