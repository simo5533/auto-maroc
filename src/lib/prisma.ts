import { getDatabaseUrl } from "@/lib/db-ready";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient(): PrismaClient {
  const url = getDatabaseUrl();
  if (!url) {
    throw new Error(
      "DATABASE_URL est obligatoire en production. Ajoutez-la dans Vercel (Settings → Environment Variables).",
    );
  }
  if (!process.env.DATABASE_URL?.trim()) {
    process.env.DATABASE_URL = url;
  }
  return new PrismaClient({
    datasources: { db: { url } },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  const client = createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }
  return client;
}

/** Client Prisma chargé à la demande (évite un crash au démarrage si DATABASE_URL manque). */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, receiver) as unknown;
    return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(client) : value;
  },
});
