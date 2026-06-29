import { getTranslations } from "next-intl/server";
import { CompareClient } from "@/components/CompareClient";
import { PageHeader } from "@/components/PageHeader";

export default async function ComparePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const preA = typeof sp.a === "string" ? sp.a : "";
  const preB = typeof sp.b === "string" ? sp.b : "";
  const t = await getTranslations("compare");

  return (
    <div>
      <PageHeader title={t("title")} description={t("pick")} eyebrow={t("eyebrow")} />
      <CompareClient locale={locale as "ar" | "fr"} preA={preA} preB={preB} />
    </div>
  );
}
