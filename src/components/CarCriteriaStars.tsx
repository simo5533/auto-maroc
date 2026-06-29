import type { CarCriterionId, CarCriterionRating } from "@/lib/car-criteria-ratings";

type Row = CarCriterionRating & { label: string };

const STAR = "★";
const STAR_EMPTY = "☆";

function Stars({ filled, total = 5 }: { filled: number; total?: number }) {
  const n = Math.min(total, Math.max(0, Math.round(filled)));
  return (
    <span className="inline-flex gap-px text-amber-500" dir="ltr" aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className="text-base leading-none">
          {i < n ? STAR : STAR_EMPTY}
        </span>
      ))}
    </span>
  );
}

export function CarCriteriaStars({
  rows,
  hint,
  title,
}: {
  rows: Row[];
  hint?: string;
  title: string;
}) {
  return (
    <div className="text-left">
      <h3 className="text-sm font-bold text-zinc-900">{title}</h3>
      {hint ? <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{hint}</p> : null}
      <ul className="mt-4 space-y-3">
        {rows.map((row) => (
          <li
            key={row.id as CarCriterionId}
            className="rounded-xl border border-zinc-100 bg-zinc-50/90 px-3 py-2.5 ring-1 ring-zinc-100/80"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-zinc-800">{row.label}</span>
              <span className="shrink-0 tabular-nums text-xs font-bold text-emerald-800">
                {row.percentage}%
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <Stars filled={row.stars} />
              <span className="text-xs font-semibold tabular-nums text-zinc-600">
                {row.stars}/5
              </span>
            </div>
            <div
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-200/90"
              role="presentation"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-[width]"
                style={{ width: `${row.percentage}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
