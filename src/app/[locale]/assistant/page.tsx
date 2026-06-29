import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/Card";
import { SiteAssistantChat } from "@/components/SiteAssistantChat";
import { isOpenAiConfigured } from "@/lib/openai-env";

export default async function AssistantPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("assistant");
  return (
    <div>
      <PageHeader title={t("title")} description={t("subtitle")} eyebrow={t("eyebrow")} />
      <Card padding="p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-600/30">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
              <path strokeLinecap="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <p className="text-sm leading-relaxed text-zinc-700 sm:text-base">{t("body")}</p>
        </div>
      </Card>
      <Card className="mt-6" padding="p-6 sm:p-8">
        <SiteAssistantChat locale={locale === "ar" ? "ar" : "fr"} openAiEnabled={isOpenAiConfigured()} />
      </Card>
    </div>
  );
}
