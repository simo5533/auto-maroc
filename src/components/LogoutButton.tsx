"use client";

import { useRouter } from "@/i18n/navigation";
import { btnSecondary } from "@/components/ui/styles";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className={btnSecondary}
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/");
        router.refresh();
      }}
    >
      Déconnexion
    </button>
  );
}
