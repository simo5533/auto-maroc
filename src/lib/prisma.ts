import { getDatabaseUrl } from "@/lib/db-ready";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const url = getDatabaseUrl();
  if (!url) {
    throw new Error(
      "DATABASE_URL est obligatoire en production. Ajoutez-la dans .env (voir .env.example).",
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

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
