import type { ReactNode } from "react";
import { eyebrow as eyebrowClass } from "@/components/ui/styles";

export function SectionHeading({
  eyebrow,
  title,
  action,
  id,
}: {
  eyebrow: string;
  title: string;
  action?: ReactNode;
  id?: string;
}) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <p className={eyebrowClass}>{eyebrow}</p>
        <h2 id={id} className="text-balance mt-3 text-3xl font-semibold leading-[1.05] tracking-[-0.03em] text-fg sm:text-4xl lg:text-[44px]">
          {title}
        </h2>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
