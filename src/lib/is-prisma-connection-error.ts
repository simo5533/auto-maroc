/**
 * Erreur Prisma : base injoignable (PostgreSQL arrêté, URL postgresql:// invalide,
 * ou SQLite : fichier prisma/dev.db absent, verrouillé ou sans droit d’écriture).
 */
export function isPrismaDbUnreachableError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const o = error as Record<string, unknown>;
  const code =
    typeof o.errorCode === "string"
      ? o.errorCode
      : typeof o.code === "string"
        ? o.code
        : "";
  if (code === "P1001" || code === "P1003" || code === "P1017" || code === "P2021" || code === "P1000") return true;
  const msg = typeof o.message === "string" ? o.message : "";
  return (
    /Can't reach database server|P1001|ECONNREFUSED|connect ECONNREFUSED/i.test(msg) ||
    /does not exist in the current database|P2021/i.test(msg) ||
    /unable to open database|SQLite error code \d+|database is locked/i.test(msg)
  );
}
