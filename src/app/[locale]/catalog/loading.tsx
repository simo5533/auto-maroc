import { container } from "@/components/ui/styles";
import { SkeletonVehicleGrid } from "@/components/vehicle/SkeletonVehicle";

export default function CatalogLoading() {
  return (
    <div className="pb-24">
      <div className={`${container} pb-10 pt-12 sm:pt-16`}>
        <div className="skeleton h-3 w-24 rounded" />
        <div className="skeleton mt-4 h-12 w-72 max-w-full rounded" />
      </div>
      <div className="h-[70px] border-y border-line bg-graphite/60" />
      <div className={`${container} pt-8`}>
        <SkeletonVehicleGrid count={6} />
      </div>
    </div>
  );
}
