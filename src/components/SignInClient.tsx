"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { btnPrimary, inputBase } from "@/components/ui/styles";

export function SignInClient() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (mode === "register") {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name: name || undefined }),
      });
      if (!res.ok) {
        setMsg("E-mail déjà utilisé ou formulaire invalide.");
        return;
      }
      setMode("login");
      setMsg("Compte créé — connectez-vous.");
      return;
    }
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      setMsg("Identifiants incorrects.");
      return;
    }
    router.push("/account");
    router.refresh();
  }

  const lab = "block text-sm font-medium text-zinc-700";

  return (
    <Card className="mx-auto max-w-md" padding="p-6 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">{t("eyebrow")}</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">{t("title")}</h1>
      <div className="mt-6 inline-flex rounded-xl bg-zinc-100 p-1 ring-1 ring-zinc-200/80">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
            mode === "login" ? "bg-white text-emerald-900 shadow-sm" : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          {t("loginTab")}
        </button>
        <button
          type="button"
          onClick={() => setMode("register")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
            mode === "register" ? "bg-white text-emerald-900 shadow-sm" : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          {t("registerTab")}
        </button>
      </div>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        {mode === "register" && (
          <label className={lab}>
            {t("nameOptional")}
            <input value={name} onChange={(e) => setName(e.target.value)} className={`mt-1.5 ${inputBase}`} />
          </label>
        )}
        <label className={lab}>
          {t("email")}
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`mt-1.5 ${inputBase}`} required />
        </label>
        <label className={lab}>
          {t("password")}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`mt-1.5 ${inputBase}`}
            required
            minLength={6}
          />
        </label>
        <button type="submit" className={`${btnPrimary} w-full`}>
          {mode === "login" ? t("submit") : t("submitRegister")}
        </button>
        {mode === "register" ? (
          <p className="rounded-xl bg-emerald-50 p-3 text-center text-sm leading-relaxed text-emerald-900 ring-1 ring-emerald-100">
            {t("registerBenefit")}
          </p>
        ) : null}
        <p className="text-center text-xs text-zinc-500">{t("registerHint")}</p>
        {msg && <p className="rounded-xl bg-zinc-50 p-3 text-center text-sm text-zinc-800 ring-1 ring-zinc-200">{msg}</p>}
      </form>
    </Card>
  );
}
