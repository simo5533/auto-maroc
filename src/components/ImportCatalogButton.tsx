"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { btnPrimary } from "@/components/ui/styles";

export function ImportCatalogButton() {
  const t = useTranslations("adminImport");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setMsg(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/import/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ source: "morocco-bundle" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(t("error"));
        return;
      }
      setMsg(t("done", { created: String(data.created ?? 0), updated: String(data.updated ?? 0) }));
    } catch {
      setMsg(t("error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button type="button" disabled={loading} className={btnPrimary} onClick={run}>
        {loading ? t("loading") : t("button")}
      </button>
      {msg && <p className="text-sm text-zinc-700">{msg}</p>}
    </div>
  );
}
