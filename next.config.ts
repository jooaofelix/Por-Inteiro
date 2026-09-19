import type { NextConfig } from "next";

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  /**
   * O rastreamento de dependências do Next arrasta o CLI do Prisma para dentro
   * do pacote do servidor, e com ele ~35 MB de WebAssembly que a aplicação
   * nunca executa: o PGlite (um Postgres inteiro em Wasm), o motor de migração
   * e os compiladores de consulta de MySQL, PostgreSQL, SQL Server e
   * CockroachDB. O Worker usa só o compilador de SQLite, que vem pelo cliente
   * gerado em src/generated/prisma.
   *
   * Sem esta exclusão o bundle passa de 18 MB comprimidos e o deploy é
   * recusado — o limite do Worker é de 3 MB no plano gratuito e 10 MB no pago.
   *
   * Tudo aqui é ferramenta de linha de comando, usada só para escrever
   * migrações em desenvolvimento.
   */
  outputFileTracingExcludes: {
    "*": [
      "node_modules/prisma/**",
      "node_modules/@prisma/dev/**",
      "node_modules/@prisma/studio**/**",
      "node_modules/@electric-sql/pglite/**",
      "node_modules/@electric-sql/pglite-tools/**",
      "node_modules/@esbuild/**",
      "node_modules/typescript/**",
    ],
  },
};

export default nextConfig;

// Faz o `next dev` enxergar os bindings do Cloudflare (o D1 local, entre eles),
// para que o ambiente de desenvolvimento seja o mesmo que o de produção.
initOpenNextCloudflareForDev();
