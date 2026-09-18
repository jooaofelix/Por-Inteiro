import assert from "node:assert/strict";
import { test } from "node:test";

import { DIMENSOES } from "../src/data/questionario";
import {
  K_MINIMO,
  relatorioParaCsv,
  resumirRespostas,
  type LinhaResposta,
} from "../src/lib/relatorios";

function linha(parcial: Partial<LinhaResposta> & { escore?: number }): LinhaResposta {
  const escore = parcial.escore ?? 50;
  const escores: Record<string, number> = {};
  for (const d of DIMENSOES) escores[d.id] = escore;

  return {
    criadoEm: parcial.criadoEm ?? new Date("2026-03-01T12:00:00Z"),
    regiao: parcial.regiao ?? "campinas",
    funcao: parcial.funcao ?? null,
    tempoCasa: parcial.tempoCasa ?? null,
    faixaEtaria: parcial.faixaEtaria ?? null,
    escores: parcial.escores ?? JSON.stringify(escores),
    alertaUrgente: parcial.alertaUrgente ?? false,
  };
}

function varias(quantidade: number, parcial: Partial<LinhaResposta> & { escore?: number } = {}) {
  return Array.from({ length: quantidade }, () => linha(parcial));
}

test("abaixo do mínimo, o relatório não divulga nada além do total", () => {
  const relatorio = resumirRespostas(varias(K_MINIMO - 1), null);

  assert.equal(relatorio.suprimido, true);
  assert.equal(relatorio.total, K_MINIMO - 1);
  assert.equal(relatorio.mediaGeral, 0);
  assert.deepEqual(relatorio.dimensoes, []);
  assert.deepEqual(relatorio.porRegiao, []);
  assert.deepEqual(relatorio.porFuncao, []);
  assert.equal(relatorio.alertasUrgentes, 0);
});

test("exatamente no mínimo, o relatório abre", () => {
  const relatorio = resumirRespostas(varias(K_MINIMO), null);

  assert.equal(relatorio.suprimido, false);
  assert.equal(relatorio.total, K_MINIMO);
  assert.equal(relatorio.dimensoes.length, DIMENSOES.length);
});

test("um recorte pequeno é suprimido mesmo quando o total é grande", () => {
  // O caso perigoso de verdade: 40 respostas no geral, mas só duas de uma
  // função específica. Sem supressão, "média da equipe técnica" seria a média
  // de duas pessoas identificáveis dentro da unidade.
  const relatorio = resumirRespostas(
    [
      ...varias(40, { funcao: "Agente de apoio socioeducativo", escore: 60 }),
      ...varias(2, { funcao: "Equipe técnica (psicologia, serviço social, pedagogia)", escore: 10 }),
    ],
    null,
  );

  assert.equal(relatorio.suprimido, false);

  const grande = relatorio.porFuncao.find((r) => r.rotulo.startsWith("Agente"));
  const pequeno = relatorio.porFuncao.find((r) => r.rotulo.startsWith("Equipe técnica"));

  assert.equal(grande?.suprimido, false);
  assert.equal(grande?.mediaGeral, 60);

  assert.equal(pequeno?.suprimido, true);
  assert.equal(pequeno?.mediaGeral, null, "a média do grupo pequeno não pode vazar");
  assert.equal(pequeno?.n, 2, "a contagem fica no objeto, mas a tela e o CSV escondem");
});

test("o CSV esconde a contagem exata dos grupos suprimidos", () => {
  const csv = relatorioParaCsv(
    resumirRespostas(
      [
        ...varias(40, { regiao: "campinas", escore: 60 }),
        ...varias(2, { regiao: "sorocaba", escore: 10 }),
      ],
      null,
    ),
  );

  const linhaSorocaba = csv
    .split("\n")
    .find((l) => l.includes("Sorocaba"));

  assert.ok(linhaSorocaba, "a região precisa aparecer na exportação");
  assert.ok(linhaSorocaba.includes(`<${K_MINIMO}`), "a contagem exata não pode sair");
  assert.ok(!linhaSorocaba.includes(",2,"), "n=2 não pode aparecer");
  assert.ok(linhaSorocaba.includes("suprimido"));
});

test("o CSV não contém uma linha por resposta", () => {
  const csv = relatorioParaCsv(resumirRespostas(varias(30), null));
  const linhas = csv.split("\n").length - 1; // menos o cabeçalho

  assert.ok(
    linhas < 30,
    `a exportação é agregada; saíram ${linhas} linhas para 30 respostas`,
  );
});

test("as médias por dimensão e a distribuição por nível batem", () => {
  const relatorio = resumirRespostas(
    [...varias(10, { escore: 80 }), ...varias(10, { escore: 20 })],
    null,
  );

  assert.equal(relatorio.mediaGeral, 50);
  for (const dimensao of relatorio.dimensoes) {
    assert.equal(dimensao.media, 50);
    assert.equal(dimensao.distribuicao.bom, 10);
    assert.equal(dimensao.distribuicao.prioridade, 10);
    assert.equal(dimensao.distribuicao.atencao, 0);
  }
});

test("os alertas de risco são contados, nunca atribuídos", () => {
  const relatorio = resumirRespostas(
    [...varias(10), ...varias(3, { alertaUrgente: true })],
    null,
  );

  assert.equal(relatorio.alertasUrgentes, 3);
  // Nada no relatório permite chegar a uma resposta específica.
  assert.equal("respostas" in relatorio, false);
});

test("respostas sem função caem em 'Não informado' em vez de sumirem", () => {
  const relatorio = resumirRespostas(varias(10, { funcao: null }), null);
  const grupo = relatorio.porFuncao.find((r) => r.rotulo === "Não informado");

  assert.equal(grupo?.n, 10);
});

test("uma linha de escores corrompida não derruba o relatório inteiro", () => {
  const relatorio = resumirRespostas(
    [...varias(10, { escore: 60 }), linha({ escores: "{isso não é json" })],
    null,
  );

  assert.equal(relatorio.total, 11);
  assert.equal(relatorio.suprimido, false);
});

test("a série mensal agrupa por mês em ordem cronológica", () => {
  const relatorio = resumirRespostas(
    [
      ...varias(5, { criadoEm: new Date("2026-01-15T00:00:00Z") }),
      ...varias(5, { criadoEm: new Date("2026-03-10T00:00:00Z") }),
      ...varias(5, { criadoEm: new Date("2026-02-20T00:00:00Z") }),
    ],
    null,
  );

  assert.deepEqual(
    relatorio.serieMensal.map((m) => m.mes),
    ["2026-01", "2026-02", "2026-03"],
  );
  assert.deepEqual(relatorio.serieMensal.map((m) => m.n), [5, 5, 5]);
});

test("o CSV escapa vírgulas e aspas do rótulo", () => {
  const csv = relatorioParaCsv(
    resumirRespostas(varias(10, { regiao: "ribeirao-preto" }), null),
  );

  assert.ok(csv.includes('"Ribeirão Preto, Franca e Araraquara"'));
});
