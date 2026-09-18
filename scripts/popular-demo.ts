/**
 * Popula o banco com respostas sintéticas para demonstrar o painel da gestão.
 *
 * Os dados são gerados, não reais. O viés embutido (estresse e sono piores que
 * as demais áreas, equipe de plantão pior que administrativo) existe só para
 * que a tela de demonstração pareça com o que a literatura descreve em
 * trabalho de socioeducação — não é dado de pesquisa e não deve ser citado
 * como se fosse.
 *
 *   npm run demo:popular
 */

import "dotenv/config";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

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
import { PrismaClient } from "../src/generated/prisma/client";

const QUANTIDADE = 140;

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

async function main() {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });

  const regioes = REGIOES.filter((r) => r.slug !== "outra");
  const agora = Date.now();

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

    await prisma.resposta.create({
      data: {
        codigoHash: hashCodigo(gerarCodigo()),
        criadoEm,
        regiao: sorteia(regioes).slug,
        funcao: normalizar(funcao),
        tempoCasa: normalizar(sorteia(TEMPOS_DE_CASA)),
        faixaEtaria: normalizar(sorteia(FAIXAS_ETARIAS)),
        itens: JSON.stringify(itens),
        escores: JSON.stringify(escoresPorDimensao(itens)),
        alertaUrgente: itens[ITEM_RISCO.id] > 0,
      },
    });
  }

  const total = await prisma.resposta.count();
  console.log(`${QUANTIDADE} respostas de demonstração criadas (total: ${total}).`);
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
