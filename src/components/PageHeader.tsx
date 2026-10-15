import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-10 flex flex-col gap-5 border-b border-line pb-10 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 space-y-3">
        {eyebrow && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">{eyebrow}</p>
        )}
        <h1 className="text-balance text-3xl font-semibold tracking-[-0.02em] text-fg sm:text-4xl">{title}</h1>
        {description && <p className="max-w-2xl text-sm leading-relaxed text-fg-muted sm:text-base">{description}</p>}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
