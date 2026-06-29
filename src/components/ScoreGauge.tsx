export function ScoreGauge({ value, suffix = "/100" }: { value: number; suffix?: string | null }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="relative grid h-28 w-28 place-items-center rounded-full p-1 shadow-inner ring-1 ring-zinc-200/80"
        style={{
          background: `conic-gradient(from -90deg, rgb(5 150 105) ${pct}%, rgb(226 232 240) 0)`,
        }}
      >
        <div className="flex h-[calc(100%-10px)] w-[calc(100%-10px)] flex-col items-center justify-center rounded-full bg-white">
          <span className="text-2xl font-bold tabular-nums text-emerald-800">{value}</span>
          {suffix ? (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">{suffix}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
