"use client";

import Image from "next/image";
import { useState } from "react";
import { IconCar } from "@/components/ui/icons";

/**
 * Image véhicule : fondu à l'affichage, placeholder Auto Maroc si absente ou en erreur.
 * L'URL source est utilisée telle quelle (aucune transformation).
 */
export function VehicleImage({
  src,
  alt,
  sizes,
  priority = false,
  fit = "cover",
  className = "",
  placeholderLabel,
}: {
  src: string | null;
  alt: string;
  sizes: string;
  priority?: boolean;
  fit?: "cover" | "contain";
  className?: string;
  placeholderLabel?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-steel" role="img" aria-label={alt}>
        <IconCar size={40} strokeWidth={1.1} />
        {placeholderLabel ? <span className="text-[11px] font-medium uppercase tracking-[0.18em]">{placeholderLabel}</span> : null}
      </div>
    );
  }

  return (
    <>
      {!loaded ? <div className="skeleton absolute inset-0" aria-hidden /> : null}
      <Image
        src={src}
        alt={alt}
        fill
        unoptimized
        priority={priority}
        sizes={sizes}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={`${fit === "cover" ? "object-cover" : "object-contain"} transition-opacity duration-500 ${
          loaded ? "opacity-100" : "opacity-0"
        } ${className}`.trim()}
      />
    </>
  );
}
