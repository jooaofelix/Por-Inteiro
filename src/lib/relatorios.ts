import { DIMENSOES, type DimensaoId } from "@/data/questionario";
import { buscarRegiao } from "@/data/regioes";
import { nivelDoEscore, type Nivel } from "@/lib/avaliacao";
import { prisma } from "@/lib/prisma";

/**
 * Agregação para o painel da gestão.
 *
 * REGRA DE OURO: o painel nunca mostra uma resposta individual, e nunca mostra
 * um recorte pequeno o bastante para alguém ser deduzido. Numa unidade com
 * poucos enfermeiros, "média da equipe de saúde da região X" com n=2 é o
 * mesmo que abrir a resposta de duas pessoas. Por isso todo recorte com menos
 * de `K_MINIMO` respostas volta suprimido, com a contagem escondida.
 *
 * Aumentar `K_MINIMO` deixa o relatório mais pobre e mais seguro; diminuir faz
 * o contrário. Não vá abaixo de 5 sem conversar com quem responde pela
 * privacidade do projeto.
 */
export const K_MINIMO = 5;

export type Recorte = {
  rotulo: string;
  n: number;
  /** `null` quando o grupo é pequeno demais para ser divulgado. */
  mediaGeral: number | null;
  suprimido: boolean;
};

export type MediaDimensao = {
  id: DimensaoId;
  nome: string;
  icone: string;
  media: number;
  nivel: Nivel;
  distribuicao: Record<Nivel, number>;
};

export type Relatorio = {
  total: number;
  /** Abaixo do k-anônimo global, nada além do total é divulgado. */
  suprimido: boolean;
  periodoDias: number | null;
  primeiraResposta: Date | null;
  ultimaResposta: Date | null;
  mediaGeral: number;
  dimensoes: MediaDimensao[];
  porRegiao: Recorte[];
  porFuncao: Recorte[];
  porTempoCasa: Recorte[];
  porFaixaEtaria: Recorte[];
  alertasUrgentes: number;
  serieMensal: { mes: string; n: number; media: number }[];
};

/** Uma resposta como ela sai do banco, sem nada que identifique alguém. */
export type LinhaResposta = {
  criadoEm: Date;
  regiao: string;
  funcao: string | null;
  tempoCasa: string | null;
  faixaEtaria: string | null;
  escores: string;
  alertaUrgente: boolean;
};

type RespostaAnalisada = LinhaResposta & {
  escoresLidos: Record<string, number>;
  mediaGeral: number;
};

export async function gerarRelatorio(periodoDias: number | null): Promise<Relatorio> {
  const desde =
    periodoDias === null
      ? undefined
      : new Date(Date.now() - periodoDias * 24 * 60 * 60 * 1000);

  const linhas: LinhaResposta[] = await prisma.resposta.findMany({
    where: desde ? { criadoEm: { gte: desde } } : undefined,
    select: {
      criadoEm: true,
      regiao: true,
      funcao: true,
      tempoCasa: true,
      faixaEtaria: true,
      escores: true,
      alertaUrgente: true,
    },
    orderBy: { criadoEm: "asc" },
  });

  return resumirRespostas(linhas, periodoDias);
}

/**
 * O coração do relatório, separado do acesso ao banco.
 *
 * É aqui que mora a supressão por k-anonimato, então é aqui que os testes
 * precisam conseguir chegar — sem subir banco, com grupos montados à mão.
 */
export function resumirRespostas(
  linhas: LinhaResposta[],
  periodoDias: number | null,
): Relatorio {
  const respostas = linhas.map(analisar);
  const total = respostas.length;

  const vazio: Relatorio = {
    total,
    suprimido: total < K_MINIMO,
    periodoDias,
    primeiraResposta: respostas.at(0)?.criadoEm ?? null,
    ultimaResposta: respostas.at(-1)?.criadoEm ?? null,
    mediaGeral: 0,
    dimensoes: [],
    porRegiao: [],
    porFuncao: [],
    porTempoCasa: [],
    porFaixaEtaria: [],
    alertasUrgentes: 0,
    serieMensal: [],
  };

  if (total < K_MINIMO) return vazio;

  return {
    ...vazio,
    suprimido: false,
    mediaGeral: media(respostas.map((r) => r.mediaGeral)),
    dimensoes: DIMENSOES.map((d) => resumirDimensao(d.id, d.nome, d.icone, respostas)),
    porRegiao: agrupar(respostas, (r) => buscarRegiao(r.regiao)?.nome ?? r.regiao),
    porFuncao: agrupar(respostas, (r) => r.funcao),
    porTempoCasa: agrupar(respostas, (r) => r.tempoCasa),
    porFaixaEtaria: agrupar(respostas, (r) => r.faixaEtaria),
    alertasUrgentes: respostas.filter((r) => r.alertaUrgente).length,
    serieMensal: porMes(respostas),
  };
}

