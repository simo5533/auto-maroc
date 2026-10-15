import type { ReactNode } from "react";

/** Barre d'action fixe en bas d'écran, mobile uniquement. */
export function StickyCTA({ title, info, action }: { title: string; info: ReactNode; action: ReactNode }) {
  return (
    <div className="glass fixed inset-x-0 bottom-0 z-40 border-t border-line-strong pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="flex items-center justify-between gap-4 px-5 py-3">
        <div className="min-w-0">
          <p className="truncate text-xs text-fg-muted">{title}</p>
          {info}
        </div>
        <div className="shrink-0">{action}</div>
      </div>
    </div>
  );
}
