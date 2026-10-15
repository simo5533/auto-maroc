"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";

/** Logo de marque ; remplacé par `fallback` (ou masqué) si l'URL ne répond pas. Aucune URL n'est modifiée. */
export function BrandLogo({
  src,
  size,
  className = "",
  fallback = null,
}: {
  src: string | null;
  size: number;
  className?: string;
  fallback?: ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <>{fallback}</>;
  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      unoptimized
      onError={() => setFailed(true)}
      className={`shrink-0 rounded-sm object-contain ${className}`.trim()}
      style={{ width: size, height: size }}
    />
  );
}
