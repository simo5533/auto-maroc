import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/Card";

export default async function ObdPage() {
  const t = await getTranslations("obd2");
  return (
    <div>
      <PageHeader title={t("title")} description={t("subtitle")} eyebrow={t("eyebrow")} />
      <Card padding="p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-700 text-white shadow-lg shadow-violet-600/30">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
              <path strokeLinecap="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          </div>
          <p className="text-sm leading-relaxed text-zinc-700 sm:text-base">{t("body")}</p>
        </div>
      </Card>
    </div>
  );
}
