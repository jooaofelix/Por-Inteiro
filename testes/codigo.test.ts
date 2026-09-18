import assert from "node:assert/strict";
import { test } from "node:test";

import { codigosIguais, gerarCodigo, hashCodigo, normalizarCodigo } from "../src/lib/codigo";

test("o código sai no formato PI-XXXX-XXXX", () => {
  for (let i = 0; i < 50; i++) {
    assert.match(gerarCodigo(), /^PI-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  }
});

test("o código não usa caracteres que se confundem ao anotar no papel", () => {
  // O, I, L, S, 0, 1 e 5 ficam de fora justamente por isso.
  const proibidos = /[OILS015]/;
  for (let i = 0; i < 200; i++) {
    const corpo = gerarCodigo().slice(3);
    assert.doesNotMatch(corpo, proibidos, `código com caractere ambíguo: ${corpo}`);
  }
});

test("códigos gerados não se repetem em sequência", () => {
  const gerados = new Set(Array.from({ length: 500 }, gerarCodigo));
  assert.equal(gerados.size, 500);
});

test("a normalização aceita o código como a pessoa digitar", () => {
  const esperado = "PI-A2C4-K7M9";

  assert.equal(normalizarCodigo("PI-A2C4-K7M9"), esperado);
  assert.equal(normalizarCodigo("pi-a2c4-k7m9"), esperado);
  assert.equal(normalizarCodigo("PIA2C4K7M9"), esperado);
  assert.equal(normalizarCodigo("  pi a2c4 k7m9  "), esperado);
  assert.equal(normalizarCodigo("PI_A2C4_K7M9"), esperado);
});

test("a normalização rejeita o que não é código", () => {
  for (const entrada of ["", "PI", "PI-A2C4", "PI-A2C4-K7M9-EXTRA", "XX-A2C4-K7M9", "1234567890"]) {
    assert.equal(normalizarCodigo(entrada), "", `deveria rejeitar: ${entrada}`);
  }
});

test("o hash é estável para o mesmo código e diferente entre códigos", () => {
  assert.equal(hashCodigo("PI-A2C4-K7M9"), hashCodigo("PI-A2C4-K7M9"));
  assert.notEqual(hashCodigo("PI-A2C4-K7M9"), hashCodigo("PI-A2C4-K7M8"));
  assert.match(hashCodigo("PI-A2C4-K7M9"), /^[0-9a-f]{64}$/);
});

test("o hash depende do pepper: sem o segredo do servidor ele não se reproduz", () => {
  const anterior = process.env.CODIGO_PEPPER;

  process.env.CODIGO_PEPPER = "um";
  const comUm = hashCodigo("PI-A2C4-K7M9");
  process.env.CODIGO_PEPPER = "outro";
  const comOutro = hashCodigo("PI-A2C4-K7M9");

  assert.notEqual(comUm, comOutro);

  // Reflect.deleteProperty em vez de `delete`: os tipos gerados pelo Wrangler
  // declaram as variáveis de ambiente como obrigatórias.
  if (anterior === undefined) Reflect.deleteProperty(process.env, "CODIGO_PEPPER");
  else process.env.CODIGO_PEPPER = anterior;
});

test("a comparação em tempo constante continua correta", () => {
  assert.equal(codigosIguais("abc", "abc"), true);
  assert.equal(codigosIguais("abc", "abd"), false);
  assert.equal(codigosIguais("abc", "abcd"), false);
  assert.equal(codigosIguais("", ""), true);
});
