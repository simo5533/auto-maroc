import type { ReactNode } from "react";

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning";
}) {
  const tones = {
    neutral: "bg-white/[0.04] text-fg-muted ring-line-strong",
    success: "bg-accent/10 text-accent ring-accent/30",
    warning: "bg-amber-100 text-amber-800 ring-amber-300/60",
  } as const;
  return (
    <span
      className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
