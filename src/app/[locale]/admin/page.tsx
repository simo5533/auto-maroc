import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AdminCreateCarForm } from "@/components/AdminCreateCarForm";
import { ImportCatalogButton } from "@/components/ImportCatalogButton";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/Card";
import { btnSecondary } from "@/components/ui/styles";
import { isDatabaseConfigured } from "@/lib/db-ready";
import { DatabaseRequiredMessage } from "@/components/DatabaseRequiredMessage";

export default async function AdminHomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const s = await getSession();
  if (!s || s.role !== "ADMIN") redirect(`/${locale}/auth/sign-in`);
  if (!isDatabaseConfigured()) {
    return <DatabaseRequiredMessage />;
  }

  const t = await getTranslations("admin");
  const ti = await getTranslations("adminImport");

  return (
    <div>
      <PageHeader title={t("title")} description={t("subtitle")} eyebrow={t("eyebrow")} />
      <div className="mb-8 flex flex-wrap gap-3">
        <Link href="/admin/reviews" className={btnSecondary}>
          {t("reviews")}
        </Link>
        <Link href="/catalog" className={btnSecondary}>
          {t("cars")}
        </Link>
      </div>
      <Card className="mb-8" padding="p-6 sm:p-8">
        <h2 className="text-lg font-bold text-zinc-900">{ti("title")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">{ti("body")}</p>
        <div className="mt-5">
          <ImportCatalogButton />
        </div>
      </Card>
      <AdminCreateCarForm />
    </div>
  );
}
