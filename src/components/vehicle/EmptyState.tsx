import type { ReactNode } from "react";
import { IconCar } from "@/components/ui/icons";

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-[14px] border border-dashed border-line-strong bg-graphite px-6 py-20 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full border border-line text-steel">
        <IconCar size={26} strokeWidth={1.3} />
      </span>
      <h2 className="mt-6 text-2xl font-semibold tracking-[-0.02em] text-fg">{title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-fg-muted">{body}</p>
      {action ? <div className="mt-8">{action}</div> : null}
    </div>
  );
}
