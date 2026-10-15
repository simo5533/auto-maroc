export type EssentialSpec = { key: string; label: string; value: string; unit?: string };

/** « Les essentiels » : grands chiffres, uniquement pour les données présentes. */
export function SpecsGrid({ specs }: { specs: EssentialSpec[] }) {
  if (specs.length === 0) return null;
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[14px] border border-line bg-line sm:grid-cols-3 lg:grid-cols-4">
      {specs.map((s) => (
        <div key={s.key} className="flex flex-col justify-between gap-6 bg-graphite p-5 sm:p-7">
          <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-steel">{s.label}</dt>
          <dd className="text-3xl font-semibold tabular-nums leading-none tracking-[-0.03em] text-fg sm:text-[40px]">
            {s.value}
            {s.unit ? <span className="ms-1.5 text-sm font-medium tracking-normal text-fg-muted">{s.unit}</span> : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}
