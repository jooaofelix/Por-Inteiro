/**
 * Rede de apoio sugerida no resultado.
 *
 * SOBRE A CONFIABILIDADE DOS DADOS
 * --------------------------------
 * Encaminhar alguém para um serviço de saúde que não existe, mudou de endereço
 * ou não atende aquele caso é pior do que não encaminhar. Por isso as entradas
 * são de dois tipos:
 *
 *  1. `verificado: true`  — canais públicos nacionais e estaduais de acesso
 *     estável (CVV 188, SAMU 192, Disque Saúde 136, a porta de entrada da UBS,
 *     do CAPS, do CRAS). São portas de entrada, não unidades específicas, e é
 *     por isso que não envelhecem.
 *
 *  2. `verificado: false` — vagas regionais com o formato pronto, para a equipe
 *     da Fundação preencher com a rede real de cada unidade (o psicólogo que
 *     atende o convênio, a academia com convênio do servidor, a clínica-escola
 *     da faculdade da cidade). Enquanto estiverem assim, a interface as mostra
 *     em um bloco separado, avisando que precisam de confirmação.
 *
 * Nada aqui foi preenchido com telefone ou endereço adivinhado.
 *
 * Quando a rede real crescer e passar a ser mantida pela equipe (e não por
 * alteração de código), este arquivo vira uma tabela no banco com CRUD no
 * painel administrativo — a forma dos dados já está pensada para isso.
 */

import type { TipoServico } from "@/data/questionario";

export type Servico = {
  id: string;
  nome: string;
  tipos: TipoServico[];
  descricao: string;
  /** Slugs de `REGIOES`, ou "todas" para canais de alcance nacional/estadual. */
  regioes: string[] | "todas";
  contato?: string;
  site?: string;
  gratuito: boolean;
  /** Ver o bloco "sobre a confiabilidade dos dados" no topo do arquivo. */
  verificado: boolean;
  /** Aparece no topo da lista e no painel de urgência. */
  urgencia?: boolean;
};

