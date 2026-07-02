import { getTranslations } from "next-intl/server";
import { isDatabaseConfigured } from "@/lib/db-ready";
import { prisma } from "@/lib/prisma";
import { DatabaseRequiredMessage } from "@/components/DatabaseRequiredMessage";
import { DatabaseUnreachableMessage } from "@/components/DatabaseUnreachableMessage";
import { isPrismaDbUnreachableError } from "@/lib/is-prisma-connection-error";
import { PageHeader } from "@/components/PageHeader";
import { FichesTechniquesClient, type FichesCar } from "@/components/FichesTechniquesClient";
import { getDisplayCarImageUrls } from "@/lib/car-images";

export default async function FichesTechniquesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!isDatabaseConfigured()) {
    return <DatabaseRequiredMessage />;
  }
  const { locale } = await params;
  const sp = await searchParams;
  const initialBrand = typeof sp.brand === "string" ? sp.brand : "";
  const initialModel = typeof sp.model === "string" ? sp.model : "";

  let cars: FichesCar[];
  try {
    const rows = await prisma.car.findMany({
      select: {
        id: true,
        brandFr: true,
        brandAr: true,
        modelFr: true,
        modelAr: true,
        versionFr: true,
        versionAr: true,
        year: true,
        priceNewEst: true,
        fuel: true,
        transmission: true,
        bodyType: true,
        imageUrl: true,
        imageUrls: true,
      },
      orderBy: [{ brandAr: "asc" }, { modelAr: "asc" }, { year: "desc" }],
    });
    cars = rows.map((c) => {
      const imgs = getDisplayCarImageUrls(c);
      return { ...c, imageUrl: imgs[0] ?? null, imageUrls: imgs };
    });
  } catch (e) {
    if (isPrismaDbUnreachableError(e)) {
      return <DatabaseUnreachableMessage />;
    }
    throw e;
  }

  const t = await getTranslations("fiches");

  return (
    <div className="space-y-8 pb-8">
      <PageHeader title={t("title")} description={t("subtitle")} eyebrow={t("eyebrow")} />
      <FichesTechniquesClient
        cars={cars}
        locale={locale === "ar" ? "ar" : "fr"}
        initialBrand={initialBrand}
        initialModel={initialModel}
      />
    </div>
  );
}
