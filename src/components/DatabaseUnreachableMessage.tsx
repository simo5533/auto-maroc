import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/Card";

export async function DatabaseUnreachableMessage() {
  const t = await getTranslations("errors");
  return (
    <Card className="border-rose-200 bg-rose-50/90" padding="p-6 sm:p-8">
      <h1 className="text-lg font-bold text-rose-950">{t("dbUnreachableTitle")}</h1>
      <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-rose-950/90">{t("dbUnreachableBody")}</p>
    </Card>
  );
}
