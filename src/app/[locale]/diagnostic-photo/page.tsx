import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/Card";

export default async function PhotoPage() {
  const t = await getTranslations("photo");
  return (
    <div>
      <PageHeader title={t("title")} description={t("subtitle")} eyebrow={t("eyebrow")} />
      <Card padding="p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-600 to-indigo-700 text-white shadow-lg shadow-sky-600/30">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
              <path strokeLinecap="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm leading-relaxed text-zinc-700 sm:text-base">{t("body")}</p>
        </div>
      </Card>
    </div>
  );
}
