import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PrismaD1 } from "@prisma/adapter-d1";

import { PrismaClient } from "@/generated/prisma/client";

/**
 * Cliente Prisma sobre o D1 (o SQLite gerenciado do Cloudflare).
 *
 * No Workers não existe conexão de banco para reaproveitar entre requisições:
 * o D1 é acessado por um binding que vem do contexto do ambiente. Por isso o
 * cliente é obtido por função, e não exportado como constante — em tempo de
 * build o binding simplesmente não existe.
 *
 * O cache é por isolate: enquanto o mesmo isolate atende requisições, o
 * binding é o mesmo e o cliente pode ser reaproveitado.
 */

let cliente: PrismaClient | undefined;

export async function obterPrisma(): Promise<PrismaClient> {
  if (cliente) return cliente;

  const { env } = await getCloudflareContext({ async: true });
  cliente = new PrismaClient({ adapter: new PrismaD1(env.DB) });

  return cliente;
}