function analisar(linha: LinhaResposta): RespostaAnalisada {
  const escoresLidos = lerEscores(linha.escores);
  const valores = DIMENSOES.map((d) => escoresLidos[d.id] ?? 0);

  return { ...linha, escoresLidos, mediaGeral: media(valores) };
}

function lerEscores(bruto: string): Record<string, number> {
  try {
    const lido: unknown = JSON.parse(bruto);
    if (lido && typeof lido === "object") return lido as Record<string, number>;
  } catch {
    // Linha corrompida não pode derrubar o relatório inteiro; ela entra como
    // zerada e a diferença aparece na contagem.
  }
  return {};
}

function resumirDimensao(
  id: DimensaoId,
  nome: string,
  icone: string,
  respostas: RespostaAnalisada[],
): MediaDimensao {
  const escores = respostas.map((r) => r.escoresLidos[id] ?? 0);
  const distribuicao: Record<Nivel, number> = { bom: 0, atencao: 0, prioridade: 0 };
  for (const escore of escores) distribuicao[nivelDoEscore(escore)] += 1;

  const valorMedio = media(escores);

  return { id, nome, icone, media: valorMedio, nivel: nivelDoEscore(valorMedio), distribuicao };
}

function agrupar(
  respostas: RespostaAnalisada[],
  chave: (r: RespostaAnalisada) => string | null,
): Recorte[] {
  const grupos = new Map<string, number[]>();

  for (const resposta of respostas) {
    const rotulo = chave(resposta) ?? "Não informado";
    const atual = grupos.get(rotulo) ?? [];
    atual.push(resposta.mediaGeral);
    grupos.set(rotulo, atual);
  }

  return [...grupos.entries()]
    .map(([rotulo, valores]) => {
      const suprimido = valores.length < K_MINIMO;
      return {
        rotulo,
        n: valores.length,
        mediaGeral: suprimido ? null : media(valores),
        suprimido,
      };
    })
    .sort((a, b) => b.n - a.n);
}

function porMes(respostas: RespostaAnalisada[]): { mes: string; n: number; media: number }[] {
  const grupos = new Map<string, number[]>();

  for (const resposta of respostas) {
    const mes = resposta.criadoEm.toISOString().slice(0, 7);
    const atual = grupos.get(mes) ?? [];
    atual.push(resposta.mediaGeral);
    grupos.set(mes, atual);
  }

  return [...grupos.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, valores]) => ({ mes, n: valores.length, media: media(valores) }));
}

function media(valores: number[]): number {
  if (valores.length === 0) return 0;
  return Math.round(valores.reduce((s, v) => s + v, 0) / valores.length);
}

/**
 * CSV do relatório. Exporta apenas agregados: não há linha por pessoa no
 * arquivo, pelo mesmo motivo que não há na tela. Recortes suprimidos saem com
 * a média em branco.
 */
export function relatorioParaCsv(relatorio: Relatorio): string {
  const linhas: string[][] = [["secao", "item", "n", "media_0_100", "observacao"]];

  linhas.push(["geral", "todas as respostas", String(relatorio.total), String(relatorio.mediaGeral), ""]);
  linhas.push([
    "geral",
    "sinalizacoes de risco",
    String(relatorio.alertasUrgentes),
    "",
    "item de triagem respondido acima de 'Nunca'",
  ]);

  for (const d of relatorio.dimensoes) {
    linhas.push([
      "dimensao",
      d.nome,
      String(relatorio.total),
      String(d.media),
      `indo bem: ${d.distribuicao.bom} | atencao: ${d.distribuicao.atencao} | prioridade: ${d.distribuicao.prioridade}`,
    ]);
  }

  const recortes: [string, Recorte[]][] = [
    ["regiao", relatorio.porRegiao],
    ["funcao", relatorio.porFuncao],
    ["tempo_de_casa", relatorio.porTempoCasa],
    ["faixa_etaria", relatorio.porFaixaEtaria],
  ];

  for (const [secao, itens] of recortes) {
    for (const item of itens) {
      linhas.push([
        secao,
        item.rotulo,
        item.suprimido ? `<${K_MINIMO}` : String(item.n),
        item.mediaGeral === null ? "" : String(item.mediaGeral),
        item.suprimido ? `grupo com menos de ${K_MINIMO} respostas, suprimido` : "",
      ]);
    }
  }

  for (const mes of relatorio.serieMensal) {
    linhas.push(["mes", mes.mes, String(mes.n), String(mes.media), ""]);
  }

  return linhas.map((linha) => linha.map(escaparCsv).join(",")).join("\n");
}

function escaparCsv(valor: string): string {
  if (/[",\n]/.test(valor)) return `"${valor.replace(/"/g, '""')}"`;
  return valor;
}
