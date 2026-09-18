import { NextResponse } from "next/server";
import { z } from "zod";

import {
  FAIXAS_ETARIAS,
  FUNCOES,
  ITEM_RISCO,
  ITENS,
  TEMPOS_DE_CASA,
  VALOR_MAXIMO,
} from "@/data/questionario";
import { ehRegiaoValida } from "@/data/regioes";
import { escoresPorDimensao } from "@/lib/avaliacao";
import { gerarCodigo, hashCodigo } from "@/lib/codigo";
import { obterPrisma } from "@/lib/prisma";
import { dentroDoLimite, origemDaRequisicao } from "@/lib/limite-requisicoes";

/** Envios por origem a cada 10 minutos. Uma unidade inteira responde de
 * poucos computadores compartilhados, então a folga é generosa. */
const MAXIMO_ENVIOS = 20;

const valorDoItem = z.number().int().min(0).max(VALOR_MAXIMO);

const Envio = z.object({
  regiao: z.string().refine(ehRegiaoValida, "Região desconhecida."),
  funcao: z.enum(FUNCOES).nullable().optional(),
  tempoCasa: z.enum(TEMPOS_DE_CASA).nullable().optional(),
  faixaEtaria: z.enum(FAIXAS_ETARIAS).nullable().optional(),
  itens: z.record(z.string(), valorDoItem),
});

export async function POST(request: Request) {
  if (!dentroDoLimite(`envio:${origemDaRequisicao(request)}`, MAXIMO_ENVIOS)) {
    return NextResponse.json(
      { erro: "Muitos envios seguidos. Tente de novo em alguns minutos." },
      { status: 429 },
    );
  }

  let corpo: unknown;
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "Envio inválido." }, { status: 400 });
  }

  const validado = Envio.safeParse(corpo);
  if (!validado.success) {
    return NextResponse.json({ erro: "Envio inválido." }, { status: 400 });
  }

  const { regiao, funcao, tempoCasa, faixaEtaria, itens } = validado.data;

  const faltando = ITENS.filter((item) => typeof itens[item.id] !== "number");
  if (faltando.length > 0) {
    return NextResponse.json(
      { erro: "O questionário está incompleto." },
      { status: 400 },
    );
  }

  // Só gravamos os itens que conhecemos: nada de campo extra vindo do cliente
  // parar no banco.
  const itensConhecidos: Record<string, number> = {};
  for (const item of [...ITENS, ITEM_RISCO]) {
    const valor = itens[item.id];
    if (typeof valor === "number") itensConhecidos[item.id] = valor;
  }

  const codigo = gerarCodigo();

  const prisma = await obterPrisma();
  await prisma.resposta.create({
    data: {
      codigoHash: hashCodigo(codigo),
      regiao,
      funcao: normalizar(funcao),
      tempoCasa: normalizar(tempoCasa),
      faixaEtaria: normalizar(faixaEtaria),
      itens: JSON.stringify(itensConhecidos),
      escores: JSON.stringify(escoresPorDimensao(itensConhecidos)),
      alertaUrgente: (itensConhecidos[ITEM_RISCO.id] ?? 0) > 0,
    },
  });

  // O código volta uma única vez, aqui. Ele não é gravado em lugar nenhum.
  return NextResponse.json({ codigo }, { status: 201 });
}

/** "Prefiro não informar" é o mesmo que não informar, e vira nulo. */
function normalizar(valor: string | null | undefined): string | null {
  if (!valor) return null;
  if (valor.startsWith("Prefiro não informar")) return null;
  return valor;
}
