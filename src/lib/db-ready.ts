/**
 * PostgreSQL local (docker compose up -d) si DATABASE_URL est absent en développement.
 */
export const DEV_DATABASE_FALLBACK =
  "postgresql://automaroc:automaroc@localhost:5432/automaroc?schema=public";

/** URL effective pour Prisma (variable d’environnement ou secours dev uniquement). */
export function getDatabaseUrl(): string | null {
  const fromEnv = process.env.DATABASE_URL?.trim();
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV !== "production") return DEV_DATABASE_FALLBACK;
  return null;
}

export function isDatabaseConfigured(): boolean {
  return getDatabaseUrl() !== null;
}

// Avant @prisma/client : Turbopack peut charger prisma.ts avec PrismaClient en 1er import ;
// le moteur lit alors env("DATABASE_URL") trop tôt. On aligne process.env dès ce module chargé.
if (typeof process !== "undefined" && process.env) {
  const resolved = getDatabaseUrl();
  if (resolved && !process.env.DATABASE_URL?.trim()) {
    process.env.DATABASE_URL = resolved;
  }
}
