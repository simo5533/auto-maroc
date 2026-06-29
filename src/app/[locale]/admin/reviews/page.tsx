import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { isDatabaseConfigured } from "@/lib/db-ready";
import { DatabaseRequiredMessage } from "@/components/DatabaseRequiredMessage";
import { Link } from "@/i18n/navigation";
import { AdminReviewsClient } from "@/components/AdminReviewsClient";
import { prisma } from "@/lib/prisma";
import { ReviewStatus } from "@prisma/client";
import { PageHeader } from "@/components/PageHeader";
import { btnSecondary } from "@/components/ui/styles";

export default async function AdminReviewsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const s = await getSession();
  if (!s || s.role !== "ADMIN") redirect(`/${locale}/auth/sign-in`);
  if (!isDatabaseConfigured()) {
    return <DatabaseRequiredMessage />;
  }
  const t = await getTranslations("admin");

  const initial = await prisma.review.findMany({
    where: { status: ReviewStatus.PENDING },
    include: { car: { select: { brandAr: true, modelAr: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <PageHeader title={t("reviews")} description={t("subtitle")} eyebrow={t("eyebrow")} />
      <Link href="/admin" className={`${btnSecondary} mb-8 inline-flex`}>
        ← {t("title")}
      </Link>
      <AdminReviewsClient initial={initial} />
    </div>
  );
}
