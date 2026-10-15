import type { ReactNode } from "react";
import { Parallax } from "@/components/motion/Parallax";
import { VehicleImage } from "@/components/vehicle/VehicleImage";

/** Rupture éditoriale plein cadre : grande image véhicule + titre en lignes. */
export function EditorialBanner({
  lines,
  body,
  imageUrl,
  imageAlt,
  action,
  compact = false,
}: {
  lines: string[];
  body: string;
  imageUrl: string | null;
  imageAlt: string;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <section
      className={`relative isolate overflow-hidden rounded-[14px] border border-line bg-ink ${
        compact ? "min-h-[420px]" : "min-h-[520px] lg:min-h-[640px]"
      }`}
    >
      <div className="absolute inset-0 -z-10">
        <Parallax range={18} className="absolute -inset-y-6 inset-x-0">
          <div className="relative h-full w-full">
            <VehicleImage src={imageUrl} alt={imageAlt} sizes="100vw" />
          </div>
        </Parallax>
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/75 to-ink/10 rtl:bg-gradient-to-l" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" aria-hidden />
      </div>
      <div className={`flex h-full flex-col justify-end p-6 sm:p-10 lg:p-16 ${compact ? "min-h-[420px]" : "min-h-[520px] lg:min-h-[640px]"}`}>
        <p className="text-[40px] font-semibold leading-[0.98] tracking-[-0.04em] text-fg sm:text-6xl lg:text-7xl">
          {lines.map((l, i) => (
            <span key={l} className={`block ${i === lines.length - 1 ? "text-accent" : ""}`}>
              {l}
            </span>
          ))}
        </p>
        <p className="mt-6 max-w-md text-base leading-relaxed text-fg-muted">{body}</p>
        {action ? <div className="mt-8">{action}</div> : null}
      </div>
    </section>
  );
}
