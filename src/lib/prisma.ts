import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { PrismaClient } from "@/generated/prisma/client";

/**
 * Cliente Prisma único por processo.
 *
 * Em desenvolvimento o Next recarrega os módulos a cada alteração; sem o cache
 * no `globalThis` cada recarga abriria uma nova conexão com o SQLite até
 * estourar o limite de descritores de arquivo.
 */

const globalParaPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function criarCliente(): PrismaClient {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  const adapter = new PrismaBetterSqlite3({ url });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalParaPrisma.prisma ?? criarCliente();

if (process.env.NODE_ENV !== "production") {
  globalParaPrisma.prisma = prisma;
}
