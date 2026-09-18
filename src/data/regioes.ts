/**
 * Recorte territorial usado para (a) filtrar a rede de apoio e (b) agrupar os
 * relatórios da gestão.
 *
 * Trabalhamos com REGIÃO, não com CEP completo. O CEP que a pessoa digita é
 * convertido em região ainda no navegador e descartado em seguida — o que
 * trafega e o que é gravado é apenas o slug. Um CEP completo, somado a função
 * e faixa etária, seria suficiente para identificar alguém numa unidade
 * pequena; a região não é.
 *
 * Os prefixos abaixo cobrem o estado de São Paulo (CEPs 01000-000 a
 * 19999-999). São uma aproximação das faixas dos Correios, boa o bastante para
 * sugerir serviços próximos. Ajuste conforme a implantação em cada unidade.
 */

export type Regiao = {
  slug: string;
  nome: string;
  /** Cidades-âncora, exibidas para a pessoa confirmar que escolheu certo. */
  referencias: string;
  /** Prefixos de CEP (2 primeiros dígitos) atendidos pela região. */
  prefixosCep: string[];
};

export const REGIOES: Regiao[] = [
  {
    slug: "sp-capital",
    nome: "São Paulo — Capital",
    referencias: "Todas as zonas da capital",
    prefixosCep: ["01", "02", "03", "04", "05", "08"],
  },
  {
    slug: "grande-sp-oeste",
    nome: "Grande SP — Oeste",
    referencias: "Osasco, Barueri, Carapicuíba, Itapevi, Cotia",
    prefixosCep: ["06"],
  },
  {
    slug: "grande-sp-norte",
    nome: "Grande SP — Norte e Leste",
    referencias: "Guarulhos, Arujá, Itaquaquecetuba, Mogi das Cruzes",
    prefixosCep: ["07"],
  },
  {
    slug: "abc",
    nome: "ABC Paulista",
    referencias: "Santo André, São Bernardo, São Caetano, Diadema, Mauá",
    prefixosCep: ["09"],
  },
  {
    slug: "baixada-santista",
    nome: "Baixada Santista e Vale do Ribeira",
    referencias: "Santos, São Vicente, Guarujá, Praia Grande, Registro",
    prefixosCep: ["11"],
  },
  {
    slug: "vale-paraiba",
    nome: "Vale do Paraíba e Litoral Norte",
    referencias: "São José dos Campos, Taubaté, Jacareí, Caraguatatuba",
    prefixosCep: ["12"],
  },
  {
    slug: "campinas",
    nome: "Campinas e região",
    referencias: "Campinas, Piracicaba, Limeira, Americana, Jundiaí",
    prefixosCep: ["13"],
  },
  {
    slug: "ribeirao-preto",
    nome: "Ribeirão Preto, Franca e Araraquara",
    referencias: "Ribeirão Preto, Franca, Araraquara, São Carlos, Barretos",
    prefixosCep: ["14"],
  },
  {
    slug: "rio-preto",
    nome: "São José do Rio Preto e região",
    referencias: "São José do Rio Preto, Catanduva, Votuporanga",
    prefixosCep: ["15"],
  },
  {
    slug: "aracatuba",
    nome: "Araçatuba e região",
    referencias: "Araçatuba, Birigui, Andradina, Penápolis",
    prefixosCep: ["16"],
  },
  {
    slug: "bauru",
    nome: "Bauru, Marília e região",
    referencias: "Bauru, Marília, Jaú, Lins, Tupã",
    prefixosCep: ["17"],
  },
  {
    slug: "sorocaba",
    nome: "Sorocaba e região",
    referencias: "Sorocaba, Itapetininga, Botucatu, Itu, Avaré",
    prefixosCep: ["18"],
  },
  {
    slug: "presidente-prudente",
    nome: "Presidente Prudente e região",
    referencias: "Presidente Prudente, Assis, Ourinhos, Dracena",
    prefixosCep: ["19"],
  },
  {
    slug: "outra",
    nome: "Outra região / prefiro não informar",
    referencias: "Mostramos apenas os canais de alcance nacional",
    prefixosCep: [],
  },
];

const PORSLUG = new Map(REGIOES.map((r) => [r.slug, r]));

export function buscarRegiao(slug: string | null | undefined): Regiao | undefined {
  return slug ? PORSLUG.get(slug) : undefined;
}

export function ehRegiaoValida(slug: string): boolean {
  return PORSLUG.has(slug);
}

/**
 * Converte um CEP em região. Recebe o CEP com ou sem máscara e usa apenas os
 * dois primeiros dígitos — o restante é ignorado de propósito.
 *
 * Retorna `null` quando o CEP está incompleto ou fora do estado de São Paulo,
 * e nesses casos a pessoa escolhe a região na lista.
 */
export function regiaoPorCep(cep: string): Regiao | null {
  const digitos = cep.replace(/\D/g, "");
  if (digitos.length < 5) return null;

  const prefixo = digitos.slice(0, 2);
  return REGIOES.find((r) => r.prefixosCep.includes(prefixo)) ?? null;
}
