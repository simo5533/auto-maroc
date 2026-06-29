import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/Card";

export async function DatabaseRequiredMessage() {
  const t = await getTranslations("errors");
  return (
    <Card className="border-amber-200 bg-amber-50/90" padding="p-6 sm:p-8">
      <h1 className="text-lg font-bold text-amber-950">{t("dbTitle")}</h1>
      <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-amber-950/90">{t("dbBody")}</p>
    </Card>
  );
}
