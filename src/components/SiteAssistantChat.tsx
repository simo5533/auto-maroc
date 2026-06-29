"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { btnPrimary } from "@/components/ui/styles";

type ChatMsg = { role: "user" | "assistant"; content: string };

export function SiteAssistantChat({
  locale,
  openAiEnabled,
}: {
  locale: "ar" | "fr";
  openAiEnabled: boolean;
}) {
  const t = useTranslations("assistant");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    setError(null);
    const history: ChatMsg[] = [...messages, { role: "user", content: trimmed }];
    setMessages(history);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, messages: history }),
      });
      const data = (await res.json()) as { reply?: string };
      if (!res.ok) {
        setError(t("error"));
        return;
      }
      const reply = typeof data.reply === "string" && data.reply.length > 0 ? data.reply : null;
      if (!reply) {
        setError(t("error"));
        return;
      }
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch {
      setError(t("error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div dir={locale === "ar" ? "rtl" : "ltr"} className="space-y-4">
      {!openAiEnabled ? (
        <p className="rounded-xl border border-sky-200/80 bg-sky-50/90 px-4 py-3 text-sm leading-relaxed text-sky-950">
          {t("offlineBanner")}
        </p>
      ) : null}

      <div className="max-h-96 min-h-[140px] overflow-y-auto rounded-xl border border-zinc-200 bg-zinc-50/90 p-4 text-sm">
        {messages.length === 0 ? <p className="text-zinc-500">{t("hint")}</p> : null}
        <ul className="space-y-3">
          {messages.map((msg, i) => (
            <li key={`${msg.role}-${i}`} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <span
                className={`inline-block max-w-[min(100%,36rem)] whitespace-pre-wrap rounded-2xl px-4 py-2.5 leading-relaxed ${
                  msg.role === "user" ? "bg-emerald-700 text-white" : "bg-white text-zinc-800 ring-1 ring-zinc-200"
                }`}
              >
                {msg.content}
              </span>
            </li>
          ))}
        </ul>
        {loading ? <p className="mt-2 text-sm text-zinc-500">{t("thinking")}</p> : null}
        <div ref={bottomRef} />
      </div>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("placeholder")}
          rows={2}
          disabled={loading}
          className="min-h-[48px] flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 disabled:bg-zinc-100"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
        />
        <button
          type="button"
          onClick={() => void send()}
          disabled={loading || !input.trim()}
          className={`${btnPrimary} shrink-0 disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {t("send")}
        </button>
      </div>
    </div>
  );
}
