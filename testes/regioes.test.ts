import assert from "node:assert/strict";
import { test } from "node:test";

import { REGIOES, buscarRegiao, ehRegiaoValida, regiaoPorCep } from "../src/data/regioes";

test("o CEP vira região pelos dois primeiros dígitos", () => {
  assert.equal(regiaoPorCep("01310-100")?.slug, "sp-capital");
  assert.equal(regiaoPorCep("09015-000")?.slug, "abc");
  assert.equal(regiaoPorCep("13015-000")?.slug, "campinas");
  assert.equal(regiaoPorCep("11013-000")?.slug, "baixada-santista");
  assert.equal(regiaoPorCep("19010-000")?.slug, "presidente-prudente");
});

test("o CEP é aceito com ou sem máscara", () => {
  assert.equal(regiaoPorCep("13015000")?.slug, "campinas");
  assert.equal(regiaoPorCep("13015-000")?.slug, "campinas");
  assert.equal(regiaoPorCep("13.015-000")?.slug, "campinas");
});

test("CEP incompleto ou de fora do estado não arrisca um palpite", () => {
  assert.equal(regiaoPorCep(""), null);
  assert.equal(regiaoPorCep("130"), null);
  assert.equal(regiaoPorCep("20000-000"), null, "Rio de Janeiro");
  assert.equal(regiaoPorCep("70000-000"), null, "Brasília");
});

test("nenhum prefixo de CEP responde por duas regiões", () => {
  const vistos = new Map<string, string>();
  for (const regiao of REGIOES) {
    for (const prefixo of regiao.prefixosCep) {
      const jaVisto = vistos.get(prefixo);
      assert.equal(jaVisto, undefined, `prefixo ${prefixo} em ${jaVisto} e ${regiao.slug}`);
      vistos.set(prefixo, regiao.slug);
    }
  }
});

test("os slugs são únicos e a busca por slug funciona", () => {
  const slugs = REGIOES.map((r) => r.slug);
  assert.equal(new Set(slugs).size, slugs.length);

  for (const slug of slugs) {
    assert.equal(ehRegiaoValida(slug), true);
    assert.equal(buscarRegiao(slug)?.slug, slug);
  }

  assert.equal(ehRegiaoValida("marte"), false);
  assert.equal(buscarRegiao(null), undefined);
});
