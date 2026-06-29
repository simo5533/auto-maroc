import { prisma } from "@/lib/prisma";
import { resolveBrandLogoUrl } from "@/lib/brand-assets";

export type HomeBrandStripItem = {
  /** Valeur exacte `brandFr` ou `brandAr` pour `?brand=` / API */
  filterKey: string;
  labelFr: string;
  labelAr: string;
  logoUrl: string | null;
  count: number;
};

/**
 * Marques les plus représentées dans la base (pour la bande d’accueil).
 */
export async function getPopularBrandsForHome(limit = 10): Promise<HomeBrandStripItem[]> {
  try {
    const rows = await prisma.car.findMany({
      select: { brandFr: true, brandAr: true, brandLogoUrl: true },
    });

    const map = new Map<
      string,
      { count: number; brandFr: string | null; brandAr: string; logoUrl: string | null }
    >();

    for (const r of rows) {
      const fr = r.brandFr?.trim() || null;
      const ar = (r.brandAr ?? "").trim();
      const key = fr ?? ar;
      if (!key) continue;

      const cur = map.get(key);
      if (cur) {
        cur.count++;
        if (!cur.logoUrl && r.brandLogoUrl) cur.logoUrl = r.brandLogoUrl;
        if (!cur.brandFr && fr) cur.brandFr = fr;
        if (!cur.brandAr && ar) cur.brandAr = ar;
      } else {
        map.set(key, {
          count: 1,
          brandFr: fr,
          brandAr: ar || key,
          logoUrl: r.brandLogoUrl,
        });
      }
    }

    const sorted = [...map.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, limit);

    return sorted.map(([filterKey, v]) => ({
      filterKey,
      labelFr: v.brandFr ?? v.brandAr,
      labelAr: v.brandAr,
      logoUrl: resolveBrandLogoUrl(v.brandFr, v.logoUrl),
      count: v.count,
    }));
  } catch {
    return [];
  }
}
