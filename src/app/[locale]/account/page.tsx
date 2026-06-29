import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db-ready";
import { prisma } from "@/lib/prisma";
import { DatabaseRequiredMessage } from "@/components/DatabaseRequiredMessage";
import { Link } from "@/i18n/navigation";
import { LogoutButton } from "@/components/LogoutButton";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/Card";
import { btnPrimary } from "@/components/ui/styles";

export default async function AccountPage() {
  if (!isDatabaseConfigured()) {
    return <DatabaseRequiredMessage />;
  }

  const t = await getTranslations("account");
  const session = await getSession();
  const user = session
    ? await prisma.user.findUnique({
        where: { id: session.sub },
        select: { email: true, role: true },
      })
    : null;

  return (
    <div>
      <PageHeader title={t("title")} description={t("subtitle")} eyebrow={t("eyebrow")} />
      <Card className="max-w-lg" padding="p-6 sm:p-8">
        {user ? (
          <div className="space-y-4">
            <p className="text-sm text-zinc-600">
              {t("signedIn")}{" "}
              <span className="font-semibold text-zinc-900">{user.email}</span>
            </p>
            <p className="inline-flex rounded-lg bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-600">
              {user.role}
            </p>
            <LogoutButton />
          </div>
        ) : (
          <div className="space-y-4 text-center sm:text-start">
            <p className="text-sm text-zinc-600">{t("guest")}</p>
            <Link href="/auth/sign-in" className={`${btnPrimary} inline-flex`}>
              → Connexion / تسجيل الدخول
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}
