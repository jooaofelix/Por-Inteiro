import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Artefatos gerados: tipos do runtime do Workers, cliente do Prisma e o
    // bundle do OpenNext. Nenhum deles é código nosso.
    "cloudflare-env.d.ts",
    "src/generated/**",
    ".open-next/**",
    ".wrangler/**",
  ]),
]);

export default eslintConfig;
