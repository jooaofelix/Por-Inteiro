import assert from "node:assert/strict";
import { test } from "node:test";

import {
  DIMENSOES,
  ITEM_RISCO,
  ITENS,
  VALOR_MAXIMO,
} from "../src/data/questionario";
import {
  calcularResultado,
  escoresPorDimensao,
  nivelDoEscore,
  questionarioCompleto,
} from "../src/lib/avaliacao";

/** Respostas no melhor cenário possível, respeitando a direção de cada item. */
function melhorCaso(): Record<string, number> {
  const respostas: Record<string, number> = {};
  for (const item of ITENS) respostas[item.id] = item.positivo ? VALOR_MAXIMO : 0;
  return respostas;
}

function piorCaso(): Record<string, number> {
  const respostas: Record<string, number> = {};
  for (const item of ITENS) respostas[item.id] = item.positivo ? 0 : VALOR_MAXIMO;
  return respostas;
}

test("o melhor cenário pontua 100 em todas as dimensões", () => {
  const resultado = calcularResultado(melhorCaso());

  assert.equal(resultado.escoreGeral, 100);
  assert.equal(resultado.nivelGeral, "bom");
  for (const dimensao of resultado.dimensoes) {
    assert.equal(dimensao.escore, 100, dimensao.dimensao.nome);
    assert.equal(dimensao.nivel, "bom");
  }
  assert.deepEqual(resultado.prioridades, []);
});

test("o pior cenário pontua 0 em todas as dimensões", () => {
  const resultado = calcularResultado(piorCaso());

  assert.equal(resultado.escoreGeral, 0);
  assert.equal(resultado.nivelGeral, "prioridade");
  assert.equal(resultado.prioridades.length, DIMENSOES.length);
  for (const dimensao of resultado.dimensoes) {
    assert.equal(dimensao.escore, 0, dimensao.dimensao.nome);
  }
});

test("itens negativos são invertidos: responder tudo 4 não é o melhor resultado", () => {
  // Se a inversão falhasse, marcar "Sempre" em tudo (inclusive em "termino o
  // plantão esgotado") daria 100 — este teste é o que trava esse erro.
  const tudoQuatro: Record<string, number> = {};
  for (const item of ITENS) tudoQuatro[item.id] = VALOR_MAXIMO;

  const resultado = calcularResultado(tudoQuatro);
  assert.ok(
    resultado.escoreGeral < 100,
    `esperava menos de 100, veio ${resultado.escoreGeral}`,
  );

  const temItemNegativo = DIMENSOES.some((d) =>
    ITENS.some((i) => i.dimensao === d.id && !i.positivo),
  );
  assert.ok(temItemNegativo, "o questionário precisa ter itens invertidos");
});

test("o item de risco não entra em nenhuma pontuação", () => {
  const base = melhorCaso();
  const comRisco = { ...base, [ITEM_RISCO.id]: VALOR_MAXIMO };

  assert.deepEqual(escoresPorDimensao(comRisco), escoresPorDimensao(base));
  assert.equal(calcularResultado(comRisco).escoreGeral, 100);
});

test("o item de risco liga o alerta a partir de qualquer valor acima de zero", () => {
  const base = melhorCaso();

  assert.equal(calcularResultado(base).alertaUrgente, false);
  assert.equal(calcularResultado({ ...base, [ITEM_RISCO.id]: 0 }).alertaUrgente, false);
  assert.equal(calcularResultado({ ...base, [ITEM_RISCO.id]: 1 }).alertaUrgente, true);
  assert.equal(calcularResultado({ ...base, [ITEM_RISCO.id]: 4 }).alertaUrgente, true);
});

test("as prioridades saem ordenadas da dimensão pior para a menos grave", () => {
  const resultado = calcularResultado(piorCaso());
  const escores = resultado.prioridades.map((p) => p.escore);
  assert.deepEqual(escores, [...escores].sort((a, b) => a - b));
});

test("os pontos de atenção nomeiam itens de verdade, no máximo três", () => {
  const resultado = calcularResultado(piorCaso());
  const enunciados = new Set(ITENS.map((i) => i.enunciado));

  for (const dimensao of resultado.dimensoes) {
    assert.ok(dimensao.pontosDeAtencao.length <= 3);
    for (const ponto of dimensao.pontosDeAtencao) {
      assert.ok(enunciados.has(ponto), `ponto desconhecido: ${ponto}`);
    }
  }
});

test("as faixas de nível cobrem a escala inteira sem buraco", () => {
  assert.equal(nivelDoEscore(100), "bom");
  assert.equal(nivelDoEscore(70), "bom");
  assert.equal(nivelDoEscore(69), "atencao");
  assert.equal(nivelDoEscore(45), "atencao");
  assert.equal(nivelDoEscore(44), "prioridade");
  assert.equal(nivelDoEscore(0), "prioridade");
});

test("o questionário só é considerado completo com todos os itens pontuáveis", () => {
  const completo = melhorCaso();
  assert.equal(questionarioCompleto(completo), true);

  const incompleto = { ...completo };
  delete incompleto[ITENS[0].id];
  assert.equal(questionarioCompleto(incompleto), false);

  // O item de risco é opcional e não pode bloquear o envio.
  assert.equal(questionarioCompleto({ ...completo, [ITEM_RISCO.id]: 0 }), true);
});

test("toda dimensão tem recomendação escrita para os três níveis", () => {
  for (const respostas of [melhorCaso(), piorCaso()]) {
    for (const dimensao of calcularResultado(respostas).dimensoes) {
      assert.ok(
        dimensao.recomendacoes.length > 0,
        `${dimensao.dimensao.nome} sem recomendação no nível ${dimensao.nivel}`,
      );
    }
  }
});

test("dimensão em nível bom não gera encaminhamento, em prioridade gera", () => {
  for (const dimensao of calcularResultado(melhorCaso()).dimensoes) {
    assert.deepEqual(dimensao.encaminhamentos, []);
  }
  for (const dimensao of calcularResultado(piorCaso()).dimensoes) {
    assert.ok(dimensao.encaminhamentos.length > 0, dimensao.dimensao.nome);
  }
});
