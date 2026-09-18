/**
 * Gera um arquivo SQL com respostas sintéticas para demonstrar o painel da
 * gestão.
 *
 * No D1 não dá para escrever direto de um script Node: o banco é acessado por
 * binding do Worker. Então o script emite SQL e o Wrangler aplica:
 *
 *   npm run demo:gerar                                  # escreve d1/demo.sql
 *   npx wrangler d1 execute por-inteiro --local  --file d1/demo.sql
 *   npx wrangler d1 execute por-inteiro --remote --file d1/demo.sql
 *
 * Os dados são gerados, não reais. O viés embutido (estresse e sono piores que
 * as demais áreas, equipe de plantão pior que administrativo) existe só para
 * que a demonstração pareça com o que a literatura descreve em trabalho de
 * socioeducação — não é dado de pesquisa e não deve ser citado como se fosse.
 */

import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";

import {
  FAIXAS_ETARIAS,
  FUNCOES,
  ITEM_RISCO,
  ITENS,
  TEMPOS_DE_CASA,
  VALOR_MAXIMO,
} from "../src/data/questionario";
import { REGIOES } from "../src/data/regioes";
import { escoresPorDimensao } from "../src/lib/avaliacao";
import { gerarCodigo, hashCodigo } from "../src/lib/codigo";

const QUANTIDADE = 140;
const SAIDA = "d1/demo.sql";

/** Quanto menor, pior tende a ser a área. Base 0..1. */
const TENDENCIA: Record<string, number> = {
  mental: 0.55,
  estresse: 0.38,
  sono: 0.42,
  fisica: 0.5,
  alimentar: 0.45,
  apoio: 0.62,
};

function sorteia<T>(lista: readonly T[]): T {
  return lista[Math.floor(Math.random() * lista.length)];
}

/** Distribui em torno da tendência, para não sair tudo no mesmo valor. */
function valorItem(tendencia: number, positivo: boolean): number {
  const ruido = (Math.random() + Math.random() + Math.random()) / 3 - 0.5;
  const saude = Math.min(1, Math.max(0, tendencia + ruido * 0.8));
  const bruto = positivo ? saude : 1 - saude;
  return Math.round(bruto * VALOR_MAXIMO);
}

/** Mesma regra da API: "Prefiro não informar" equivale a não informar. */
function normalizar(valor: string): string | null {
  return valor.startsWith("Prefiro não informar") ? null : valor;
}

function texto(valor: string | null): string {
  if (valor === null) return "NULL";
  return `'${valor.replace(/'/g, "''")}'`;
}

const regioes = REGIOES.filter((r) => r.slug !== "outra");
const agora = Date.now();
const linhas: string[] = [
  "-- Dados sintéticos de demonstração. Gerados por scripts/popular-demo.ts.",
  "-- NÃO são respostas reais e não devem ser citados como pesquisa.",
];

for (let i = 0; i < QUANTIDADE; i++) {
  const funcao = sorteia(FUNCOES);
  // Quem está no plantão tende a aparecer pior — é o recorte que o painel
  // precisa conseguir mostrar.
  const ajuste = funcao === FUNCOES[0] ? -0.1 : funcao === FUNCOES[5] ? 0.08 : 0;

  const itens: Record<string, number> = {};
  for (const item of ITENS) {
    itens[item.id] = valorItem(TENDENCIA[item.dimensao] + ajuste, item.positivo);
  }
  itens[ITEM_RISCO.id] = Math.random() < 0.07 ? 1 + Math.floor(Math.random() * 2) : 0;

  // Espalha as respostas pelos últimos 10 meses para a série mensal existir.
  const criadoEm = new Date(agora - Math.random() * 300 * 24 * 60 * 60 * 1000);

  const valores = [
    texto(randomUUID()),
    texto(hashCodigo(gerarCodigo())),
    texto(criadoEm.toISOString().replace("T", " ").replace("Z", "")),
    texto(sorteia(regioes).slug),
    texto(normalizar(funcao)),
    texto(normalizar(sorteia(TEMPOS_DE_CASA))),
    texto(normalizar(sorteia(FAIXAS_ETARIAS))),
    texto(JSON.stringify(itens)),
    texto(JSON.stringify(escoresPorDimensao(itens))),
    itens[ITEM_RISCO.id] > 0 ? "1" : "0",
  ];

  linhas.push(
    `INSERT INTO "Resposta" ("id","codigoHash","criadoEm","regiao","funcao","tempoCasa","faixaEtaria","itens","escores","alertaUrgente") VALUES (${valores.join(",")});`,
  );
}

mkdirSync("d1", { recursive: true });
writeFileSync(SAIDA, `${linhas.join("\n")}\n`, "utf8");

console.log(`${QUANTIDADE} respostas de demonstração escritas em ${SAIDA}.`);
console.log("Aplique com:");
console.log(`  npx wrangler d1 execute por-inteiro --local  --file ${SAIDA}`);
console.log(`  npx wrangler d1 execute por-inteiro --remote --file ${SAIDA}`);
