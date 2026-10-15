/** Squelette reprenant exactement la structure de VehicleCard. */
export function SkeletonVehicle() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[14px] border border-line bg-graphite" aria-hidden>
      <div className="skeleton aspect-[16/10]" />
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="skeleton h-3 w-20 rounded" />
        <div className="skeleton mt-3 h-6 w-2/3 rounded" />
        <div className="skeleton mt-2 h-4 w-1/2 rounded" />
        <div className="mt-5 flex gap-4">
          <div className="skeleton h-4 w-12 rounded" />
          <div className="skeleton h-4 w-20 rounded" />
          <div className="skeleton h-4 w-16 rounded" />
        </div>
        <div className="mt-6 flex items-end justify-between border-t border-line pt-5">
          <div className="space-y-2">
            <div className="skeleton h-3 w-16 rounded" />
            <div className="skeleton h-5 w-28 rounded" />
          </div>
          <div className="skeleton h-4 w-20 rounded" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonVehicleGrid({ count = 6 }: { count?: number }) {
  return (
    <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 xl:gap-6">
      {Array.from({ length: count }, (_, i) => (
        <li key={i}>
          <SkeletonVehicle />
        </li>
      ))}
    </ul>
  );
}