export const SERVICOS: Servico[] = [
  // ---------------------------------------------------------------------
  // Urgência — sempre visíveis, independentemente de região e de resultado
  // ---------------------------------------------------------------------
  {
    id: "cvv",
    nome: "CVV — Centro de Valorização da Vida",
    tipos: ["emergencia", "psicologia"],
    descricao:
      "Apoio emocional por telefone, chat e e-mail, 24 horas por dia, todos os dias. Sigiloso e gratuito. Não é preciso estar em crise para ligar.",
    regioes: "todas",
    contato: "188",
    site: "https://cvv.org.br",
    gratuito: true,
    verificado: true,
    urgencia: true,
  },
  {
    id: "samu",
    nome: "SAMU — Emergência médica",
    tipos: ["emergencia"],
    descricao:
      "Para risco imediato à vida, seu ou de outra pessoa. Atende 24 horas.",
    regioes: "todas",
    contato: "192",
    gratuito: true,
    verificado: true,
    urgencia: true,
  },

  // ---------------------------------------------------------------------
  // Portas de entrada do SUS e da assistência — válidas em todo o estado
  // ---------------------------------------------------------------------
  {
    id: "ubs",
    nome: "UBS — Unidade Básica de Saúde do seu bairro",
    tipos: ["ubs", "nutricao", "psicologia", "fisioterapia"],
    descricao:
      "Porta de entrada para consulta de rotina, exames, encaminhamento para nutrição, fisioterapia e saúde mental. Atende por endereço de moradia, sem necessidade de encaminhamento.",
    regioes: "todas",
    contato: "Disque Saúde 136 informa a UBS do seu endereço",
    gratuito: true,
    verificado: true,
  },
  {
    id: "caps",
    nome: "CAPS — Centro de Atenção Psicossocial",
    tipos: ["caps", "psicologia", "psiquiatria"],
    descricao:
      "Atendimento em saúde mental para sofrimento persistente ou intenso, com equipe de psicologia, psiquiatria e terapia ocupacional. Não exige encaminhamento: dá para chegar por conta própria.",
    regioes: "todas",
    contato: "Disque Saúde 136 ou a UBS mais próxima indicam o CAPS de referência",
    gratuito: true,
    verificado: true,
  },
  {
    id: "caps-ad",
    nome: "CAPS AD — Álcool e outras drogas",
    tipos: ["caps_ad", "psicologia"],
    descricao:
      "Atendimento específico para uso de álcool, tabaco e outras drogas, sem exigência de abstinência prévia e sem julgamento. Acesso direto.",
    regioes: "todas",
    contato: "Disque Saúde 136 ou a UBS mais próxima",
    gratuito: true,
    verificado: true,
  },
  {
    id: "cras",
    nome: "CRAS — Centro de Referência de Assistência Social",
    tipos: ["assistencia_social"],
    descricao:
      "Grupos de convivência, orientação e apoio às famílias no território. Atende qualquer pessoa da região, não só quem está em situação de vulnerabilidade extrema.",
    regioes: "todas",
    contato: "Prefeitura da sua cidade informa o CRAS do seu bairro",
    gratuito: true,
    verificado: true,
  },
  {
    id: "cerest",
    nome: "CEREST — Centro de Referência em Saúde do Trabalhador",
    tipos: ["assistencia_social", "ubs", "psicologia"],
    descricao:
      "Serviço do SUS voltado a adoecimento relacionado ao trabalho, inclusive sofrimento mental de origem ocupacional. Orienta sobre nexo causal, notificação e direitos.",
    regioes: "todas",
    contato: "Disque Saúde 136 ou a Secretaria Municipal de Saúde",
    gratuito: true,
    verificado: true,
  },
  {
    id: "academia-da-saude",
    nome: "Polo da Academia da Saúde / academia ao ar livre",
    tipos: ["educacao_fisica", "esporte_publico", "academia"],
    descricao:
      "Programa do SUS com prática de exercício orientada por profissional de educação física em praças e unidades de saúde. Disponibilidade varia por município.",
    regioes: "todas",
    contato: "Pergunte na UBS do seu bairro se há polo na região",
    gratuito: true,
    verificado: true,
  },
  {
    id: "clinica-escola",
    nome: "Clínica-escola de Psicologia",
    tipos: ["psicologia"],
    descricao:
      "Faculdades com curso de Psicologia mantêm atendimento gratuito ou de baixo custo, supervisionado por professores. Costuma haver fila, então vale entrar na lista cedo.",
    regioes: "todas",
    contato: "Procure pelas faculdades de Psicologia da sua cidade",
    gratuito: true,
    verificado: true,
  },
  {
    id: "sesc",
    nome: "SESC — unidades do estado de São Paulo",
    tipos: ["esporte_publico", "educacao_fisica", "academia", "nutricao"],
    descricao:
      "Atividade física orientada, esporte, alimentação e programação de convivência. Valores reduzidos para trabalhador do comércio e serviços; parte da programação é aberta ao público.",
    regioes: "todas",
    site: "https://www.sescsp.org.br",
    gratuito: false,
    verificado: true,
  },

  // ---------------------------------------------------------------------
  // Rede regional — a preencher com a equipe de cada unidade
  //
  // Duplique um destes blocos por serviço real, complete `contato` e vire
  // `verificado` para `true`. Enquanto estiver `false`, a interface mostra o
  // aviso de que a informação ainda não foi confirmada.
  // ---------------------------------------------------------------------
  {
    id: "convenio-psicologia",
    nome: "Psicólogos conveniados ao plano de saúde do servidor",
    tipos: ["psicologia", "psiquiatria"],
    descricao:
      "Rede credenciada do plano de saúde, com coparticipação. A lista atualizada precisa ser levantada junto ao RH da unidade.",
    regioes: "todas",
    contato: "A confirmar com o RH / setor de benefícios da unidade",
    gratuito: false,
    verificado: false,
  },
  {
    id: "academias-convenio",
    nome: "Academias e estúdios com convênio para servidores",
    tipos: ["academia", "educacao_fisica"],
    descricao:
      "Descontos negociados localmente com academias próximas às unidades. Varia por cidade.",
    regioes: "todas",
    contato: "A confirmar com o RH / setor de benefícios da unidade",
    gratuito: false,
    verificado: false,
  },
  {
    id: "nutricao-regional",
    nome: "Ambulatório de nutrição da região",
    tipos: ["nutricao"],
    descricao:
      "Atendimento nutricional em ambulatório do SUS ou clínica-escola de Nutrição. A unidade de referência muda de cidade para cidade.",
    regioes: "todas",
    contato: "A confirmar — peça encaminhamento na UBS",
    gratuito: true,
    verificado: false,
  },
];

/**
 * Serviços sugeridos para uma pessoa, dados os tipos de encaminhamento que o
 * resultado apontou e a região informada.
 *
 * Ordem: urgência primeiro, depois verificados, depois o resto — é a ordem em
 * que as informações são confiáveis.
 */
export function servicosPara(
  tipos: TipoServico[],
  regiao: string,
): Servico[] {
  const procurados = new Set(tipos);

  return SERVICOS.filter((servico) => {
    const atendeRegiao =
      servico.regioes === "todas" || servico.regioes.includes(regiao);
    const atendeTipo = servico.tipos.some((t) => procurados.has(t));
    return atendeRegiao && atendeTipo;
  }).sort((a, b) => {
    if (a.urgencia !== b.urgencia) return a.urgencia ? -1 : 1;
    if (a.verificado !== b.verificado) return a.verificado ? -1 : 1;
    return 0;
  });
}

export function servicosDeUrgencia(): Servico[] {
  return SERVICOS.filter((s) => s.urgencia);
}
