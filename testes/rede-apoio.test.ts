import assert from "node:assert/strict";
import { test } from "node:test";

import { servicosPara } from "../src/data/rede-apoio";

const ids = (vinculo: string) =>
  servicosPara(["psicologia", "academia"], "campinas", vinculo).map((s) => s.id);

test("convidado não recebe serviço que depende do RH da unidade", () => {
  const sugeridos = ids("convidado");
  assert.ok(!sugeridos.includes("convenio-psicologia"));
  assert.ok(!sugeridos.includes("academias-convenio"));
  assert.ok(sugeridos.includes("caps"), "os canais públicos continuam");
});

test("servidor e terceirizado continuam vendo os convênios", () => {
  for (const vinculo of ["servidor", "terceirizado"]) {
    const sugeridos = ids(vinculo);
    assert.ok(sugeridos.includes("convenio-psicologia"), vinculo);
    assert.ok(sugeridos.includes("academias-convenio"), vinculo);
  }
});
