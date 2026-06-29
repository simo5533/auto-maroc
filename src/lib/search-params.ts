/** Normalise les `searchParams` Next vers `URLSearchParams` pour les filtres catalogue. */
export function toURLSearchParams(
  sp: Record<string, string | string[] | undefined>,
  keys: readonly string[],
): URLSearchParams {
  const u = new URLSearchParams();
  for (const key of keys) {
    const v = sp[key];
    if (typeof v === "string" && v.length) u.set(key, v);
  }
  return u;
}
