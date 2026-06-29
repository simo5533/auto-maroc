import type { ReactNode } from "react";

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning";
}) {
  const tones = {
    neutral: "bg-zinc-100 text-zinc-700 ring-zinc-200/80",
    success: "bg-emerald-50 text-emerald-800 ring-emerald-200/80",
    warning: "bg-amber-50 text-amber-900 ring-amber-200/80",
  } as const;
  return (
    <span
      className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
